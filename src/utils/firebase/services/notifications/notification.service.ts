import type {
  BatchResponse,
  MulticastMessage,
  TokenMessage,
} from "firebase-admin/messaging";
import { firebaseAdmin } from "../../index.ts";
import { ServerException } from "../../../exceptions/custom.exceptions.ts";
import type { INotificationPushDevice } from "../../../../db/interfaces/notification_push_device.interface.ts";
import { NotificationPushDeviceRepository } from "../../../../db/repositories/index.ts";
import NotificationPushDeviceModel from "../../../../db/models/notifiction_push_device.model.ts";

class NotificationService {
  sendNotification = async ({
    deviceToken,
    title,
    body,
    imageUrl,
  }: {
    deviceToken: string;
    title: string;
    body: string;
    imageUrl?: string | undefined;
  }) => {
    const message: TokenMessage = {
      notification: {
        title,
        body,
      },
      token: deviceToken,
    };

    if (imageUrl) message.notification!.imageUrl = imageUrl;
    return firebaseAdmin.messaging().send(message);
  };

  sendMultipleNotifications = async ({
    deviceTokens,
    title,
    body,
    imageUrl,
  }: {
    deviceTokens: string[];
    title: string;
    body: string;
    imageUrl?: string | undefined;
  }): Promise<BatchResponse> => {
    const message: MulticastMessage = {
      notification: {
        title,
        body,
      },
      tokens: deviceTokens,
    };

    if (imageUrl) message.notification!.imageUrl = imageUrl;
    const result = await firebaseAdmin
      .messaging()
      .sendEachForMulticast(message);
    return result;
  };

  sendMultipleNotificationsAndDeactivatePushDevices = async ({
    title,
    body,
    imageUrl,
    pushDevices,
  }: {
    title: string;
    body: string;
    imageUrl?: string | undefined;
    pushDevices: INotificationPushDevice[];
  }) => {
    if (pushDevices.length > 300) {
      throw new ServerException("Exceeded the max number of pushDevices ❌");
    }
    const response = await this.sendMultipleNotifications({
      title,
      body,
      imageUrl,
      deviceTokens: pushDevices.map((p) => {
        if (Date.now() >= p.jwtTokenExpiresAt.getTime()) {
          return "";
        }
        return p.fcmToken;
      }),
    });

    const failureDevices = [];
    for (let i = 0; i < response.responses.length; i++) {
      if (!response.responses[i]?.success) {
        failureDevices.push(pushDevices[i]);
      }
    }

    const _notificationPushDeviceRepository =
      new NotificationPushDeviceRepository(NotificationPushDeviceModel);

    await _notificationPushDeviceRepository.updateMany({
      filter: {
        userId: { $in: failureDevices.map((fd) => fd?.userId) },
        deviceId: { $in: failureDevices.map((fd) => fd?.deviceId) },
      },
      update: {
        isActive: false,
        $unset: { fcmToken: true },
      },
    });
  };
}
export default NotificationService;
