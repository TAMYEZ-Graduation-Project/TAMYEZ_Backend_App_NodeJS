import mongoose from "mongoose";
import type {
  IAtByObject,
  ICodExpireCoundObject,
  IIdSelectedAtObject,
  IProfilePictureObject,
  IQuizQuestionOption,
} from "../interfaces/common.interface.ts";
import ModelsNames from "../../utils/constants/models.names.constants.ts";
import {
  OptionIdsEnum,
  ProvidersEnum,
} from "../../utils/constants/enum.constants.ts";

export const atByObjectSchema = new mongoose.Schema<IAtByObject>(
  {
    at: { type: Date, required: true },
    by: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: ModelsNames.userModel,
    },
  },
  { _id: false },
);

export const codeExpireCountObjectSchema =
  new mongoose.Schema<ICodExpireCoundObject>(
    {
      code: { type: String, required: true },
      expiresAt: { type: Date, require: true },
      count: { type: Number, default: 0 },
    },
    { _id: false },
  );

export const profilePictureObjectSchema =
  new mongoose.Schema<IProfilePictureObject>(
    {
      url: { type: String, required: true },
      provider: {
        type: String,
        enum: Object.values(ProvidersEnum),
        default: ProvidersEnum.local,
      },
    },
    { _id: false },
  );

export const idSelectedAtObjectSchema = ({ ref }: { ref: string }) => {
  return new mongoose.Schema<IIdSelectedAtObject>(
    {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref,
      },

      selectedAt: { type: Date, required: true },
    },
    { _id: false },
  );
};

export const questionOptionSchema = new mongoose.Schema<IQuizQuestionOption>(
  {
    id: { type: String, enum: Object.values(OptionIdsEnum), required: true },
    text: { type: String, required: true },
  },
  { _id: false },
);
