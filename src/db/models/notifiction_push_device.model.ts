import mongoose, { Model } from "mongoose";
import type { INotificationPushDevice } from "../interfaces/notification_push_device.interface.ts";
import ModelsNames from "../../utils/constants/models.names.constants.ts";
import { PlatformsEnum } from "../../utils/constants/enum.constants.ts";
import DocumentFormat from "../../utils/formats/document.format.ts";

const notifictionPushDeviceSchema =
  new mongoose.Schema<INotificationPushDevice>(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: ModelsNames.userModel,
      },
      deviceId: {
        type: String,
        require: true,
      },

      fcmToken: { type: String, required: true },
      jwtTokenExpiresAt: { type: Date, required: true },

      appVersion: { type: String, required: true },
      platform: { type: String, enum: Object.values(PlatformsEnum) },
      os: { type: String, required: true },
      deviceModel: { type: String, required: true },

      isActive: { type: Boolean, default: true },
    },
    {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
      id: false,
    }
  );

notifictionPushDeviceSchema.virtual("id").get(function () {
  return this._id;
});

notifictionPushDeviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

notifictionPushDeviceSchema.methods.toJSON = function () {
  const pushDevice = DocumentFormat.getIdFrom_Id<INotificationPushDevice>(
    this.toObject()
  );

  return {
    id: pushDevice.id,
    userId: pushDevice.userId,
    deviceId: pushDevice.deviceId,
    fcmToken: pushDevice?.fcmToken,
    jwtTokenExpiresAt: pushDevice?.jwtTokenExpiresAt,
    appVersion: pushDevice.appVersion,
    platform: pushDevice.platform,
    os: pushDevice.os,
    deviceModel: pushDevice.deviceModel,
    isActive: pushDevice.isActive,
    createdAt: pushDevice?.createdAt,
    updatedAt: pushDevice?.updatedAt,
    v: pushDevice?.v,
  };
};

const NotificationPushDeviceModel =
  (mongoose.models.NotificationPushDevice as Model<INotificationPushDevice>) ||
  mongoose.model<INotificationPushDevice>(
    ModelsNames.notificationPushDevice,
    notifictionPushDeviceSchema
  );

export default NotificationPushDeviceModel;
