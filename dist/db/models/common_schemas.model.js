import mongoose from "mongoose";
import ModelsNames from "../../utils/constants/models.names.constants.js";
import { OptionIdsEnum, ProvidersEnum, } from "../../utils/constants/enum.constants.js";
export const atByObjectSchema = new mongoose.Schema({
    at: { type: Date, required: true },
    by: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: ModelsNames.userModel,
    },
}, { _id: false });
export const codeExpireCountObjectSchema = new mongoose.Schema({
    code: { type: String, required: true },
    expiresAt: { type: Date, require: true },
    count: { type: Number, default: 0 },
}, { _id: false });
export const profilePictureObjectSchema = new mongoose.Schema({
    url: { type: String, required: true },
    provider: {
        type: String,
        enum: Object.values(ProvidersEnum),
        default: ProvidersEnum.local,
    },
}, { _id: false });
export const idSelectedAtObjectSchema = new mongoose.Schema({
    id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: ModelsNames.userModel,
    },
    selectedAt: { type: Date, required: true },
}, { _id: false });
export const questionOptionSchema = new mongoose.Schema({
    id: { type: String, enum: Object.values(OptionIdsEnum), required: true },
    text: { type: String, required: true },
}, { _id: false });
