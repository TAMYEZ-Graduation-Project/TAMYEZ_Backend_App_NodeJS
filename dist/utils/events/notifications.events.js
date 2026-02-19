import { EventEmitter } from "node:events";
import CustomEvents from "./custom.events.js";
import { NotificationEventsEnum } from "../constants/enum.constants.js";
import { NotificationPushDeviceRepository } from "../../db/repositories/index.js";
import NotificationPushDeviceModel from "../../db/models/notifiction_push_device.model.js";
import NotificationService from "../firebase/services/notifications/notification.service.js";
import { Types } from "mongoose";
import { ServerException } from "../exceptions/custom.exceptions.js";
const notificationEvents = new CustomEvents(new EventEmitter());
notificationEvents.subscribe({
    eventName: NotificationEventsEnum.allUsers,
    bgFunction: async (payload) => {
        const _notificationPushDeviceRepository = new NotificationPushDeviceRepository(NotificationPushDeviceModel);
        let paginationResult;
        let page = 0;
        do {
            page++;
            paginationResult = await _notificationPushDeviceRepository.paginate({
                filter: {
                    isActive: true,
                },
                size: 250,
                page,
                options: {
                    projection: {
                        userId: 1,
                        deviceId: 1,
                        fcmToken: 1,
                        jwtTokenExpiresAt: 1,
                    },
                },
            });
            const _notificationService = new NotificationService();
            await _notificationService.sendMultipleNotificationsAndDeactivatePushDevices({
                ...payload,
                pushDevices: paginationResult.data ?? [],
            });
        } while (paginationResult.totalPages > page);
    },
});
notificationEvents.subscribe({
    eventName: NotificationEventsEnum.careerUsers,
    bgFunction: async (payload) => {
        const _notificationPushDeviceRepository = new NotificationPushDeviceRepository(NotificationPushDeviceModel);
        if (!payload.careerId)
            throw new ServerException("can't send notfications to career's users, careerId not provided ❌");
        let paginationResult;
        let page = 0;
        do {
            page++;
            paginationResult = (await _notificationPushDeviceRepository.aggregate({
                pipeline: [
                    {
                        $match: { isActive: true },
                    },
                    {
                        $project: {
                            userId: 1,
                            deviceId: 1,
                            fcmToken: 1,
                            jwtTokenExpiresAt: 1,
                        },
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "userId",
                            foreignField: "_id",
                            as: "userId",
                            pipeline: [
                                {
                                    $match: {
                                        "careerPath.id": Types.ObjectId.createFromHexString(payload.careerId.toString()),
                                    },
                                },
                                { $project: { email: 1, careerPath: 1 } },
                            ],
                        },
                    },
                    {
                        $unwind: "$userId",
                    },
                    {
                        $facet: {
                            data: [{ $skip: Number((page - 1) * 250) }, { $limit: 250 }],
                            meta: [{ $count: "total" }],
                        },
                    },
                    {
                        $project: {
                            total: { $ifNull: [{ $arrayElemAt: ["$meta.total", 0] }, 0] },
                            data: 1,
                        },
                    },
                ],
            }))[0] ?? { data: [], total: 0 };
            const _notificationService = new NotificationService();
            await _notificationService.sendMultipleNotificationsAndDeactivatePushDevices({
                ...payload,
                pushDevices: paginationResult.data,
            });
        } while (Math.ceil(paginationResult.total / 250) > page);
    },
});
export default notificationEvents;
