import { z } from "zod";
import AppRegex from "../../utils/constants/regex.constants.ts";
import StringConstants from "../../utils/constants/strings.constants.ts";
import { PlatformsEnum } from "../../utils/constants/enum.constants.ts";
import generalValidationConstants from "../../utils/constants/validation.constants.ts";

class FirebaseValidators {
  static readonly sendNotificationsToAllUsers = {
    body: z.strictObject({
      title: z
        .string({ error: StringConstants.PATH_REQUIRED_MESSAGE("title") })
        .min(3)
        .max(200),
      body: z
        .string({ error: StringConstants.PATH_REQUIRED_MESSAGE("body") })
        .min(5)
        .max(1000),
      imageUrl: z.url().optional(),
    }),
  };

  static readonly sendNotification = {
    body: this.sendNotificationsToAllUsers.body.extend({
      fcmToken: generalValidationConstants.fcmToken,
    }),
  };

  static readonly sendMultiNotifications = {
    body: this.sendNotificationsToAllUsers.body.extend({
      fcmTokens: z.array(generalValidationConstants.fcmToken),
    }),
  };

  static readonly disableNotifications = {
    body: z.strictObject({
      deviceId: generalValidationConstants.deviceId,
    }),
  };

  static readonly refreshFcmToken = {
    body: this.disableNotifications.body.extend({
      fcmToken: generalValidationConstants.fcmToken,
    }),
  };

  static readonly enableNotifications = {
    body: this.refreshFcmToken.body.extend({
      replaceDeviceId: z
        .string({ error: StringConstants.PATH_REQUIRED_MESSAGE("deviceId") })
        .regex(AppRegex.deviceIdRegex, {
          error: "Invalid deviceId, it should be a valid UUID ❌",
        })
        .optional(),

      appVersion: z
        .string({
          error: StringConstants.PATH_REQUIRED_MESSAGE("appVersion"),
        })
        .regex(AppRegex.appVersionRegex, {
          error:
            "appVersion must consists from 2 to 4 parts each separated by a dot e.g: 1.0, 1.0.0, 1.0.0.0 ❌",
        }),

      platform: z.enum(Object.values(PlatformsEnum)),
      os: z
        .string({ error: StringConstants.PATH_REQUIRED_MESSAGE("os") })
        .regex(AppRegex.osRegex, {
          error:
            "Invalid os ❌, it must be either Android, IOS, or Web followed by version number e.g Android 11",
        }),
      deviceModel: z
        .string({
          error: StringConstants.PATH_REQUIRED_MESSAGE("deviceModel"),
        })
        .regex(AppRegex.deviceModelRegex, {
          error: "Invalid device model format ❌",
        }),
    }),
  };
}

export default FirebaseValidators;
