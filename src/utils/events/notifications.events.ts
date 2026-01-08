import { EventEmitter } from "node:events";
import CustomEvents from "./custom.events.ts";
import type { INotificationParams } from "../constants/interface.constants.ts";
import { NotificationEventsEnum } from "../constants/enum.constants.ts";
import { NotificationPushDeviceRepository } from "../../db/repositories/index.ts";
import NotificationPushDeviceModel from "../../db/models/notifiction_push_device.model.ts";
import NotificationService from "../firebase/services/notifications/notification.service.ts";

const notificationEvents = new CustomEvents<
  INotificationParams,
  NotificationEventsEnum
>(new EventEmitter());

notificationEvents.subscribe({
  eventName: NotificationEventsEnum.mutlipleNotifications,
  bgFunction: async (payload) => {
    const _notificationPushDeviceRepository =
      new NotificationPushDeviceRepository(NotificationPushDeviceModel);

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
      await _notificationService.sendMultipleNotificationsAndDeactivatePushDevices(
        {
          ...payload,
          pushDevices: paginationResult.data ?? [],
        }
      );
    } while ((paginationResult.totalPages ?? 1) - 1 !== page);
  },
});

export default notificationEvents;
