import { z } from "zod";
import FirebaseValidators from "./firebase.validation.ts";

export type SendNotificationBodyDtoType = z.infer<
  typeof FirebaseValidators.sendNotification.body
>;

export type SendMultipleNotificationsBodyDtoType = z.infer<
  typeof FirebaseValidators.sendMultiNotifications.body
>;

export type SendNotificationsToAllUsersBodyDtoType = z.infer<
  typeof FirebaseValidators.sendNotificationsToAllUsers.body
>;

export type EnableNotificationsBodyDtoType = z.infer<
  typeof FirebaseValidators.enableNotifications.body
>;

export type DisableNotificationsBodyDtoType = z.infer<
  typeof FirebaseValidators.disableNotifications.body
>;

export type RefreshFcmTokenBodyDtoType = z.infer<
  typeof FirebaseValidators.refreshFcmToken.body
>;
