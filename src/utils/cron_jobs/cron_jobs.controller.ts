import { CronJob } from "cron";
import notificationEvents from "../events/notifications.events.ts";
import { NotificationEventsEnum } from "../constants/enum.constants.ts";
import EnvFields from "../constants/env_fields.constants.ts";

const startAllCronJobs = () => {
  dailyNotificationJob.start();
};

const dailyNotificationJob = CronJob.from({
  cronTime: process.env[EnvFields.DAILY_MOTIVATIONAL_NOTIFICATION_TIME]!,
  onTick: () => {
    notificationEvents.publish({
      eventName: NotificationEventsEnum.mutlipleNotifications,
      payload: {
        title: process.env[EnvFields.DAILY_MOTIVATIONAL_NOTIFICATION_TITLE]!,
        body: process.env[EnvFields.DAILY_MOTIVATIONAL_NOTIFICATION_BODY]!,
        imageUrl:
          process.env[EnvFields.DAILY_MOTIVATIONAL_NOTIFICATION_IMAGE_URL],
      },
    });
  },
  onComplete: null,
  timeZone: "Africa/Cairo",
});

export default startAllCronJobs;
