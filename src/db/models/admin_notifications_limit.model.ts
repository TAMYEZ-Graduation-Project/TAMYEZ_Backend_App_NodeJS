import mongoose, { Model, Schema } from "mongoose";
import ModelsNames from "../../utils/constants/models.names.constants.ts";
import { AdminNotificationTypesEnum } from "../../utils/constants/enum.constants.ts";
import DocumentFormat from "../../utils/formats/document.format.ts";
import type { IAdminNotificationsLimit } from "../interfaces/admin_notifications_limit.interface.ts";

const adminNotificationsLimitSchema =
  new mongoose.Schema<IAdminNotificationsLimit>(
    {
      type: {
        type: String,
        enum: Object.values(AdminNotificationTypesEnum),
        require: true,
      },
      count: {
        type: Number,
        default: 0,
        min: 0,
        max: 2,
      },
      careerId: {
        type: Schema.Types.ObjectId,
        ref: "Career",
        unique: true,
        required: function (this) {
          return this.type === AdminNotificationTypesEnum.careerSpecific;
        },
        validate: {
          validator: function (value) {
            return (
              (!value && this.type === AdminNotificationTypesEnum.allUsers) ||
              (value && this.type === AdminNotificationTypesEnum.careerSpecific)
            );
          },
          message:
            "careerId shouldn't have a value when type of the limit is AllUsers notifications",
        },
      },
      sentBy: { type: [Schema.Types.ObjectId], ref: "User" },
      expiresAt: { type: Date, expires: 0, required: true },
    },
    {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
      id: false,
    },
  );

adminNotificationsLimitSchema.virtual("id").get(function () {
  return this._id;
});

adminNotificationsLimitSchema.methods.toJSON = function () {
  const adminLimit = DocumentFormat.getIdFrom_Id<IAdminNotificationsLimit>(
    this.toObject(),
  );

  return {
    id: adminLimit.id,
    type: adminLimit.type,
    count: adminLimit.count,
    careerId: adminLimit?.careerId,
    expiresAt: adminLimit.expiresAt,
    createdAt: adminLimit?.createdAt,
    updatedAt: adminLimit?.updatedAt,
    v: adminLimit?.v,
  };
};

const AdminNotificationsLimitModel =
  (mongoose.models
    .AdminNotificationsLimit as Model<IAdminNotificationsLimit>) ||
  mongoose.model<IAdminNotificationsLimit>(
    ModelsNames.adminNotificationsLimit,
    adminNotificationsLimitSchema,
  );

export default AdminNotificationsLimitModel;
