import mongoose, { Model } from "mongoose";
import type { IRevokedToken } from "../interfaces/revoked_token.interface.ts";
import ModelsNames from "../../utils/constants/models.names.constants.ts";

const revokedTokenSchema = new mongoose.Schema<IRevokedToken>(
  {
    jti: { type: String, required: true },
    expiresAt: { type: Date, required: true, expires: 0 },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: ModelsNames.userModel,
    },
  },
  { timestamps: true }
);

const RevokedTokenModel =
  (mongoose.models.RevokedToken as Model<IRevokedToken>) ||
  mongoose.model<IRevokedToken>(
    ModelsNames.revokedTokenModel,
    revokedTokenSchema
  );

export default RevokedTokenModel;
