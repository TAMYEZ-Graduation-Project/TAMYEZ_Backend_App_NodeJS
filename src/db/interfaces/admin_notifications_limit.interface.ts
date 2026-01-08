import type { Default__v, HydratedDocument, Require_id, Types } from "mongoose";
import type { AdminNotificationTypesEnum } from "../../utils/constants/enum.constants.ts";

export interface IAdminNotificationsLimit {
  id?: Types.ObjectId | undefined; // virtual

  careerId?: Types.ObjectId;

  type: AdminNotificationTypesEnum;
  count: number;

  sentBy: Types.ObjectId[];

  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type FullIAdminNotificationsLimit = Require_id<
  Default__v<IAdminNotificationsLimit>
>;

export type HIAdminNotificationsLimit =
  HydratedDocument<IAdminNotificationsLimit>;
