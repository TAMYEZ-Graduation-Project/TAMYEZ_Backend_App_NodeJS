import { EventEmitter } from "node:events";
import CustomEvents from "./custom.events.js";
import { NotificationEventsEnum } from "../constants/enum.constants.js";
import { NotificationPushDeviceRepository } from "../../db/repositories/index.js";
import NotificationPushDeviceModel from "../../db/models/notifiction_push_device.model.js";
import NotificationService from "../firebase/services/notifications/notification.service.js";
const notificationEvents = new CustomEvents(new EventEmitter());
notificationEvents.subscribe({
    eventName: NotificationEventsEnum.mutlipleNotifications,
    bgFunction: async (payload) => {
        const _notificationPushDeviceRepository = new NotificationPushDeviceRepository(NotificationPushDeviceModel);
        let paginationResult;
        let page = -1;
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
        } while ((paginationResult.totalPages ?? 1) - 1 !== page);
    },
});
export default notificationEvents;
