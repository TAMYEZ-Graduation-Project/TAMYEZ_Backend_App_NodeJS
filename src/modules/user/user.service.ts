import type { Request, Response } from "express";
import successHandler from "../../utils/handlers/success.handler.ts";
import type { IProfileReponse } from "./user.entity.ts";
import type {
  ArchiveAccountBodyDtoType,
  ArchiveAccountParamsDtoType,
  ChangePasswordBodyDtoType,
  ChangeRoleBodyDtoType,
  ChangeRoleParamsDtoType,
  DeleteAccountBodyDtoType,
  DeleteAccountParamsDtoType,
  DeleteFeedbackParamsDtoType,
  GetFeedbacksQueryDtoType,
  GetProfileParamsDtoType,
  GetUsersQueryDtoType,
  LogoutBodyDtoType,
  ReplyToFeedbackBodyDtoType,
  ReplyToFeedbackParamsDtoType,
  RestoreAccountBodyDtoType,
  RestoreAccountParamsDtoType,
  SubmitFeedbackBodyDtoType,
  UpdateProfileBodyDtoType,
  UploadProfilePictureBodyDtoType,
} from "./user.dto.ts";
import S3Service from "../../utils/multer/s3.service.ts";
import S3FoldersPaths from "../../utils/multer/s3_folders_paths.ts";
import {
  ApplicationTypeEnum,
  EmailEventsEnum,
  LogoutFlagsEnum,
  ProvidersEnum,
  RolesEnum,
} from "../../utils/constants/enum.constants.ts";
import UpdateUtil from "../../utils/update/util.update.ts";
import HashingSecurityUtil from "../../utils/security/hash.security.ts";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ValidationException,
  VersionConflictException,
} from "../../utils/exceptions/custom.exceptions.ts";
import StringConstants from "../../utils/constants/strings.constants.ts";
import TokenSecurityUtil from "../../utils/security/token.security.ts";
import {
  AdminNotificationsLimitRepository,
  CareerRepository,
  DashboardReviewRepository,
  FeedbackRepository,
  NotificationPushDeviceRepository,
  QuizAttemptRepository,
  UserRepository,
} from "../../db/repositories/index.ts";
import NotificationPushDeviceModel from "../../db/models/notifiction_push_device.model.ts";
import S3KeyUtil from "../../utils/multer/s3_key.multer.ts";
import UserModel from "../../db/models/user.model.ts";
import {
  AdminNotificationsLimitModel,
  CareerModel,
  DashboardReviewModel,
  FeedbackModel,
  QuizAttemptModel,
  QuizCooldownModel,
  SavedQuizModel,
} from "../../db/models/index.ts";
import SavedQuizRepository from "../../db/repositories/saved_quiz.repository.ts";
import QuizCooldownRepository from "../../db/repositories/quiz_cooldown.repository.ts";
import emailEvent from "../../utils/events/email.events.ts";
import type { IUser } from "../../db/interfaces/user.interface.ts";

class UserService {
  private readonly _notificationPushDeviceRepository =
    new NotificationPushDeviceRepository(NotificationPushDeviceModel);

  private readonly _userRepository = new UserRepository(UserModel);

  private readonly _quizAttemptRepository = new QuizAttemptRepository(
    QuizAttemptModel,
  );

  private readonly _savedQuizRepository = new SavedQuizRepository(
    SavedQuizModel,
  );

  private readonly _quizCooldownRepository = new QuizCooldownRepository(
    QuizCooldownModel,
  );

  private readonly _dashboardReviewRepository = new DashboardReviewRepository(
    DashboardReviewModel,
  );

  private readonly _adminNotificationsLimitRepository =
    new AdminNotificationsLimitRepository(AdminNotificationsLimitModel);

  private readonly _careerRepository = new CareerRepository(CareerModel);

  private readonly _feedbackRepository = new FeedbackRepository(FeedbackModel);

  getAdminDashboardData = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    const reviews = await this._dashboardReviewRepository.aggregate({
      pipeline: [
        {
          $group: {
            _id: null,
            data: {
              $push: {
                k: "$reviewType",
                v: "$activeCount",
              },
            },
          },
        },
        {
          $replaceRoot: { newRoot: { $arrayToObject: "$data" } },
        },
      ],
    });

    const notifications =
      await this._adminNotificationsLimitRepository.aggregate({
        pipeline: [
          {
            $group: {
              _id: null,
              notifications: { $sum: "$count" },
            },
          },
          {
            $project: {
              _id: 0,
              notifications: 1,
            },
          },
        ],
      });

    return successHandler({
      res,
      body: {
        ...reviews[0],
        ...notifications[0],
        newUserRegistered:
          (await this._userRepository.findOne({
            options: {
              sort: { createdAt: -1 },
              projection: {
                firstName: 1,
                lastName: 1,
                email: 1,
                profilePicture: 1,
                createdAt: 1,
              },
            },
          })) ?? undefined,
        careerPathUpdated:
          (await this._careerRepository.findOne({
            options: {
              sort: { updatedAt: -1 },
              projection: { title: 1, slug: 1, pictureUrl: 1, updatedAt: 1 },
            },
          })) ?? undefined,

        quizCompleted:
          (await this._savedQuizRepository.findOne({
            options: {
              sort: { createdAt: -1 },
              projection: { quizId: 1, userId: 1, createdAt: 1 },
              populate: [
                {
                  path: "quizId",
                  match: { paranoid: false },
                  select: { title: 1 },
                },
              ],
            },
          })) ?? undefined,
        notificationSent: await this._adminNotificationsLimitRepository.findOne(
          {
            options: {
              sort: { createdAt: -1 },
              projection: { type: 1, careerId: 1, createdAt: 1 },
              populate: [
                {
                  path: "careerId",
                  match: { paranoid: false },
                  select: { title: 1, slug: 1, pictureUrl: 1 },
                },
              ],
            },
          },
        ),
        userFeedbackReceived:
          (await this._feedbackRepository.findOne({
            options: {
              sort: { createdAt: -1 },
              projection: { text: 1, createdBy: 1, createdAt: 1 },
              populate: [
                {
                  path: "createdBy",
                  match: { paranoid: false },
                  select: { firstName: 1, lastName: 1, email: 1 },
                },
              ],
            },
          })) ?? undefined,
      },
    });
  };

  getProfile = ({ archived = false }: { archived?: boolean } = {}) => {
    return async (req: Request, res: Response): Promise<Response> => {
      const { userId } = req.params as GetProfileParamsDtoType;

      if (userId && req.user!.role === RolesEnum.user) {
        throw new ForbiddenException(
          "Not Authorized get other users' profiles ❌",
        );
      } else if (
        userId &&
        req.tokenPayload?.applicationType === ApplicationTypeEnum.user
      ) {
        throw new ForbiddenException(
          StringConstants.INVALID_LOGIN_GATEWAY_MESSAGE,
        );
      }

      const options = {
        populate: [
          {
            path: "careerPath.id",
            match: { paranoid: false },
            select: "title slug pictureUrl freezed",
          },
        ],
      };
      let user;
      if (!archived) {
        user = userId
          ? await this._userRepository.findOne({
              filter: { _id: userId },
              options,
            })
          : req.user!;
      } else {
        if (!userId) {
          throw new ValidationException("userId is required ❌");
        }
        user = await this._userRepository.findOne({
          filter: {
            _id: userId,
            paranoid: false,
            freezed: { $exists: true },
            options,
          },
        });
      }

      if (!user) {
        throw new NotFoundException(
          `This ${archived ? "archived " : ""}user NOT found ❌`,
        );
      }

      return successHandler<IProfileReponse>({
        res,
        body: {
          user,
        },
      });
    };
  };

  getUsers = ({ archived = false }: { archived?: boolean } = {}) => {
    return async (req: Request, res: Response): Promise<Response> => {
      const { page, size, searchKey } = req.validationResult
        .query as GetUsersQueryDtoType;

      const result = await this._userRepository.paginate({
        filter: {
          ...(searchKey
            ? {
                $or: [
                  {
                    $expr: {
                      $regexMatch: {
                        input: { $concat: ["$firstName", " ", "$lastName"] },
                        regex: searchKey,
                        options: "i",
                      },
                    },
                  },
                  {
                    $expr: {
                      $regexMatch: {
                        input: { $concat: ["$lastName", " ", "$firstName"] },
                        regex: searchKey,
                        options: "i",
                      },
                    },
                  },
                  {
                    email: { $regex: searchKey, $options: "i" },
                  },
                ],
              }
            : {}),
          ...(archived ? { paranoid: false, freezed: { $exists: true } } : {}),
        },
        page,
        size,
      });

      if (!result.data || result.data.length == 0) {
        throw new NotFoundException(
          archived ? "No archived users found 🔍❌" : "No users found 🔍❌",
        );
      }

      return successHandler({ res, body: result });
    };
  };

  uploadProfilePicture = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    const { attachment, v } = req.body as UploadProfilePictureBodyDtoType;

    if (
      !(await this._userRepository.exists({
        filter: { _id: req.user!._id, __v: v },
      }))
    ) {
      throw new VersionConflictException(
        StringConstants.INVALID_VERSION_MESSAGE,
      );
    }

    const subKey = await S3Service.uploadFile({
      File: attachment,
      Path: S3FoldersPaths.profileFolderPath(req.user!._id!.toString()),
    });

    const result = await this._userRepository
      .findOneAndUpdate({
        filter: { _id: req.user?._id, __v: v },
        update: {
          profilePicture: {
            url: subKey,
            provide: ProvidersEnum.local,
          },
        },
        options: { projection: { __v: 1 }, new: true },
      })
      .catch(async (error) => {
        await S3Service.deleteFile({
          SubKey: subKey,
        });
        throw error;
      });

    if (result) {
      if (
        req.user?.profilePicture &&
        req.user.profilePicture.provider === ProvidersEnum.local
      ) {
        await S3Service.deleteFile({
          SubKey: req.user.profilePicture.url,
        });
      }
    } else {
      await S3Service.deleteFile({
        SubKey: subKey,
      });
    }

    return successHandler({
      res,
      body: {
        url: S3KeyUtil.generateS3UploadsUrlFromSubKey(subKey),
        v: result?.__v,
      },
    });
  };

  updateProfile = async (req: Request, res: Response): Promise<Response> => {
    const { firstName, lastName, phoneNumber, gender, v } =
      req.body as UpdateProfileBodyDtoType;

    const updatedObject = UpdateUtil.getChangedFields({
      document: req.user!,
      updatedObject: { firstName, lastName, phoneNumber, gender },
    });

    if (updatedObject.gender && req.user!.gender) {
      throw new BadRequestException(
        "Gender can't be changed after first selection 🚻",
      );
    }
    await this._userRepository.updateOne({
      filter: { _id: req.user!._id, __v: v },
      update: { ...updatedObject },
    });

    return successHandler({ res });
  };

  changePassword = async (req: Request, res: Response): Promise<Response> => {
    const { currentPassword, newPassword, flag, v } = req.validationResult
      .body as ChangePasswordBodyDtoType;

    if (
      !(await HashingSecurityUtil.compareHash({
        plainText: currentPassword,
        cipherText: req.user!.password,
      }))
    ) {
      throw new BadRequestException(
        StringConstants.INVALID_PARAMETER_MESSAGE("currentPassword"),
      );
    }

    const updateObject: { changeCredentialsTime?: Date } = {};
    switch (flag) {
      case LogoutFlagsEnum.all:
        updateObject.changeCredentialsTime = new Date();
        break;

      case LogoutFlagsEnum.one:
        await TokenSecurityUtil.revoke({
          flag,
          userId: req.user!._id!,
          tokenPayload: req.tokenPayload!,
        });
        break;

      default:
        break;
    }

    await this._userRepository.updateOne({
      filter: { _id: req.user!._id, __v: v },
      update: { password: newPassword, ...updateObject },
    });

    return successHandler({ res });
  };

  logout = async (req: Request, res: Response): Promise<Response> => {
    const { flag, deviceId } = req.validationResult.body as LogoutBodyDtoType;

    if (deviceId) {
      const pushDeviceResult =
        await this._notificationPushDeviceRepository.updateOne({
          filter: { userId: req.user!._id!, deviceId, __v: undefined },
          update: {
            isActive: false,
            $unset: { fcmToken: true },
          },
        });
      if (!pushDeviceResult?.matchedCount) {
        throw new NotFoundException(
          "Invalid deviceId, or notification is disabled ❌",
        );
      }
    }

    await TokenSecurityUtil.revoke({
      flag,
      userId: req.user!._id,
      tokenPayload: req.tokenPayload!,
    });

    return successHandler({ res });
  };

  changeRole = async (req: Request, res: Response): Promise<Response> => {
    const { userId } = req.params as ChangeRoleParamsDtoType;
    const { role, v } = req.body as ChangeRoleBodyDtoType;

    if (req.user!._id.equals(userId)) {
      throw new BadRequestException(
        "Not allowed to change the role of yourself ❌",
      );
    }

    const denyRoles: RolesEnum[] = [role, RolesEnum.superAdmin];
    if (req.user!.role === RolesEnum.admin) {
      if (role === RolesEnum.superAdmin) {
        throw new ForbiddenException(
          "You don't have the privilage to make a user Super Admin ❌",
        );
      }

      denyRoles.push(RolesEnum.admin);
    }

    const user = await this._userRepository.findOneAndUpdate({
      filter: { _id: userId, role: { $nin: denyRoles }, __v: v },
      update: {
        role,
      },
    });

    if (!user) {
      throw new NotFoundException("Invalid userId or invalid role ❌");
    }

    return successHandler({ res });
  };

  archiveAccount = async (req: Request, res: Response): Promise<Response> => {
    const { userId } = req.params as ArchiveAccountParamsDtoType;
    const { v, refreeze } = req.body as ArchiveAccountBodyDtoType;

    if (userId && req.user!.role === RolesEnum.user) {
      throw new ForbiddenException("Not Authorized User ❌");
    } else if (
      userId &&
      req.tokenPayload?.applicationType === ApplicationTypeEnum.user
    ) {
      throw new ForbiddenException(
        StringConstants.INVALID_LOGIN_GATEWAY_MESSAGE,
      );
    }
    const result = await this._userRepository.updateOne({
      filter: {
        _id: userId || req.user!._id!,
        ...(userId
          ? { role: { $nin: [req.user?.role, RolesEnum.superAdmin] } }
          : undefined),
        __v: v,
      },
      update: {
        freezed: {
          at: new Date(),
          by: req.user!._id,
        },
        changeCredentialsTime: new Date(),
        $unset: {
          restored: true,
        },
      },
    });

    if (!result.modifiedCount) {
      const user = await this._userRepository.findOne({
        filter: { _id: userId, paranoid: false },
      });

      if (
        user &&
        user.role != req.user?.role &&
        user.role != RolesEnum.superAdmin &&
        user.freezed!.by.equals(userId)
      ) {
        if (refreeze) {
          await this._userRepository.updateOne({
            filter: { _id: userId, __v: v, paranoid: false },
            update: {
              freezed: {
                at: new Date(),
                by: req.user!._id,
              },
              changeCredentialsTime: new Date(),
            },
          });
        } else {
          throw new BadRequestException(
            "User has freezed their own account! Do you want to re-freezed it?",
          );
        }
      } else if (user) {
        throw new BadRequestException(
          "Can't freeze high or equal account privilages ❌",
        );
      } else {
        throw new NotFoundException("user not found or already freezed ❌");
      }
    }

    return successHandler({
      res,
      message: !userId
        ? "Your account has been freezed, you can only restore it after 24 hours ✅"
        : "Account Freezed ✅",
    });
  };

  restoreAccount = async (req: Request, res: Response): Promise<Response> => {
    const { userId } = req.params as RestoreAccountParamsDtoType;
    const { v } = req.body as RestoreAccountBodyDtoType;

    const result = await this._userRepository.updateOne({
      filter: {
        _id: userId,
        paranoid: false,
        freezed: { $exists: true },
        "freezed.by": { $ne: userId },
        __v: v,
      },
      update: {
        restored: {
          at: new Date(),
          by: req.user!._id,
        },
        $unset: {
          freezed: true,
        },
      },
    });

    if (result.modifiedCount === 0) {
      throw new NotFoundException(
        "account not found, self-freezed, or already restored ❌",
      );
    }

    return successHandler({ res, message: "Account Restored!" });
  };

  deleteAccount = async (req: Request, res: Response): Promise<Response> => {
    const { userId } = req.params as DeleteAccountParamsDtoType;
    const { v } = req.body as DeleteAccountBodyDtoType;

    if (userId && req.user!.role === RolesEnum.user) {
      throw new ForbiddenException("Not Authorized User ❌");
    } else if (
      userId &&
      req.tokenPayload?.applicationType === ApplicationTypeEnum.user
    ) {
      throw new ForbiddenException(
        StringConstants.INVALID_LOGIN_GATEWAY_MESSAGE,
      );
    }

    if (!userId) {
      await this._userRepository.deleteOne({
        filter: {
          _id: req.user!._id!,
          __v: v,
        },
      });
    } else {
      if (
        !(
          await this._userRepository.deleteOne({
            filter: {
              _id: userId,
              paranoid: false,
              freezed: { $exists: true },
              "freezed.by": { $ne: userId },
              __v: v,
            },
          })
        ).deletedCount
      ) {
        throw new NotFoundException(
          "Invalid account, self-freezed or already deleted ❌",
        );
      }
    }

    await Promise.all([
      S3Service.deleteFolderByPrefix({
        FolderPath: S3FoldersPaths.userFolderPath(
          userId || req.user!._id!.toString(),
        ),
      }),
      this._quizAttemptRepository.deleteMany({
        filter: { userId: userId || req.user!._id! },
      }),
      this._savedQuizRepository.deleteMany({
        filter: { userId: userId || req.user!._id! },
      }),
      this._quizCooldownRepository.deleteMany({
        filter: { userId: userId || req.user!._id! },
      }),
      this._notificationPushDeviceRepository.deleteMany({
        filter: { userId: userId || req.user!._id! },
      }),
      //Todo: delete account progress
    ]);

    return successHandler({ res, message: "Account Deleted Permanently ✅" });
  };

  submitFeedback = async (req: Request, res: Response): Promise<Response> => {
    const { text, stars } = req.validationResult
      .body as SubmitFeedbackBodyDtoType;

    const lastFeedback = await this._feedbackRepository.findOne({
      filter: { createdBy: req.user!._id },
      options: { sort: { createdAt: -1 } },
    });

    if (
      lastFeedback &&
      lastFeedback.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ) {
      throw new BadRequestException(
        "You can only submit feedback once every 24 hours ❌",
      );
    }

    await this._feedbackRepository.create({
      data: [{ text, stars, createdBy: req.user!._id }],
    });

    return successHandler({
      res,
      message: "Feedback submitted successfully ✅",
    });
  };

  getFeedbacks = async (req: Request, res: Response): Promise<Response> => {
    const { page, size } = req.validationResult
      .query as GetFeedbacksQueryDtoType;

    const feedbacks = await this._feedbackRepository.paginate({
      filter: {},
      page,
      size,
      options: { sort: { createdAt: -1 } },
    });

    if (!feedbacks?.data?.length) {
      throw new NotFoundException("No feedbacks found ❌");
    }
    return successHandler({ res, body: feedbacks });
  };

  replyToFeedback = async (req: Request, res: Response): Promise<Response> => {
    const { feedbackId } = req.params as ReplyToFeedbackParamsDtoType;
    const { text } = req.body as ReplyToFeedbackBodyDtoType;

    const feedback = await this._feedbackRepository.findOne({
      filter: { _id: feedbackId },
      options: { populate: [{ path: "createdBy", select: "email" }] },
    });

    if (!feedback) {
      throw new NotFoundException("Feedback not found ❌");
    }

    if (feedback.reply) {
      throw new BadRequestException("This feedback has been replied to ❌");
    }

    if (feedback.createdBy.equals(req.user!._id)) {
      throw new BadRequestException("Can't reply on a feedback you created ❌");
    }

    await this._feedbackRepository.updateOne({
      filter: { _id: feedback },
      update: { reply: { text, createdBy: req.user!._id! } },
    });

    emailEvent.publish({
      eventName: EmailEventsEnum.feedbackReply,
      payload: {
        to: (feedback.createdBy as unknown as IUser).email,
        otpOrLink: text,
      },
    });

    return successHandler({ res });
  };

  deleteFeedback = async (req: Request, res: Response): Promise<Response> => {
    const { feedbackId } = req.params as DeleteFeedbackParamsDtoType;

    const result = await this._feedbackRepository.deleteOne({
      filter: { _id: feedbackId },
    });

    if (!result.deletedCount) {
      throw new NotFoundException("Invalid feedbackId or already deleted ❌");
    }

    return successHandler({ res });
  };
}

export default UserService;
