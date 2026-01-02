import { firebaseAdmin } from "../../index.js";
import { ServerException } from "../../../exceptions/custom.exceptions.js";
import { NotificationPushDeviceRepository } from "../../../../db/repositories/index.js";
import NotificationPushDeviceModel from "../../../../db/models/notifiction_push_device.model.js";
class NotificationService {
    sendNotification = async ({ deviceToken, title, body, imageUrl, }) => {
        const message = {
            notification: {
                title,
                body,
            },
            token: deviceToken,
        };
        if (imageUrl)
            message.notification.imageUrl = imageUrl;
        return firebaseAdmin.messaging().send(message);
    };
    sendMultipleNotifications = async ({ deviceTokens, title, body, imageUrl, }) => {
        const message = {
            notification: {
                title,
                body,
            },
            tokens: deviceTokens,
        };
        if (imageUrl)
            message.notification.imageUrl = imageUrl;
        const result = await firebaseAdmin
            .messaging()
            .sendEachForMulticast(message);
        console.log({
            result,
            responses: result.responses,
        });
        return result;
    };
    sendMultipleNotificationsAndDeactivatePushDevices = async ({ title, body, imageUrl, pushDevices, }) => {
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
        const _notificationPushDeviceRepository = new NotificationPushDeviceRepository(NotificationPushDeviceModel);
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
