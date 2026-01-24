import {
  CareerModel,
  QuizModel,
  RoadmapStepModel,
} from "../../db/models/index.ts";
import {
  CareerRepository,
  QuizRepository,
  RoadmapStepRepository,
} from "../../db/repositories/index.ts";
import type { Request, Response } from "express";
import successHandler from "../../utils/handlers/success.handler.ts";
import type {
  UpdateRoadmapStepBodyDto,
  CreateRoadmapStepBodyDto,
  UpdateRoadmapStepParamsDto,
  UpdateRoadmapStepResourceParamsDto,
  UpdateRoadmapResourceStepBodyDto,
  GetRoadmapQueryDto,
  GetRoadmapParamsDto,
  GetRoadmapStepParamsDto,
} from "./roadmap.dto.ts";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ServerException,
} from "../../utils/exceptions/custom.exceptions.ts";
import { startSession, Types, type UpdateAggregationStage } from "mongoose";
import type {
  FullICareer,
  ICareer,
} from "../../db/interfaces/career.interface.ts";
import type {
  FullIRoadmapStepResource,
  IRoadmapStepResource,
} from "../../db/interfaces/common.interface.ts";
import type { IRoadmapStep } from "../../db/interfaces/roadmap_step.interface.ts";
import S3Service from "../../utils/multer/s3.service.ts";
import S3FoldersPaths from "../../utils/multer/s3_folders_paths.ts";
import listUpdateFieldsHandler from "../../utils/handlers/list_update_fields.handler.ts";
import type { UpdateRoadmapStepResourceResponse } from "./roadmap.entity.ts";
import { isNumberBetweenOrEqual } from "../../utils/validators/numeric.validator.ts";

class RoadmapService {
  private readonly _careerRepository = new CareerRepository(CareerModel);
  private readonly _roadmapStepRepository = new RoadmapStepRepository(
    RoadmapStepModel,
  );
  private readonly _quizRespoistory = new QuizRepository(QuizModel);

  async checkAndUpdateOrder({
    career,
    order,
  }: {
    career: FullICareer;
    order?: number | undefined;
  }) {
    if (order && order > 0) {
      if (order <= career.stepsCount && career.stepsCount > 0) {
        const session = await startSession();
        await session.withTransaction(async () => {
          await this._roadmapStepRepository.updateMany({
            filter: {
              careerId: career._id,
              order: { $gte: Number(order) },
            },
            update: {
              $inc: { order: 500 },
            },
            options: { session },
          });

          await this._roadmapStepRepository.updateMany({
            filter: { careerId: career._id, order: { $gt: 500 } },
            update: {
              $inc: { order: -499 },
            },
            options: { session },
          });
        });
        session.endSession();
      } else if (order > career.stepsCount + 1) {
        throw new BadRequestException(
          `Step order must be sequential with no gaps. Current stepsCount is ${career.stepsCount} ❌`,
        );
      }
    }
  }

  private async _checkQuizzesExists({
    quizzesIds,
  }: {
    quizzesIds: string[] | undefined;
  }): Promise<void> {
    if (!quizzesIds?.length) {
      return;
    }
    if (
      (await this._quizRespoistory.countDocuments({
        filter: {
          _id: {
            $in: [
              quizzesIds.map((id) => Types.ObjectId.createFromHexString(id)),
            ],
          },
        },
      })) !== quizzesIds.length
    ) {
      throw new NotFoundException("some of quizzes are not found ❌");
    }
  }

  createRoadmapStep = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    const {
      careerId,
      title,
      order,
      description,
      courses,
      youtubePlaylists,
      books,
      quizzesIds,
      allowGlobalResources,
    } = req.validationResult.body as CreateRoadmapStepBodyDto;

    const career = await this._careerRepository.findOne({
      filter: { _id: careerId },
    });
    if (!career) {
      throw new NotFoundException("Invalid careerId or career freezed ❌");
    }

    const stepExists = await this._roadmapStepRepository.findOne({
      filter: { careerId, title },
    });

    if (stepExists) {
      throw new ConflictException("Step with this title already exists ❌");
    }

    this._checkQuizzesExists({ quizzesIds });

    /// check order
    await this.checkAndUpdateOrder({ career, order });

    const [newStep] = await this._roadmapStepRepository.create({
      data: [
        {
          careerId: careerId as unknown as Types.ObjectId,
          title,
          order: order ?? career.stepsCount + 1,
          description,
          courses,
          youtubePlaylists,
          books,
          quizzesIds: quizzesIds as unknown as Types.ObjectId[],
          allowGlobalResources,
        },
      ],
    });

    if (!newStep) {
      throw new ServerException(
        "Failed to create roadmap step, please try again ❌",
      );
    }

    await this._careerRepository.updateOne({
      filter: { _id: careerId, __v: career.__v },
      update: { $inc: { stepsCount: 1 } },
    });

    return successHandler({
      res,
      message: "Roadmap step created successfully ✅",
    });
  };

  getRoadmap = ({ archived = false }: { archived?: boolean } = {}) => {
    return async (req: Request, res: Response): Promise<Response> => {
      const { careerId } = req.params as GetRoadmapParamsDto;
      const { page, size, searchKey } = req.validationResult
        .query as GetRoadmapQueryDto;

      const career = await this._careerRepository.findOne({
        filter: {
          _id: careerId,
          ...(archived ? { paranoid: false, freezed: { $exists: true } } : {}),
        },
      });

      if (!career) {
        throw new NotFoundException(
          archived
            ? "Archived career is NOT found 🔍❌"
            : "Career is NOT found 🔍❌",
        );
      }

      const result = await this._roadmapStepRepository.paginate({
        filter: {
          careerId,
          ...(searchKey
            ? {
                $or: [
                  { title: { $regex: searchKey, $options: "i" } },
                  {
                    description: { $regex: searchKey, $options: "i" },
                  },
                ],
              }
            : {}),
          ...(archived ? { paranoid: false, freezed: { $exists: true } } : {}),
        },
        page,
        size,
        maxAllCount: 60,
        options: {
          projection: {
            courses: 0,
            youtubePlaylists: 0,
            books: 0,
            quizzesIds: 0,
          },
        },
      });

      if (!result.data || result.data.length == 0) {
        throw new NotFoundException(
          archived ? "No archived roadmap found 🔍❌" : "No roadmap found 🔍❌",
        );
      }

      return successHandler({ res, body: result });
    };
  };

  getRoadmapStep = ({ archived = false }: { archived?: boolean } = {}) => {
    return async (req: Request, res: Response): Promise<Response> => {
      const { roadmapStepId } = req.params as GetRoadmapStepParamsDto;

      const result = await this._roadmapStepRepository.findOne({
        filter: {
          _id: roadmapStepId,
          ...(archived ? { paranoid: false, freezed: { $exists: true } } : {}),
        },
        options: {
          populate: [
            {
              path: "career",
              match: {
                ...(!archived ? { freezed: { $exists: false } } : undefined),
              },
            },
            {
              path: "quizzesIds",
              match: { freezed: { $exists: false } },
              options: {
                projection: {
                  title: 1,
                  description: 1,
                  duration: 1,
                },
              },
            },
          ],
        },
      });

      if (!result || !result.careerId) {
        throw new NotFoundException(
          archived
            ? "No archived roadmapStep found or career is NOT freezed 🔍❌"
            : "No roadmapStep found or career is freezed 🔍❌",
        );
      }

      return successHandler({ res, body: result });
    };
  };

  updateRoadmapStep = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    const { roadmapStepId } = req.params as UpdateRoadmapStepParamsDto;
    const body = req.validationResult.body as UpdateRoadmapStepBodyDto;

    const roadmapStep = await this._roadmapStepRepository.findOne({
      filter: { _id: roadmapStepId },
      options: {
        populate: [{ path: "careerId", select: "freezed stepsCount" }],
      },
    });

    if (!roadmapStep || (roadmapStep.careerId as unknown as ICareer).freezed) {
      throw new NotFoundException(
        "Invalid roadmapStepId, roadmapStep is freezed or its career is freezed ❌",
      );
    }

    if (
      !isNumberBetweenOrEqual({
        value: RoadmapService.getTotalResourceCount({
          currentResources: roadmapStep.courses as FullIRoadmapStepResource[],
          removeResources: body.removeCourses,
          newResourcesCount: body.courses?.length ?? 0,
        }),
        min: 1,
        max: 5,
      }) ||
      !isNumberBetweenOrEqual({
        value: RoadmapService.getTotalResourceCount({
          currentResources:
            roadmapStep.youtubePlaylists as FullIRoadmapStepResource[],
          removeResources: body.removeYoutubePlaylists,
          newResourcesCount: body.youtubePlaylists?.length ?? 0,
        }),
        min: 1,
        max: 5,
      }) ||
      RoadmapService.getTotalResourceCount({
        currentResources: roadmapStep.books as FullIRoadmapStepResource[],
        removeResources: body.removeBooks,
        newResourcesCount: body.books?.length ?? 0,
      }) > 5 ||
      !isNumberBetweenOrEqual({
        value: RoadmapService.getTotalResourceCount({
          currentResources: roadmapStep.quizzesIds as Types.ObjectId[],
          removeResources: body.removeQuizzesIds,
          newResourcesCount: body.quizzesIds?.length ?? 0,
        }),
        min: 1,
        max: 5,
      })
    ) {
      throw new BadRequestException(
        "Each roadmap step list (courses | youtubePlaylists | books | quizzes) must be at most 5 items length, and only (courses | youtubePlaylists | quizzes) must be at least 1 item length ❌",
      );
    }

    this._checkQuizzesExists({ quizzesIds: body.quizzesIds });

    const session = await startSession();
    await session.withTransaction(async () => {
      if (body.order && body.order != roadmapStep.order) {
        await this._roadmapStepRepository.updateMany({
          filter: {
            careerId: (roadmapStep.careerId as unknown as FullICareer)._id,
            order: {
              $gte: Math.min(body.order, roadmapStep.order),
              $lte: Math.max(body.order, roadmapStep.order),
            },
          },
          update: { $inc: { order: 700 } },
          options: { session },
        });
      }

      const toUpdate: Partial<IRoadmapStep> = {};
      if (body.title) toUpdate.title = body.title;
      if (body.order && roadmapStep.order !== body.order)
        toUpdate.order = body.order;
      if (body.description) toUpdate.description = body.description;
      if (body.allowGlobalResources != undefined)
        toUpdate.allowGlobalResources = body.allowGlobalResources;

      await this._roadmapStepRepository.updateOne<[]>({
        filter: { _id: roadmapStepId, __v: body.v },
        update: [
          {
            $set: {
              ...toUpdate,
              ...{
                quizzesIds: {
                  $setUnion: [
                    {
                      $setDifference: [
                        "$quizzesIds",
                        body.removeQuizzesIds?.map((quiz) =>
                          Types.ObjectId.createFromHexString(quiz),
                        ) ?? [],
                      ],
                    },
                    body.quizzesIds?.map((quiz) =>
                      Types.ObjectId.createFromHexString(quiz),
                    ) ?? [],
                  ],
                },
              },
            },
          },
          ...RoadmapService.buildUniqueAppendStages({
            fieldName: "courses",
            newItems: body.courses,
            removeIds: body.removeCourses?.map((id) =>
              Types.ObjectId.createFromHexString(id),
            ),
          }),
          ...RoadmapService.buildUniqueAppendStages({
            fieldName: "youtubePlaylists",
            newItems: body.youtubePlaylists,
            removeIds: body.removeYoutubePlaylists?.map((id) =>
              Types.ObjectId.createFromHexString(id),
            ),
          }),
          ...RoadmapService.buildUniqueAppendStages({
            fieldName: "books",
            newItems: body.books,
            removeIds: body.removeBooks?.map((id) =>
              Types.ObjectId.createFromHexString(id),
            ),
          }),
        ],
        options: { session },
      });

      if (body.order && body.order != roadmapStep.order) {
        await this._roadmapStepRepository.updateMany({
          filter: {
            careerId: (roadmapStep.careerId as unknown as FullICareer)._id,
            order: { $gte: Math.min(body.order, roadmapStep.order) + 700 },
          },
          update: {
            $inc: {
              order: body.order < roadmapStep.order ? -699 : -701,
            },
          },
          options: { session },
        });
      }
    });

    return successHandler({ res });
  };

  static getTotalResourceCount({
    currentResources,
    removeResources,
    newResourcesCount,
  }: {
    currentResources: FullIRoadmapStepResource[] | Types.ObjectId[];
    removeResources?: string[] | undefined;
    newResourcesCount: number;
  }) {
    if (!currentResources?.length) {
      return newResourcesCount;
    } else if (!removeResources || !removeResources.length) {
      return currentResources.length + newResourcesCount;
    }
    let totalResources: number = currentResources.length + newResourcesCount;
    for (const removeResource of removeResources) {
      if (
        currentResources.findIndex((c) => {
          return Types.ObjectId.isValid(c.toString())
            ? (c as Types.ObjectId).equals(removeResource)
            : (c as FullIRoadmapStepResource)._id.equals(removeResource);
        }) !== -1
      ) {
        totalResources--;
      }
    }
    return totalResources;
  }

  static buildUniqueAppendStages({
    fieldName,
    removeIds,
    newItems,
  }: {
    fieldName: string;
    removeIds?: Types.ObjectId[] | undefined;
    newItems?: IRoadmapStepResource[] | undefined;
  }): UpdateAggregationStage[] {
    const tmpTitles = `_${fieldName}_titles`;
    const tmpUrls = `_${fieldName}_urls`;
    const tmpToAdd = `_${fieldName}_toAdd`;

    if (!removeIds?.length && !newItems?.length) {
      return [];
    }

    const stages: UpdateAggregationStage[] = [];

    if (removeIds?.length) {
      stages.push({
        // 1️⃣ Remove by _id
        $set: {
          [fieldName]: {
            $filter: {
              input: `$${fieldName}`,
              as: "it",
              cond: { $not: { $in: ["$$it._id", removeIds] } },
            },
          },
        },
      });
    }

    if (newItems?.length) {
      stages.push(
        // 2️⃣ Compute title/url sets FROM UPDATED ARRAY
        {
          $set: {
            [tmpTitles]: {
              $map: { input: `$${fieldName}`, as: "it", in: "$$it.title" },
            },
            [tmpUrls]: {
              $map: { input: `$${fieldName}`, as: "it", in: "$$it.url" },
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
                        $function: {
                          body: "return new ObjectId();",
                          args: [],
                          lang: "js",
                        },
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
      );
    }

    return [
      ...stages,
      // 6️⃣ Cleanup
      { $unset: [tmpTitles, tmpUrls, tmpToAdd] },
    ];
  }

  updateRoadmapStepResource = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    const { roadmapStepId, resourceId, resourceName } =
      req.params as UpdateRoadmapStepResourceParamsDto;
    const body = req.body as UpdateRoadmapResourceStepBodyDto;

    const roadmapStep = await this._roadmapStepRepository.findOne({
      filter: {
        _id: roadmapStepId,
        [`${resourceName}`]: {
          $elemMatch: { _id: Types.ObjectId.createFromHexString(resourceId) },
        },
      },
      projection: {
        careerId: 1,
        [`${resourceName}`]: {
          $elemMatch: { _id: Types.ObjectId.createFromHexString(resourceId) },
        },
      },
      options: {
        populate: [{ path: "careerId", select: "freezed assetFolderId" }],
      },
    });

    if (!roadmapStep || (roadmapStep.careerId as unknown as ICareer).freezed) {
      throw new NotFoundException(
        "Invalid roadmapStepId, its career freezed or invalid resourceId ❌",
      );
    }

    if (body.url || body.title) {
      const exist = await this._roadmapStepRepository.findOne({
        filter: {
          _id: roadmapStepId,
          [`${resourceName}`]: {
            $elemMatch: { $or: [{ title: body.title }, { url: body.url }] },
          },
        },
        projection: {
          _id: 0,
          [`${resourceName}`]: {
            $elemMatch: { $or: [{ title: body.title }, { url: body.url }] },
          },
        },
      });

      if (exist) {
        throw new BadRequestException(
          `This title or url already exists in the ${resourceName} list ❌`,
        );
      }
    }

    let subKey;
    if (body.attachment) {
      subKey = (
        await Promise.all([
          roadmapStep[resourceName]![0]?.pictureUrl
            ? S3Service.deleteFile({
                SubKey: roadmapStep[resourceName]![0]?.pictureUrl,
              })
            : undefined,
          S3Service.uploadFile({
            File: body.attachment,
            Path: S3FoldersPaths.roadmapStepResourceFolderPath(
              (roadmapStep.careerId as unknown as ICareer).assetFolderId,
              resourceName,
              roadmapStepId,
            ),
          }),
        ])
      )[1];
    }

    const result = await this._roadmapStepRepository.findOneAndUpdate({
      filter: {
        _id: roadmapStepId,
        [`${resourceName}`]: {
          $elemMatch: { _id: resourceId },
        },
        __v: body.v,
      },
      update: listUpdateFieldsHandler({
        resourceName,
        body,
        attachmentSubKey: subKey,
      }),
      options: {
        new: true,
        arrayFilters: [
          { "el._id": Types.ObjectId.createFromHexString(resourceId) },
        ],
        projection: {
          _id: 0,
          __v: 1,
          [`${resourceName}`]: {
            $elemMatch: { _id: Types.ObjectId.createFromHexString(resourceId) },
          },
        },
      },
    });

    if (!result) {
      throw new NotFoundException("Invalid resourceId ❌");
    }

    return successHandler<UpdateRoadmapStepResourceResponse>({
      res,
      body: {
        [`${resourceName}`]: result.toJSON()[resourceName]!,
        v: result.__v,
      },
    });
  };
}

export default RoadmapService;
