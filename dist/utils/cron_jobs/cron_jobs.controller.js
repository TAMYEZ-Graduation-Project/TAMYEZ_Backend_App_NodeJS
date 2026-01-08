import { CronJob } from "cron";
import notificationEvents from "../events/notifications.events.js";
import { NotificationEventsEnum } from "../constants/enum.constants.js";
const startAllCronJobs = () => {
    dailyNotificationJob.start();
};
const dailyNotificationJob = CronJob.from({
    cronTime: "0 10 * * *",
    onTick: () => {
        console.log("Inside cron Job");
        notificationEvents.publish({
            eventName: NotificationEventsEnum.mutlipleNotifications,
            payload: {
                title: "Your Future Is Taking Shape 🚀",
                body: "One step today brings you closer to the professional you’re becoming—TAMYEZ will guide you all the way.",
                imageUrl: "https://raw.githubusercontent.com/TAMYEZ-Graduation-Project/TAMYEZ_Backend_App_NodeJS/refs/heads/main/assets/daily_motivation_notification_50.png",
            },
        });
    },
    onComplete: null,
    start: true,
    timeZone: "Africa/Cairo",
});
export default startAllCronJobs;
