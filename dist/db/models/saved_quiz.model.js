import mongoose, { Model } from "mongoose";
import { QuestionTypesEnum } from "../../utils/constants/enum.constants.js";
import { validateIfValidQuestionAnswer } from "../../utils/question/validate_options.question.js";
import ModelsNames from "../../utils/constants/models.names.js";
import { questionOptionSchema } from "./common_schemas.model.js";
const savedQuestionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    type: {
        type: String,
        enum: Object.values(QuestionTypesEnum),
        required: true,
    },
    isCorrect: { type: Boolean, required: true },
    options: {
        type: [questionOptionSchema],
        default: undefined,
        required: function () {
            return (this.type === QuestionTypesEnum.mcqSingle ||
                this.type === QuestionTypesEnum.mcqMulti);
        },
        minlength: 2,
        maxlength: 4,
        set: (v) => Array.isArray(v) && v.length === 0 ? undefined : v,
    },
    userAnswer: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
        validate: {
            validator: function (value) {
                return validateIfValidQuestionAnswer({
                    questionType: this.type,
                    value,
                });
            },
            message: "Invalid userAnswer format ❌",
        },
    },
    correction: {
        type: mongoose.Schema.Types.Mixed,
        requied: function () {
            return !this.isCorrect;
        },
        validate: {
            validator: function (value) {
                return validateIfValidQuestionAnswer({
                    questionType: this.type,
                    value,
                });
            },
            message: "Invalid correction format ❌",
        },
    },
    explanation: {
        type: String,
        maxLength: 1000,
        required: function () {
            return this.isCorrect === false;
        },
    },
}, { strictQuery: true, timestamps: true, id: false });
savedQuestionSchema.virtual("id").get(function () {
    return this._id;
});
savedQuestionSchema.methods.toJSON = function () {
    const { _id, text, type, isCorrect, options, userAnswer, correction, explanation, } = this.toObject();
    return {
        id: _id,
        text,
        type,
        isCorrect,
        options: options?.length ? options : undefined,
        userAnswer,
        correction,
        explanation,
    };
};
const savedQuizSchema = new mongoose.Schema({
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: ModelsNames.quizModel,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: ModelsNames.userModel,
    },
    questions: {
        type: [savedQuestionSchema],
        required: true,
        minlength: 1,
        maxlength: 150,
    },
    score: { type: String, required: true },
    takenAt: { type: Date, required: true },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false,
    strictQuery: true,
});
savedQuizSchema.index({ quizId: 1, userId: 1 }, { unique: true });
savedQuizSchema.virtual("id").get(function () {
    return this._id;
});
savedQuizSchema.methods.toJSON = function () {
    const { _id, quizId, score, userId, takenAt, createdAt, updatedAt } = this.toObject();
    let quiz;
    if (typeof quizId === "object" && quizId._id) {
        const { _id, ...restObj } = quizId;
        quiz = { id: _id, ...restObj };
    }
    return {
        id: _id,
        quizId: quiz || quizId,
        userId,
        score,
        questions: this.questions?.map((question) => {
            return question.toJSON();
        }),
        takenAt,
        createdAt,
        updatedAt,
    };
};
const SavedQuizModel = mongoose.models.SavedQuiz ||
    mongoose.model(ModelsNames.savedQuizModel, savedQuizSchema);
export default SavedQuizModel;
