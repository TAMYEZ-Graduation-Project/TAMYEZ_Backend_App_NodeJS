import NotificationService from "../../utils/firebase/services/notifications/notification.service.js";
import successHandler from "../../utils/handlers/success.handler.js";
import { AdminNotificationsLimitRepository, CareerRepository, NotificationPushDeviceRepository, } from "../../db/repositories/index.js";
import { AdminNotificationsLimitModel, CareerModel, NotificationPushDeviceModel, } from "../../db/models/index.js";
import { BadRequestException, ConflictException, NotFoundException, ServerException, } from "../../utils/exceptions/custom.exceptions.js";
import notificationEvents from "../../utils/events/notifications.events.js";
import { AdminNotificationTypesEnum, NotificationEventsEnum, } from "../../utils/constants/enum.constants.js";
import EnvFields from "../../utils/constants/env_fields.constants.js";
import { Types } from "mongoose";
class FirebaseService {
    _notificationService = new NotificationService();
    _notificationPushDeviceRepository = new NotificationPushDeviceRepository(NotificationPushDeviceModel);
    _adminNotificationsLimitRepository = new AdminNotificationsLimitRepository(AdminNotificationsLimitModel);
    _careerRepository = new CareerRepository(CareerModel);
    sendFirebaseNotification = async (req, res) => {
        const { title, body, imageUrl, fcmToken } = req.body;
        await this._notificationService.sendNotification({
            title,
            body,
            imageUrl,
            deviceToken: fcmToken,
        });
        return successHandler({ req,
            res,
            message: "Notification Sent Successfully 🔔",
        });
    };
    sendMultipleFirebaseNotifications = async (req, res) => {
        const { title, body, imageUrl, fcmTokens } = req.body;
        const { successCount, failureCount } = await this._notificationService.sendMultipleNotifications({
            title,
            body,
            imageUrl,
            deviceTokens: fcmTokens,
        });
        return successHandler({ req,
            res,
            message: "Notifications Sent Successfully 🔔",
            body: { response: { successCount, failureCount } },
        });
    };
    sendNotificationsToAllUsers = async (req, res) => {
        const body = req.body;
        const notificationLimit = await this._adminNotificationsLimitRepository.findOne({
            filter: { type: AdminNotificationTypesEnum.allUsers },
        });
        if (notificationLimit && notificationLimit.count >= 2) {
            throw new BadRequestException("The maximum number of send notifications to all Users have been reached ❌");
        }
        notificationEvents.publish({
            eventName: NotificationEventsEnum.allUsers,
            payload: body,
        });
        if (notificationLimit) {
            await notificationLimit.updateOne({
                $inc: { count: 1 },
                $addToSet: { sentBy: req.user._id },
            });
        }
        else {
            await this._adminNotificationsLimitRepository.create({
                data: [
                    {
                        type: AdminNotificationTypesEnum.allUsers,
                        expiresAt: new Date(Date.now() +
                            Number(process.env[EnvFields.QUIZ_COOLDOWN_IN_SECONDS]) * 1000),
                        sentBy: [req.user._id],
                        count: 1,
                    },
                ],
            });
        }
        return successHandler({ req,
            res,
            message: "Your notification will be sent shortly ✅ 🔔",
        });
    };
    sendNotificationsToCareerUsers = async (req, res) => {
        const { careerId } = req.params;
        const body = req.body;
        const career = await this._careerRepository.findOne({
            filter: { _id: careerId },
        });
        if (!career) {
            throw new NotFoundException("Invalid careerId or freezed ❌");
        }
        const notificationLimit = await this._adminNotificationsLimitRepository.findOne({
            filter: { type: AdminNotificationTypesEnum.careerSpecific, careerId },
        });
        if (notificationLimit && notificationLimit.count >= 2) {
            throw new BadRequestException(`The maximum number of send notifications ${career.title} career Users have been reached ❌`);
        }
        notificationEvents.publish({
            eventName: NotificationEventsEnum.careerUsers,
            payload: { ...body, careerId },
        });
        if (notificationLimit) {
            await notificationLimit.updateOne({
                $inc: { count: 1 },
                $addToSet: { sentBy: req.user._id },
            });
        }
        else {
            await this._adminNotificationsLimitRepository.create({
                data: [
                    {
                        type: AdminNotificationTypesEnum.careerSpecific,
                        careerId: Types.ObjectId.createFromHexString(careerId),
                        expiresAt: new Date(Date.now() +
                            Number(process.env[EnvFields.QUIZ_COOLDOWN_IN_SECONDS]) * 1000),
                        sentBy: [req.user._id],
                        count: 1,
                    },
                ],
            });
        }
        return successHandler({ req,
            res,
            message: "Your notification will be sent shortly ✅ 🔔",
        });
    };
    enableNotifications = async (req, res) => {
        const { replaceDeviceId, ...restObj } = req.body;
        const pushDevices = await this._notificationPushDeviceRepository.find({
            filter: { userId: req.user._id },
            options: { projection: { fcmToken: 0 } },
        });
        if (pushDevices?.length &&
            pushDevices.find((p) => p.deviceId === restObj.deviceId)) {
            throw new ConflictException("This deviceId has already an enabled notification push device ❌");
        }
        let statusCode;
        if (pushDevices?.length && pushDevices.length >= 2) {
            if (!replaceDeviceId) {
                throw new BadRequestException("You have two enabled push Devices, please choose one to replace:", undefined, pushDevices);
            }
            else if (pushDevices.findIndex((p) => p.deviceId === replaceDeviceId) == -1) {
                throw new NotFoundException("Invalid replaceDeviceId not found for this user ❌");
            }
            else {
                const result = await this._notificationPushDeviceRepository.replaceOne({
                    filter: { userId: req.user._id, deviceId: replaceDeviceId },
                    replacement: {
                        ...restObj,
                        userId: req.user._id,
                        jwtTokenExpiresAt: new Date(req.tokenPayload.exp * 1000),
                        isActive: true,
                    },
                });
                if (!result.matchedCount) {
                    if (!result) {
                        throw new ServerException("Failed to enable notifications, please try again later ☹️");
                    }
                }
                statusCode = 200;
            }
        }
        else {
            const result = await this._notificationPushDeviceRepository.create({
                data: [
                    {
                        ...restObj,
                        userId: req.user._id,
                        jwtTokenExpiresAt: new Date(req.tokenPayload.exp * 1000),
                    },
                ],
            });
            if (!result) {
                throw new ServerException("Failed to enable notifications, please try again later ☹️");
            }
            statusCode = 201;
        }
        return successHandler({ req,
            res,
            statusCode,
            message: "Notifications enabled for this device successfully ✅ 🔔",
        });
    };
    refreshFcmToken = async (req, res) => {
        const { fcmToken, deviceId } = req.body;
        const result = await this._notificationPushDeviceRepository.updateOne({
            filter: {
                userId: req.user._id,
                deviceId,
            },
            update: {
                fcmToken,
            },
        });
        if (!result.matchedCount) {
            throw new NotFoundException("Invalid deviceId, or notification is already disabled ❌");
        }
        return successHandler({ req,
            res,
            message: "Fcm Token has been refreshed sucessfully ✅",
        });
    };
    disableNotifications = async (req, res) => {
        const { deviceId } = req.body;
        const pushDevice = await this._notificationPushDeviceRepository.findOneAndDelete({
            filter: { userId: req.user._id, deviceId },
        });
        if (!pushDevice) {
            throw new BadRequestException("Invalid deviceId, or notification is already disabled ❌");
        }
        return successHandler({ req,
            res,
            message: "Notifications for this device has been disabled successfully ✅",
        });
    };
}
export default FirebaseService;
