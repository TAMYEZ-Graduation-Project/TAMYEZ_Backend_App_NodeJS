import type { Request, Response } from "express";
import {
  CareerModel,
  CareerSuggestionAttemptModel,
  QuizAttemptModel,
  RoadmapStepModel,
  SavedQuizModel,
  UserCareerProgressModel,
  UserModel,
} from "../../db/models/index.ts";
import {
  CareerRepository,
  CareerSuggestionAttemptRepository,
  QuizAttemptRepository,
  RoadmapStepRepository,
  UserCareerProgressRepository,
  UserRepository,
} from "../../db/repositories/index.ts";
import successHandler from "../../utils/handlers/success.handler.ts";
import type {
  ArchiveCareerBodyDto,
  ArchiveCareerParamsDto,
  CheckCareerAssessmentBodyDto,
  CheckCareerAssessmentParamsDto,
  ChooseSuggestedCareerParamsDto,
  CreateCareerBodyDto,
  DeleteCareerBodyDto,
  DeleteCareerParamsDto,
  GetCareerParamsDto,
  GetCareersQueryDto,
  RestoreCareerBodyDto,
  RestoreCareerParamsDto,
  UpdateCareerBodyDto,
  UpdateCareerParamsDto,
  UpdateCareerResourceBodyDto,
  UpdateCareerResourceParamsDto,
  UploadCareerPictureBodyDto,
  UploadCareerPictureParamsDto,
} from "./career.dto.ts";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ServerException,
  ValidationException,
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
import {
  ApplicationTypeEnum,
  CareerResourceAppliesToEnum,
  QuizTypesEnum,
} from "../../utils/constants/enum.constants.ts";
import { startSession, Types, type FilterQuery } from "mongoose";
import type { ICareer } from "../../db/interfaces/career.interface.ts";
import { RoadmapService } from "../roadmap/index.ts";
import listUpdateFieldsHandler from "../../utils/handlers/list_update_fields.handler.ts";
import type {
  UpdateCareerResourceResponse,
  UploadCareerPictureResponse,
} from "./career.entity.ts";
import SavedQuizRepository from "../../db/repositories/saved_quiz.repository.ts";
import type { HIQuiz } from "../../db/interfaces/quiz.interface.ts";
import StringConstants from "../../utils/constants/strings.constants.ts";
import type {
  FullIQuestion,
  HIQuestion,
} from "../../db/interfaces/quiz_attempt.interface.ts";
import type {
  IAIModelCheckCareerAssessmentQuestionsRequest,
  IAIModelCheckCareerAssessmentQuestionsResponse,
} from "../../utils/constants/interface.constants.ts";

class CareerService {
  private readonly _careerRepository = new CareerRepository(CareerModel);
  private readonly _roadmapStepRepository = new RoadmapStepRepository(
    RoadmapStepModel,
  );
  private readonly _userRepository = new UserRepository(UserModel);
  private readonly _savedQuizRepository = new SavedQuizRepository(
    SavedQuizModel,
  );
  private readonly _quizAttemptRepository = new QuizAttemptRepository(
    QuizAttemptModel,
  );
  private readonly _careerSuggestionAttemptRepository =
    new CareerSuggestionAttemptRepository(CareerSuggestionAttemptModel);
  private readonly _userCareerProgressRepository =
    new UserCareerProgressRepository(UserCareerProgressModel);

  createCareer = async (req: Request, res: Response): Promise<Response> => {
    const { title, description, summary, courses, youtubePlaylists, books } =
      req.validationResult.body as CreateCareerBodyDto;

    const careersCount = await this._careerRepository.countDocuments({
      filter: { paranoid: false },
    });
    if (careersCount >= 100) {
      throw new BadRequestException(
        `Maximum number of careers reached ${careersCount} ❌`,
      );
    }

    const careerExists = await this._careerRepository.findOne({
      filter: { title, paranoid: false },
    });
    if (careerExists) {
      throw new ConflictException(
        `Career title conflicts with another ${
          careerExists.freezed?.at ? "archived " : ""
        }career ❌`,
      );
    }

    const [newCareer] = await this._careerRepository.create({
      data: [
        {
          title,
          description,
          summary,
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
        `Failed to create career, please try again later ☹️`,
      );
    }

    return successHandler({ res, message: "Career created successfully ✅" });
  };

  getCareers = ({ archived = false }: { archived?: boolean } = {}) => {
    return async (req: Request, res: Response): Promise<Response> => {
      const { page, size, searchKey } = req.validationResult
        .query as GetCareersQueryDto;
      const result = await this._careerRepository.paginate({
        filter: {
          ...(searchKey
            ? {
                $or: [
                  { title: { $regex: searchKey, $options: "i" } },
                  {
                    description: { $regex: searchKey, $options: "i" },
                  },
                  {
                    slug: { $regex: searchKey, $options: "i" },
                  },
                ],
              }
            : {}),
          ...(archived ? { paranoid: false, freezed: { $exists: true } } : {}),
        },
        page,
        size,
        options: {
          projection: {
            courses: 0,
            youtubePlaylists: 0,
            books: 0,
            assetFolderId: 0,
          },
        },
      });

      if (!result.data || result.data.length == 0) {
        throw new NotFoundException(
          archived ? "No archived careers found 🔍❌" : "No careers found 🔍❌",
        );
      }

      return successHandler({ res, body: result });
    };
  };

  getCareer = ({ archived = false }: { archived?: boolean } = {}) => {
    return async (req: Request, res: Response): Promise<Response> => {
      const { careerId } = req.params as GetCareerParamsDto;

      let filter: FilterQuery<ICareer>;
      if (
        req.user &&
        req.tokenPayload?.applicationType === ApplicationTypeEnum.user &&
        req.user.careerPath?.id?.equals(careerId)
      ) {
        filter = {
          _id: careerId,
          paranoid: false,
        };
      } else {
        filter = {
          _id: careerId,
          ...(archived ? { paranoid: false, freezed: { $exists: true } } : {}),
        };
      }

      const result = await this._careerRepository.findOne({
        filter,
        options: {
          populate: [
            {
              path: "roadmap",
              match: {
                order: { $lte: 10 },
                ...(req.user &&
                req.tokenPayload?.applicationType ===
                  ApplicationTypeEnum.user &&
                req.user.careerPath?.id?.equals(careerId)
                  ? { paranoid: false }
                  : undefined),
              },
              select: {
                title: 1,
                description: 1,
                order: 1,
                freezed: 1,
                __v: 1,
              },
            },
          ],
        },
      });

      if (!result) {
        throw new NotFoundException(
          archived ? "No archived career found 🔍❌" : "No career found 🔍❌",
        );
      }

      return successHandler({ res, body: result });
    };
  };

  uploadCareerPicture = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    const { careerId } = req.params as UploadCareerPictureParamsDto;
    const { attachment, v } = req.body as UploadCareerPictureBodyDto;

    const career = await this._careerRepository.findOne({
      filter: { _id: careerId, __v: v },
    });

    if (!career) {
      throw new NotFoundException("Invalid careerId or career freezed ❌");
    }

    const subKey = await S3Service.uploadFile({
      File: attachment,
      Path: S3FoldersPaths.careerFolderPath(career.assetFolderId),
    });

    const result = await this._careerRepository
      .updateOne({
        filter: { _id: careerId, __v: v },
        update: { pictureUrl: subKey },
      })
      .catch(async (error) => {
        await S3Service.deleteFile({ SubKey: subKey });
        throw error;
      });

    if (result.matchedCount) {
      if (
        career.pictureUrl &&
        career.pictureUrl != process.env[EnvFields.CAREER_DEFAULT_PICTURE_URL]
      )
        await S3Service.deleteFile({ SubKey: career.pictureUrl });
    } else {
      await S3Service.deleteFile({ SubKey: subKey });
    }

    return successHandler<UploadCareerPictureResponse>({
      res,
      body: {
        pictureUrl: S3KeyUtil.generateS3UploadsUrlFromSubKey(subKey)!,
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
      ...this._getResourceSpecifiedStepsIds(
        body.courses as unknown as ICareerResource[],
      ).values(),
      ...this._getResourceSpecifiedStepsIds(
        body.youtubePlaylists as unknown as ICareerResource[],
      ).values(),
      ...this._getResourceSpecifiedStepsIds(
        body.books as unknown as ICareerResource[],
      ).values(),
    ]);

    if (specifiedStepsIdsSet.size > 0) {
      const existingStepsCount =
        await this._roadmapStepRepository.countDocuments({
          filter: { _id: { $in: Array.from(specifiedStepsIdsSet) }, careerId },
        });

      if (existingStepsCount !== specifiedStepsIdsSet.size) {
        throw new NotFoundException(
          `One or more specifiedSteps do not exist ❌`,
        );
      }
    }

    if (
      RoadmapService.getTotalResourceCount({
        currentResources: career.courses as FullICareerResource[],
        removeResources: body.removeCourses,
        newResourcesCount: body.courses?.length ?? 0,
      }) > 5 ||
      RoadmapService.getTotalResourceCount({
        currentResources: career.youtubePlaylists as FullICareerResource[],
        removeResources: body.removeYoutubePlaylists,
        newResourcesCount: body.youtubePlaylists?.length ?? 0,
      }) > 5 ||
      RoadmapService.getTotalResourceCount({
        currentResources: career.books as FullICareerResource[],
        removeResources: body.removeBooks,
        newResourcesCount: body.books?.length ?? 0,
      }) > 5
    ) {
      throw new BadRequestException(
        "Each career resource list (courses | youtubePlaylists | books) must be at most 5 items length ❌",
      );
    }

    const toUpdate: Partial<ICareer> = {};
    if (body.title) toUpdate.title = body.title;
    if (body.description) toUpdate.description = body.description;

    await this._careerRepository.updateOne<[]>({
      filter: { _id: careerId, __v: body.v },
      update: [
        { $set: { ...toUpdate } },
        ...RoadmapService.buildUniqueAppendStages({
          fieldName: "courses",
          newItems: body.courses?.map<ICareerResource>((rs) => {
            return {
              ...rs,
              specifiedSteps:
                rs.specifiedSteps?.map<Types.ObjectId>((id) =>
                  Types.ObjectId.createFromHexString(id),
                ) ?? [],
            };
          }),
          removeIds: body.removeCourses?.map((id) =>
            Types.ObjectId.createFromHexString(id),
          ),
        }),
        ...RoadmapService.buildUniqueAppendStages({
          fieldName: "youtubePlaylists",
          newItems: body.youtubePlaylists?.map<ICareerResource>((rs) => {
            return {
              ...rs,
              specifiedSteps:
                rs.specifiedSteps?.map<Types.ObjectId>((id) =>
                  Types.ObjectId.createFromHexString(id),
                ) ?? [],
            };
          }),
          removeIds: body.removeYoutubePlaylists?.map((id) =>
            Types.ObjectId.createFromHexString(id),
          ),
        }),
        ...RoadmapService.buildUniqueAppendStages({
          fieldName: "books",
          newItems: body.books?.map<ICareerResource>((rs) => {
            return {
              ...rs,
              specifiedSteps:
                rs.specifiedSteps?.map<Types.ObjectId>((id) =>
                  Types.ObjectId.createFromHexString(id),
                ) ?? [],
            };
          }),
          removeIds: body.removeBooks?.map((id) =>
            Types.ObjectId.createFromHexString(id),
          ),
        }),
      ],
    });

    return successHandler({ res });
  };

  private _getResourceSpecifiedStepsIds = (
    resources: ICareerResource[],
  ): Set<string> => {
    const specifiedStepsIdsSet = new Set<string>();
    if (resources?.length) {
      for (const resource of resources) {
        if (
          resource.appliesTo === CareerResourceAppliesToEnum.specific &&
          resource.specifiedSteps?.length
        ) {
          resource.specifiedSteps.forEach((stepId) =>
            specifiedStepsIdsSet.add(stepId.toString()),
          );
        }
      }
    }
    return specifiedStepsIdsSet;
  };

  updateCareerResource = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    const { careerId, resourceName, resourceId } =
      req.params as UpdateCareerResourceParamsDto;
    const body = req.validationResult.body as UpdateCareerResourceBodyDto;

    const career = await this._careerRepository.findOne({
      filter: {
        _id: careerId,
        [`${resourceName}`]: {
          $elemMatch: { _id: Types.ObjectId.createFromHexString(resourceId) },
        },
      },
      projection: {
        assetFolderId: 1,
        [`${resourceName}`]: {
          $elemMatch: { _id: Types.ObjectId.createFromHexString(resourceId) },
        },
      },
    });

    if (!career) {
      throw new NotFoundException(
        "Invalid careerId, career freezed or invalid resourceId ❌",
      );
    }
    if (
      career[resourceName]![0]?.appliesTo ===
        CareerResourceAppliesToEnum.specific &&
      body.appliesTo === CareerResourceAppliesToEnum.all
    ) {
      body.specifiedSteps = [];
    }

    if (body.url || body.title) {
      const exist = await this._careerRepository.findOne({
        filter: {
          _id: careerId,
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

    if (body.specifiedSteps) {
      if (
        body.appliesTo !== CareerResourceAppliesToEnum.specific &&
        career[resourceName]![0]?.appliesTo == CareerResourceAppliesToEnum.all
      ) {
        throw new BadRequestException(
          "specifiedSteps can't have values when appliesTo equals All ❌",
        );
      }
      const specifiedStepsIdsSet = new Set(body.specifiedSteps);
      const existingStepsCount =
        await this._roadmapStepRepository.countDocuments({
          filter: { _id: { $in: Array.from(specifiedStepsIdsSet) }, careerId },
        });

      if (existingStepsCount !== specifiedStepsIdsSet.size) {
        throw new NotFoundException(
          `One or more specifiedSteps do not exist for this career ❌`,
        );
      }
    }

    let subKey;
    if (body.attachment) {
      subKey = (
        await Promise.all([
          career[resourceName]![0]?.pictureUrl
            ? S3Service.deleteFile({
                SubKey: career[resourceName]![0]?.pictureUrl,
              })
            : undefined,
          S3Service.uploadFile({
            File: body.attachment,
            Path: S3FoldersPaths.careerResourceFolderPath(
              career.assetFolderId,
              resourceName,
            ),
          }),
        ])
      )[1];
    }

    const result = await this._careerRepository.findOneAndUpdate({
      filter: {
        _id: careerId,
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

    return successHandler<UpdateCareerResourceResponse>({
      res,
      body: {
        [`${resourceName}`]: result.toJSON()[resourceName],
        v: result.__v,
      },
    });
  };

  aiModelCheckCareerAssessmentQuestions = ({
    careerList,
    answers,
  }: IAIModelCheckCareerAssessmentQuestionsRequest): Promise<IAIModelCheckCareerAssessmentQuestionsResponse> => {
    return new Promise((res) => {
      setTimeout(() => {
        console.log({ answers });
        const suggestedCareers: IAIModelCheckCareerAssessmentQuestionsResponse["suggestedCareers"] =
          [];
        for (let i = 0; i < 3; i++) {
          const index = Math.floor(Math.random() * careerList.length);
          if (
            suggestedCareers.find((c) =>
              c.careerId.equals(careerList[index]!.careerId),
            )
          )
            continue; // avoid duplicates
          suggestedCareers.push({
            careerId: careerList[index]!.careerId,
            title: careerList[index]!.title,
            reason: `Because you answers indicates your interest in ${careerList[index]!.title} field.`,
            confidence: Math.floor(Math.random() * (100 - 60)) + 60,
          });
        }
        res({
          suggestedCareers: suggestedCareers.sort(
            (a, b) => b.confidence - a.confidence,
          ),
        });
      }, 1500);
    });
  };

  checkCareerAssessment = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    const { quizAttemptId } = req.params as CheckCareerAssessmentParamsDto;
    const { answers } = req.validationResult
      .body as CheckCareerAssessmentBodyDto;

    const quizAttempt = await this._quizAttemptRepository.findOne({
      filter: {
        _id: quizAttemptId,
        userId: req.user!._id!,
        attemptType: QuizTypesEnum.careerAssessment,
      },
      options: {
        populate: [
          {
            path: "quizId",
            match: { paranoid: false },
            select: "title aiPrompt",
          },
        ],
      },
    });

    if (!quizAttempt) {
      throw new NotFoundException(
        "No career assessment quiz attempt found for the given quizAttemptId and user 🚫",
      );
    }

    if (
      (quizAttempt.quizId as unknown as HIQuiz).title !==
      StringConstants.CAREER_ASSESSMENT
    ) {
      throw new BadRequestException(
        `Answers of a NON ${StringConstants.CAREER_ASSESSMENT} quiz, use check quiz answers API 🚫`,
      );
    }

    if (answers.length !== quizAttempt.questions.length) {
      throw new ValidationException(
        "Number of answers provided does not match number of questions ❌",
      );
    }

    // ---- Build maps once (O(n)) ----
    const questions = quizAttempt.questions as HIQuestion[];
    const qById = new Map<string, { index: number } & FullIQuestion>();
    for (let i = 0; i < questions.length; i++) {
      const qid = questions[i]!.id?.toString()!;
      qById.set(qid, { index: i, ...questions[i]?.toObject()! } as {
        index: number;
      } & HIQuestion);
    }

    const answersForAI: IAIModelCheckCareerAssessmentQuestionsRequest["answers"] =
      [];
    for (const answer of answers) {
      const question = qById.get(answer.questionId);

      if (!question) {
        throw new NotFoundException(
          `Not found questionId in the quiz questions ${answer.questionId} ❌`,
        );
      } else if (question.type !== answer.type) {
        throw new ValidationException(
          `Question type mismatch for questionId ${answer.questionId} ❌`,
        );
      }

      answersForAI.push({
        text: question.text!,
        options: question.options,
        userAnswer: answer.answer,
      });
    }

    const careers = await this._careerRepository.find({
      options: { projection: { title: 1, summary: 1 } },
    });

    if (!careers || careers.length === 0) {
      throw new NotFoundException(
        "No careers found to suggest from, please try again later ❌",
      );
    }
    const aiModelResponse = await this.aiModelCheckCareerAssessmentQuestions({
      careerList: careers.map((c) => ({
        careerId: c._id,
        title: c.title,
        summary: c.summary,
      })),
      answers: answersForAI,
    });

    const suggestedCareerIds = new Set(
      aiModelResponse.suggestedCareers.map((c) => c.careerId),
    );

    if (
      (await this._careerRepository.countDocuments({
        filter: { _id: { $in: Array.from(suggestedCareerIds) } },
      })) !== suggestedCareerIds.size
    ) {
      throw new BadRequestException(
        "Some AI suggested careers are not available ❌",
      );
    }

    // TODO: save suggested careers
    if (
      !(
        await this._careerSuggestionAttemptRepository.replaceOne({
          filter: { userId: req.user!._id! },
          replacement: {
            userId: req.user!._id!,
            suggestions: aiModelResponse.suggestedCareers,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000), // expire after 30 minutes
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          options: { upsert: true },
        })
      ).acknowledged
    ) {
      throw new ServerException(
        "Failed to save career suggestions, please try again later ❌",
      );
    }

    await quizAttempt.deleteOne();
    return successHandler({ res, body: aiModelResponse });
  };

  chooseSuggestedCareer = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    const { careerId } = req.params as ChooseSuggestedCareerParamsDto;

    const careerSuggestionAttempt =
      await this._careerSuggestionAttemptRepository.findOne({
        filter: {
          userId: req.user!._id!,
          "suggestions.careerId": Types.ObjectId.createFromHexString(careerId),
        },
      });

    if (!careerSuggestionAttempt) {
      throw new NotFoundException(
        "No career suggestion attempt found for the user with the given careerId, or the suggestion has expired ❌",
      );
    }
    const chosenCareer = await this._careerRepository.findOne({
      filter: { _id: careerId },
      options: { projection: { title: 1, orderEpoch: 1 } },
    });
    if (!chosenCareer) {
      throw new NotFoundException(
        "The suggested career is no longer available ❌",
      );
    }

    if (
      careerSuggestionAttempt.suggestions.find((c) =>
        c.careerId.equals(careerId),
      )?.confidence! < 60
    ) {
      throw new BadRequestException(
        "The suggested career confidence is less than 60% ❌",
      );
    }

    const session = await startSession();
    await session.withTransaction(async () => {
      await Promise.all([
        this._userRepository.updateOne({
          filter: { _id: req.user!._id! },
          update: {
            careerPath: {
              id: Types.ObjectId.createFromHexString(careerId),
              selectedAt: new Date(),
            },
          },
          options: { session },
        }),
        this._userCareerProgressRepository.create({
          data: [
            {
              userId: req.user!._id!,
              careerId: Types.ObjectId.createFromHexString(careerId),
              nextStep: (
                await this._roadmapStepRepository.exists({
                  filter: {
                    careerId: Types.ObjectId.createFromHexString(careerId),
                    order: 1,
                  },
                })
              )?._id,
              orderEpoch: chosenCareer.orderEpoch,
            },
          ],
          options: { session },
        }),
        this._careerSuggestionAttemptRepository.deleteOne({
          filter: { userId: req.user!._id! },
          options: { session },
        }),
      ]);
    });
    await session.endSession();

    return successHandler({ res });
  };

  archiveCareer = async (req: Request, res: Response): Promise<Response> => {
    const { careerId } = req.params as ArchiveCareerParamsDto;
    const { v, confirmFreezing } = req.body as ArchiveCareerBodyDto;

    if (
      !(await this._careerRepository.findOne({
        filter: { _id: careerId, __v: v },
      }))
    ) {
      throw new NotFoundException("Invalid careerId or already freezed ❌");
    }

    if (!confirmFreezing) {
      const count = await this._userRepository.countDocuments({
        filter: { "careerPath.id": careerId },
      });
      if (count) {
        throw new BadRequestException(
          `Warning ⚠️: there are ${count} users that are studying this career ❌`,
        );
      }
    }

    await this._careerRepository.updateOne({
      filter: { _id: careerId, __v: v },
      update: {
        freezed: { at: new Date(), by: req.user!._id },
        $unset: { restored: 1 },
      },
    });

    return successHandler({ res });
  };

  restoreCareer = async (req: Request, res: Response): Promise<Response> => {
    const { careerId } = req.params as RestoreCareerParamsDto;
    const { v } = req.body as RestoreCareerBodyDto;

    const result = await this._careerRepository.updateOne({
      filter: {
        _id: careerId,
        __v: v,
        paranoid: false,
        freezed: { $exists: true },
      },
      update: {
        restored: { at: new Date(), by: req.user!._id },
        $unset: { freezed: 1 },
      },
    });

    if (!result.matchedCount) {
      throw new NotFoundException("Invalid careerId or Not freezed ❌");
    }

    return successHandler({ res });
  };

  deleteCareer = async (req: Request, res: Response): Promise<Response> => {
    const { careerId } = req.params as DeleteCareerParamsDto;
    const { v } = req.body as DeleteCareerBodyDto;

    const career = await this._careerRepository.findOne({
      filter: {
        _id: careerId,
        __v: v,
        paranoid: false,
        freezed: { $exists: true },
      },
    });

    if (!career) {
      throw new NotFoundException("Invalid careerId or Not freezed ❌");
    }

    if (Date.now() - career.freezed!.at.getTime() < 172_800_000) {
      // less than 48 hours
      throw new BadRequestException(
        "Can't delete the career until at least 48 hours have passed after freezing ❌⌛️",
      );
    }

    if (await this._quizAttemptRepository.exists({ filter: { careerId } })) {
      throw new BadRequestException(
        "There active quiz attempts on this career please wait until it's done ❌⌛️",
      );
    }

    if (
      (
        await this._careerRepository.deleteOne({
          filter: {
            _id: careerId,
            __v: v,
            paranoid: false,
            freezed: { $exists: true },
          },
        })
      ).deletedCount
    ) {
      await Promise.all([
        // delete assets in AWS Bucket
        S3Service.deleteFolderByPrefix({
          FolderPath: S3FoldersPaths.careerFolderPath(career.assetFolderId),
        }),
        // delete roadmap steps of this career
        this._roadmapStepRepository.deleteMany({
          filter: { careerId },
        }),
        // remove the careerPath field in user profile
        this._userRepository.aggregate({
          pipeline: [
            {
              $match: {
                "careerPath.id": Types.ObjectId.createFromHexString(careerId),
              },
            },
            {
              $project: { firstName: 1, lastName: 1, __v: 1 },
            },
            {
              $unset: "careerPath",
            },
            {
              $set: {
                "careerDeleted.message": {
                  $concat: [
                    "Hi ",
                    "$firstName",
                    " ",
                    "$lastName",
                    " 👋, we’re really sorry to let you know that your career path has been deleted from our system 😔. You can retake the career assessment 🚀 or check any suggested careers 💼.",
                  ],
                },
                __v: { $add: ["$__v", 1] },
              },
            },
          ],
        }),
        // delete saved quizzes of this career
        this._savedQuizRepository.deleteMany({ filter: { careerId } }),
        // delete user progress related to this career
      ]);
    } else {
      throw new NotFoundException("Invalid careerId or Not freezed ❌");
    }

    return successHandler({ res });
  };
}

export default CareerService;
