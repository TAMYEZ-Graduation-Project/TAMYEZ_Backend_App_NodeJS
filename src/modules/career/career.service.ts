import type { Request, Response } from "express";
import { CareerModel, RoadmapStepModel } from "../../db/models/index.ts";
import {
  CareerRepository,
  RoadmapStepRepository,
} from "../../db/repositories/index.ts";
import successHandler from "../../utils/handlers/success.handler.ts";
import type {
  CreateCareerBodyDto,
  UpdateCareerBodyDto,
  UpdateCareerParamsDto,
  UploadCareerPictureBodyDto,
  UploadCareerPictureParamsDto,
} from "./career.dto.ts";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ServerException,
} from "../../utils/exceptions/custom.exceptions.ts";
import type {
  FullICareerResource,
  ICareerResource,
} from "../../db/interfaces/common.interface.ts";
import EnvFields from "../../utils/constants/env_fields.constants.ts";
import S3Service from "../../utils/multer/s3.service.ts";
import IdSecurityUtil from "../../utils/security/id.security.ts";
import S3FoldersPaths from "../../utils/multer/s3_folders_paths.ts";
import S3KeyUtil from "../../utils/multer/s3_key.multer.ts";
import { CareerResourceAppliesToEnum } from "../../utils/constants/enum.constants.ts";
import { Types, type UpdateAggregationStage } from "mongoose";
import type { ICareer } from "../../db/interfaces/career.interface.ts";

class CareerService {
  private readonly _careerRepository = new CareerRepository(CareerModel);
  private readonly _roadmapStepRepository = new RoadmapStepRepository(
    RoadmapStepModel
  );

  private getResourceSpecifiedStepsIds = (
    resources: ICareerResource[]
  ): Set<string> => {
    const specifiedStepsIdsSet = new Set<string>();
    if (resources?.length) {
      for (const resource of resources) {
        if (
          resource.appliesTo === CareerResourceAppliesToEnum.specific &&
          resource.specifiedSteps?.length
        ) {
          resource.specifiedSteps.forEach((stepId) =>
            specifiedStepsIdsSet.add(stepId.toString())
          );
        }
      }
    }
    return specifiedStepsIdsSet;
  };

  createCareer = async (req: Request, res: Response): Promise<Response> => {
    const { title, description, courses, youtubePlaylists, books } = req
      .validationResult.body as CreateCareerBodyDto;

    const careerExists = await this._careerRepository.findOne({
      filter: { title, paranoid: false },
    });
    if (careerExists) {
      throw new ConflictException(
        `Career title conflicts with another ${
          careerExists.freezed?.at ? "archived " : ""
        }career ❌`
      );
    }

    const [newCareer] = await this._careerRepository.create({
      data: [
        {
          title,
          description,
          assetFolderId: IdSecurityUtil.generateAlphaNumericId(),
          pictureUrl: process.env[
            EnvFields.CAREER_DEFAULT_PICTURE_URL
          ] as string,
          courses: courses as unknown as ICareerResource[],
          youtubePlaylists: youtubePlaylists as unknown as ICareerResource[],
          books: books as unknown as ICareerResource[],
        },
      ],
    });

    if (!newCareer) {
      throw new ServerException(
        `Failed to create career, please try again later ☹️`
      );
    }

    return successHandler({ res, message: "Career created successfully ✅" });
  };

  uploadCareerPicture = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { careerId } = req.params as UploadCareerPictureParamsDto;
    const { attachment } = req.body as UploadCareerPictureBodyDto;

    const career = await this._careerRepository.findOne({
      filter: { _id: careerId },
    });

    if (!career) {
      throw new NotFoundException("Invalid careerId or career freezed ❌");
    }

    const [_, subKey] = await Promise.all([
      career.pictureUrl &&
      career.pictureUrl != process.env[EnvFields.CAREER_DEFAULT_PICTURE_URL]
        ? S3Service.deleteFile({ SubKey: career.pictureUrl })
        : undefined,
      S3Service.uploadFile({
        File: attachment,
        Path: S3FoldersPaths.careerFolderPath(career.assetFolderId),
      }),
    ]);

    await career.updateOne({ pictureUrl: subKey });

    return successHandler({
      res,
      body: {
        pictureUrl: S3KeyUtil.generateS3UploadsUrlFromSubKey(subKey),
      },
    });
  };

  updateCareer = async (req: Request, res: Response): Promise<Response> => {
    const { careerId } = req.params as UpdateCareerParamsDto;
    const body = req.validationResult.body as UpdateCareerBodyDto;

    const career = await this._careerRepository.findOne({
      filter: { _id: careerId },
    });

    if (!career) {
      throw new NotFoundException("Invalid careerId or career freezed ❌");
    }

    // check on specfiedSteps existence
    const specifiedStepsIdsSet = new Set<string>([
      ...this.getResourceSpecifiedStepsIds(
        body.courses as unknown as ICareerResource[]
      ).values(),
      ...this.getResourceSpecifiedStepsIds(
        body.youtubePlaylists as unknown as ICareerResource[]
      ).values(),
      ...this.getResourceSpecifiedStepsIds(
        body.books as unknown as ICareerResource[]
      ).values(),
    ]);

    if (specifiedStepsIdsSet.size > 0) {
      const existingStepsCount =
        await this._roadmapStepRepository.countDocuments({
          filter: { _id: { $in: Array.from(specifiedStepsIdsSet) } },
        });

      if (existingStepsCount !== specifiedStepsIdsSet.size) {
        throw new NotFoundException(
          `One or more specifiedSteps do not exist ❌`
        );
      }
    }

    if (
      this._getTotalResourceCount({
        currentResources: career.courses as FullICareerResource[],
        removeResources: body.removeCourses,
        newResourcesCount: body.courses?.length ?? 0,
      }) > 5 ||
      this._getTotalResourceCount({
        currentResources: career.youtubePlaylists as FullICareerResource[],
        removeResources: body.removeYoutubePlaylists,
        newResourcesCount: body.youtubePlaylists?.length ?? 0,
      }) > 5 ||
      this._getTotalResourceCount({
        currentResources: career.books as FullICareerResource[],
        removeResources: body.removeBooks,
        newResourcesCount: body.books?.length ?? 0,
      }) > 5
    ) {
      throw new BadRequestException(
        "Each career resource list (courses | youtubePlaylists | books) must be at most 5 items length ❌"
      );
    }

    const toUpdate: Partial<ICareer> = {};
    if (body.title) toUpdate.title = body.title;
    if (body.description) toUpdate.description = body.description;

    await this._careerRepository.updateOne<[]>({
      filter: { _id: careerId },
      update: [
        { $set: { ...toUpdate } },
        ...(body.courses
          ? CareerService.buildUniqueAppendStages({
              fieldName: "courses",
              newItems: body.courses?.map<ICareerResource>((rs) => {
                return {
                  ...rs,
                  specifiedSteps:
                    rs.specifiedSteps?.map<Types.ObjectId>((id) =>
                      Types.ObjectId.createFromHexString(id)
                    ) ?? [],
                };
              }),
              removeIds: body.removeCourses?.map((id) =>
                Types.ObjectId.createFromHexString(id)
              ),
            })
          : []),
        ...(body.youtubePlaylists
          ? CareerService.buildUniqueAppendStages({
              fieldName: "youtubePlaylists",
              newItems: body.youtubePlaylists?.map<ICareerResource>((rs) => {
                return {
                  ...rs,
                  specifiedSteps:
                    rs.specifiedSteps?.map<Types.ObjectId>((id) =>
                      Types.ObjectId.createFromHexString(id)
                    ) ?? [],
                };
              }),
              removeIds: body.removeYoutubePlaylists?.map((id) =>
                Types.ObjectId.createFromHexString(id)
              ),
            })
          : []),
        ...(body.books
          ? CareerService.buildUniqueAppendStages({
              fieldName: "books",
              newItems: body.books?.map<ICareerResource>((rs) => {
                return {
                  ...rs,
                  specifiedSteps:
                    rs.specifiedSteps?.map<Types.ObjectId>((id) =>
                      Types.ObjectId.createFromHexString(id)
                    ) ?? [],
                };
              }),
              removeIds: body.removeBooks?.map((id) =>
                Types.ObjectId.createFromHexString(id)
              ),
            })
          : []),
      ],
    });

    return successHandler({ res });
  };

  private _getTotalResourceCount({
    currentResources,
    removeResources,
    newResourcesCount,
  }: {
    currentResources: FullICareerResource[];
    removeResources?: string[] | undefined;
    newResourcesCount: number;
  }) {
    if (currentResources.length === 0) {
      return newResourcesCount;
    } else if (!removeResources || !removeResources.length) {
      return currentResources.length + newResourcesCount;
    }
    let totalCourses: number = currentResources.length + newResourcesCount;
    for (const removeResource of removeResources) {
      if (
        currentResources.findIndex((c) =>
          (c as FullICareerResource)._id.equals(removeResource)
        ) !== -1
      ) {
        totalCourses--;
      }
    }
    return totalCourses;
  }

  static buildUniqueAppendStages({
    fieldName,
    removeIds = [],
    newItems,
  }: {
    fieldName: string;
    removeIds: Types.ObjectId[] | undefined;
    newItems: ICareerResource[];
  }): UpdateAggregationStage[] {
    // const arrPath = `$${fieldName}`;
    const tmpTitles = `_${fieldName}_titles`;
    const tmpUrls = `_${fieldName}_urls`;
    const tmpToAdd = `_${fieldName}_toAdd`;

    return [
      // 1️⃣ Remove by _id
      {
        $set: {
          [fieldName]: {
            $filter: {
              input: `$${fieldName}`,
              as: "it",
              cond: { $not: { $in: ["$$it._id", removeIds] } },
            },
          },
        },
      },

      // 2️⃣ Compute title/url sets FROM UPDATED ARRAY
      {
        $set: {
          [tmpTitles]: {
            $filter: {
              input: {
                $map: { input: `$${fieldName}`, as: "it", in: "$$it.title" },
              },
              as: "t",
              cond: { $and: [{ $ne: ["$$t", null] }, { $ne: ["$$t", ""] }] },
            },
          },
          [tmpUrls]: {
            $filter: {
              input: {
                $map: { input: `$${fieldName}`, as: "it", in: "$$it.url" },
              },
              as: "u",
              cond: { $and: [{ $ne: ["$$u", null] }, { $ne: ["$$u", ""] }] },
            },
          },
        },
      },

      // 3️⃣ Filter new items
      {
        $set: {
          [tmpToAdd]: {
            $filter: {
              input: newItems, // literal array (OK)
              as: "ni",
              cond: {
                $and: [
                  { $not: { $in: ["$$ni.title", `$${tmpTitles}`] } },
                  { $not: { $in: ["$$ni.url", `$${tmpUrls}`] } },
                ],
              },
            },
          },
        },
      },

      // 4️⃣ Ensure _id
      {
        $set: {
          [tmpToAdd]: {
            $map: {
              input: `$${tmpToAdd}`,
              as: "x",
              in: {
                $mergeObjects: [
                  {
                    _id: {
                      $ifNull: [
                        "$$x._id",
                        {
                          $function: {
                            body: "return new ObjectId();",
                            args: [],
                            lang: "js",
                          },
                        },
                      ],
                    },
                  },
                  "$$x",
                ],
              },
            },
          },
        },
      },

      // 5️⃣ Append to UPDATED ARRAY
      {
        $set: {
          [fieldName]: {
            $concatArrays: [`$${fieldName}`, `$${tmpToAdd}`],
          },
        },
      },

      // 6️⃣ Cleanup
      { $unset: [tmpTitles, tmpUrls, tmpToAdd] },
    ];
  }
}

export default CareerService;
