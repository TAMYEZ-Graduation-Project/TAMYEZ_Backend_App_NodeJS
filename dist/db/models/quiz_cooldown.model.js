import mongoose, { Model } from "mongoose";
import ModelsNames from "../../utils/constants/models.names.js";
const quizCooldownSchema = new mongoose.Schema({
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: ModelsNames.quizModel,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: ModelsNames.userModel,
        required: true,
    },
    cooldownEndsAt: {
        type: Date,
        required: true,
        expires: 0,
    },
}, {
    id: false,
    strictQuery: true,
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
quizCooldownSchema.virtual("id").get(function () {
    return this._id;
});
quizCooldownSchema.index({ quizId: 1, userId: 1 }, { unique: true });
const QuizCooldownModel = mongoose.models.QuizCooldown ||
    mongoose.model(ModelsNames.quizCooldownModel, quizCooldownSchema);
export default QuizCooldownModel;
