import mongoose, { Model } from "mongoose";
import ModelsNames from "../../utils/constants/models.names.constants.js";
import { atByObjectSchema } from "./common_schemas.model.js";
import { QuizTypesEnum } from "../../utils/constants/enum.constants.js";
import DocumentFormat from "../../utils/formats/document.format.js";
import { softDeleteFunction } from "../../utils/soft_delete/soft_delete.js";
const quizSchema = new mongoose.Schema({
    uniqueKey: { type: String, required: true, unique: true },
    title: { type: String, minLength: 3, maxLength: 200, required: true },
    description: {
        type: String,
        minLength: 3,
        maxLength: 50_000,
        required: true,
    },
    aiPrompt: {
        type: String,
        minLength: 3,
        maxLength: 50_000,
        required: true,
    },
    type: {
        type: String,
        enum: Object.values(QuizTypesEnum),
        default: QuizTypesEnum.stepQuiz,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: ModelsNames.userModel,
        required: true,
    },
    duration: {
        type: Number,
        min: 60,
        max: 36_000,
        validate: {
            validator: Number.isInteger,
            message: "{VALUE} is not an integer value",
        },
        required: function () {
            return this.type !== QuizTypesEnum.careerAssessment;
        },
    },
    tags: {
        type: [String],
        minLength: 2,
        maxLength: 20,
        required: function () {
            return this.type !== QuizTypesEnum.careerAssessment;
        },
    },
    freezed: atByObjectSchema,
    restored: atByObjectSchema,
}, {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
quizSchema.methods.toJSON = function () {
    const quizObject = DocumentFormat.getIdFrom_Id(this.toObject());
    return {
        id: quizObject?.id,
        title: quizObject?.title,
        description: quizObject?.description,
        aiPrompt: quizObject?.aiPrompt,
        uniqueKey: quizObject?.uniqueKey,
        type: quizObject?.type,
        duration: quizObject?.duration,
        tags: quizObject?.tags,
        createdBy: quizObject?.createdBy,
        createdAt: quizObject?.createdAt,
        updatedAt: quizObject?.updatedAt,
        freezed: quizObject?.freezed,
        restored: quizObject?.restored,
        v: quizObject?.v,
    };
};
quizSchema.pre(["find", "findOne", "findOneAndUpdate", "countDocuments"], function (next) {
    softDeleteFunction(this);
    next();
});
const QuizModel = mongoose.models.Quiz ||
    mongoose.model(ModelsNames.quizModel, quizSchema);
export default QuizModel;
