import mongoose from "mongoose";
import ModelsNames from "../../utils/constants/models.names.js";
import { QuestionTypesEnum } from "../../utils/constants/enum.constants.js";
const questionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: Object.values(QuestionTypesEnum),
        required: true,
    },
    text: { type: String, required: true },
    correctAnswer: {
        type: mongoose.Schema.Types.Mixed,
        required: function () {
            return this.type !== QuestionTypesEnum.written;
        },
        validate: {
            validator: function (val) {
                switch (this.type) {
                    case QuestionTypesEnum.mcqSingle:
                        return typeof val === "string";
                    case QuestionTypesEnum.mcqMulti:
                        return (Array.isArray(val) &&
                            val.every((item) => typeof item === "string"));
                    default:
                        console.log("inside default");
                        return false;
                }
            },
            message: "correctAnswer type does not match question type ❌",
        },
    },
}, {
    strictQuery: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
});
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
    writtenQuestionsIndexes: {
        type: [Number],
        required: function () {
            return Boolean(this.questions.find((value) => value.type === QuestionTypesEnum.written));
        },
    },
    questions: [questionSchema],
    expiresAt: { type: Date, required: true, expires: 0 },
}, { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } });
const QuizQuestionsModel = mongoose.models.QuizQuestions ||
    mongoose.model(ModelsNames.quizQuestionsModel, quizQuestionsSchema);
export default QuizQuestionsModel;
