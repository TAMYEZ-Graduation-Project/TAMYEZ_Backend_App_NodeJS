import mongoose from "mongoose";
import ModelsNames from "../../utils/constants/models.names.js";
import { QuestionTypesEnum } from "../../utils/constants/enum.constants.js";
import { questionOptionSchema } from "./common_schemas.model.js";
import { validateIfValidQuestionAnswer } from "../../utils/question/validate_options.question.js";
const questionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: Object.values(QuestionTypesEnum),
        required: true,
    },
    text: { type: String, required: true },
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
    correctAnswer: {
        type: mongoose.Schema.Types.Mixed,
        required: function () {
            return this.type !== QuestionTypesEnum.written;
        },
        validate: {
            validator: function (value) {
                return validateIfValidQuestionAnswer({
                    questionType: this.type,
                    value,
                });
            },
            message: "correctAnswer type does not match question type ❌",
        },
    },
    explanation: {
        type: String,
        maxlength: 500,
        required: function () {
            return this.type !== QuestionTypesEnum.written;
        },
    },
}, {
    strictQuery: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    id: false,
});
questionSchema.virtual("id").get(function () {
    return this._id;
});
questionSchema.methods.toJSON = function () {
    const { _id, text, type, options } = this.toObject();
    return {
        id: _id,
        text,
        type,
        options: options?.length ? options : undefined,
    };
};
const quizQuestionsSchema = new mongoose.Schema({
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
        type: [questionSchema],
        required: true,
        minlength: 1,
        maxlength: 150,
    },
    expiresAt: { type: Date, required: true, expires: 0 },
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    id: false,
});
quizQuestionsSchema.index({ quizId: 1, userId: 1 }, { unique: true });
quizQuestionsSchema.virtual("id").get(function () {
    return this._id;
});
quizQuestionsSchema.methods.toJSON = function () {
    const { _id, quizId, userId, createdAt, updatedAt } = this.toObject();
    return {
        id: _id,
        quizId,
        userId,
        createdAt,
        updatedAt,
        questions: this.questions.map((question) => {
            return question.toJSON();
        }),
    };
};
const QuizQuestionsModel = mongoose.models.QuizQuestions ||
    mongoose.model(ModelsNames.quizQuestionsModel, quizQuestionsSchema);
export default QuizQuestionsModel;
