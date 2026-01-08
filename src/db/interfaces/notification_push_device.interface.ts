import type { Default__v, HydratedDocument, Require_id, Types } from "mongoose";
import type { PlatformsEnum } from "../../utils/constants/enum.constants.ts";

export interface INotificationPushDevice {
  id?: Types.ObjectId | undefined;
  userId: Types.ObjectId;
  deviceId: string;

  fcmToken: string;
  jwtTokenExpiresAt: Date;

  platform: PlatformsEnum;
  appVersion: string;
  os: string;
  deviceModel: string;

  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type FullINotificationPushDevice = Require_id<
  Default__v<INotificationPushDevice>
>;

export type HINotificationPushDevice =
  HydratedDocument<INotificationPushDevice>;
