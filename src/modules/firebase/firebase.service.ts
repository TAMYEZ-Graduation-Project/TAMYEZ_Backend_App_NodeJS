import type { Request, Response } from "express";
import NotificationService from "../../utils/firebase/services/notifications/notification.service.ts";
import successHandler from "../../utils/handlers/success.handler.ts";
import type {
  DisableNotificationsBodyDtoType,
  EnableNotificationsBodyDtoType,
  RefreshFcmTokenBodyDtoType,
  SendMultipleNotificationsBodyDtoType,
  SendNotificationBodyDtoType,
  SendNotificationsToAllUsersBodyDtoType,
  SendNotificationToCareerUsersBodyDtoType,
  SendNotificationToCareerUsersParamsDtoType,
} from "./firebase.dto.ts";
import {
  AdminNotificationsLimitRepository,
  CareerRepository,
  NotificationPushDeviceRepository,
} from "../../db/repositories/index.ts";
import {
  AdminNotificationsLimitModel,
  CareerModel,
  NotificationPushDeviceModel,
} from "../../db/models/index.ts";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ServerException,
} from "../../utils/exceptions/custom.exceptions.ts";
import notificationEvents from "../../utils/events/notifications.events.ts";
import {
  AdminNotificationTypesEnum,
  NotificationEventsEnum,
} from "../../utils/constants/enum.constants.ts";
import EnvFields from "../../utils/constants/env_fields.constants.ts";
import { Types } from "mongoose";

class FirebaseService {
  private readonly _notificationService = new NotificationService();
  private readonly _notificationPushDeviceRepository =
    new NotificationPushDeviceRepository(NotificationPushDeviceModel);
  private readonly _adminNotificationsLimitRepository =
    new AdminNotificationsLimitRepository(AdminNotificationsLimitModel);
  private readonly _careerRepository = new CareerRepository(CareerModel);

  sendFirebaseNotification = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    const { title, body, imageUrl, fcmToken } =
      req.body as SendNotificationBodyDtoType;

    await this._notificationService.sendNotification({
      title,
      body,
      imageUrl,
      deviceToken: fcmToken,
    });

    return successHandler({
      res,
      message: "Notification Sent Successfully 🔔",
    });
  };

  sendMultipleFirebaseNotifications = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    const { title, body, imageUrl, fcmTokens } =
      req.body as SendMultipleNotificationsBodyDtoType;

    const { successCount, failureCount } =
      await this._notificationService.sendMultipleNotifications({
        title,
        body,
        imageUrl,
        deviceTokens: fcmTokens,
      });

    return successHandler({
      res,
      message: "Notifications Sent Successfully 🔔",
      body: { response: { successCount, failureCount } },
    });
  };

  sendNotificationsToAllUsers = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    const body = req.body as SendNotificationsToAllUsersBodyDtoType;

    const notificationLimit =
      await this._adminNotificationsLimitRepository.findOne({
        filter: { type: AdminNotificationTypesEnum.allUsers },
      });

    if (notificationLimit && notificationLimit.count >= 2) {
      throw new BadRequestException(
        "The maximum number of send notifications to all Users have been reached ❌",
      );
    }

    notificationEvents.publish({
      eventName: NotificationEventsEnum.allUsers,
      payload: body,
    });

    if (notificationLimit) {
      await notificationLimit.updateOne({
        $inc: { count: 1 },
        $addToSet: { sentBy: req.user!._id! },
      });
    } else {
      await this._adminNotificationsLimitRepository.create({
        data: [
          {
            type: AdminNotificationTypesEnum.allUsers,
            expiresAt: new Date(
              Date.now() +
                Number(process.env[EnvFields.QUIZ_COOLDOWN_IN_SECONDS]) * 1000,
            ),
            sentBy: [req.user!._id!],
            count: 1,
          },
        ],
      });
    }

    return successHandler({
      res,
      message: "Your notification will be sent shortly ✅ 🔔",
    });
  };

  sendNotificationsToCareerUsers = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    const { careerId } =
      req.params as SendNotificationToCareerUsersParamsDtoType;
    const body = req.body as SendNotificationToCareerUsersBodyDtoType;

    const career = await this._careerRepository.findOne({
      filter: { _id: careerId },
    });

    if (!career) {
      throw new NotFoundException("Invalid careerId or freezed ❌");
    }

    const notificationLimit =
      await this._adminNotificationsLimitRepository.findOne({
        filter: { type: AdminNotificationTypesEnum.careerSpecific, careerId },
      });

    if (notificationLimit && notificationLimit.count >= 2) {
      throw new BadRequestException(
        `The maximum number of send notifications ${career.title} career Users have been reached ❌`,
      );
    }

    notificationEvents.publish({
      eventName: NotificationEventsEnum.careerUsers,
      payload: { ...body, careerId },
    });

    if (notificationLimit) {
      await notificationLimit.updateOne({
        $inc: { count: 1 },
        $addToSet: { sentBy: req.user!._id! },
      });
    } else {
      await this._adminNotificationsLimitRepository.create({
        data: [
          {
            type: AdminNotificationTypesEnum.careerSpecific,
            careerId: Types.ObjectId.createFromHexString(careerId),
            expiresAt: new Date(
              Date.now() +
                Number(process.env[EnvFields.QUIZ_COOLDOWN_IN_SECONDS]) * 1000,
            ),
            sentBy: [req.user!._id!],
            count: 1,
          },
        ],
      });
    }

    return successHandler({
      res,
      message: "Your notification will be sent shortly ✅ 🔔",
    });
  };

  enableNotifications = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    const { replaceDeviceId, ...restObj } =
      req.body as EnableNotificationsBodyDtoType;

    const pushDevices = await this._notificationPushDeviceRepository.find({
      filter: { userId: req.user!._id },
      options: { projection: { fcmToken: 0 } },
    });

    if (
      pushDevices?.length &&
      pushDevices.find((p) => p.deviceId === restObj.deviceId)
    ) {
      throw new ConflictException(
        "This deviceId has already an enabled notification push device ❌",
      );
    }

    let statusCode;

    if (pushDevices?.length && pushDevices.length >= 2) {
      if (!replaceDeviceId) {
        throw new BadRequestException(
          "You have two enabled push Devices, please choose one to replace:",
          undefined,
          pushDevices,
        );
      } else if (
        pushDevices.findIndex((p) => p.deviceId === replaceDeviceId) == -1
      ) {
        throw new NotFoundException(
          "Invalid replaceDeviceId not found for this user ❌",
        );
      } else {
        const result = await this._notificationPushDeviceRepository.replaceOne({
          filter: { userId: req.user!._id, deviceId: replaceDeviceId },
          replacement: {
            ...restObj,
            userId: req.user!._id!,
            jwtTokenExpiresAt: new Date(req.tokenPayload!.exp!),
            isActive: true,
          },
        });
        if (!result.matchedCount) {
          if (!result) {
            throw new ServerException(
              "Failed to enable notifications, please try again later ☹️",
            );
          }
        }
        statusCode = 200;
      }
    } else {
      const result = await this._notificationPushDeviceRepository.create({
        data: [
          {
            ...restObj,
            userId: req.user!._id!,
            jwtTokenExpiresAt: new Date(req.tokenPayload!.exp! * 1000),
          },
        ],
      });

      if (!result) {
        throw new ServerException(
          "Failed to enable notifications, please try again later ☹️",
        );
      }
      statusCode = 201;
    }

    return successHandler({
      res,
      statusCode,
      message: "Notifications enabled for this device successfully ✅ 🔔",
    });
  };

  refreshFcmToken = async (req: Request, res: Response): Promise<Response> => {
    const { fcmToken, deviceId } = req.body as RefreshFcmTokenBodyDtoType;

    const result = await this._notificationPushDeviceRepository.updateOne({
      filter: {
        userId: req.user!._id!,
        deviceId,
        __v: undefined,
      },
      update: {
        fcmToken,
      },
    });

    if (!result.matchedCount) {
      throw new NotFoundException(
        "Invalid deviceId, or notification is already disabled ❌",
      );
    }

    return successHandler({
      res,
      message: "Fcm Token has been refreshed sucessfully ✅",
    });
  };

  disableNotifications = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    const { deviceId } = req.body as DisableNotificationsBodyDtoType;

    const pushDevice =
      await this._notificationPushDeviceRepository.findOneAndDelete({
        filter: { userId: req.user!._id, deviceId },
      });

    if (!pushDevice) {
      throw new BadRequestException(
        "Invalid deviceId, or notification is already disabled ❌",
      );
    }

    return successHandler({
      res,
      message:
        "Notifications for this device has been disabled successfully ✅",
    });
  };
}

export default FirebaseService;
