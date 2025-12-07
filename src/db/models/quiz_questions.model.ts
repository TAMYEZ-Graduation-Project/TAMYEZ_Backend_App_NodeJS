import mongoose from "mongoose";
import type {
  FullIQuestion,
  FullIQuizQuestions,
  HIQuestion,
  IQuestion,
  IQuizQuestions,
} from "../interfaces/quiz_questions.interface.ts";
import ModelsNames from "../../utils/constants/models.names.ts";
import { QuestionTypesEnum } from "../../utils/constants/enum.constants.ts";
import type { Model } from "mongoose";
import { questionOptionSchema } from "./common_schemas.model.ts";
import { validateIfValidQuestionAnswer } from "../../utils/question/validate_options.question.ts";
import type { IQuizQuestionOption } from "../interfaces/common.interface.ts";

const questionSchema = new mongoose.Schema<IQuestion>(
  {
    type: {
      type: String,
      enum: Object.values(QuestionTypesEnum),
      required: true,
    },
    text: { type: String, required: true },
    options: {
      type: [questionOptionSchema],
      default: undefined,
      required: function (this) {
        return (
          this.type === QuestionTypesEnum.mcqSingle ||
          this.type === QuestionTypesEnum.mcqMulti
        );
      },
      minlength: 2,
      maxlength: 4,
      set: (v: IQuizQuestionOption[]) =>
        Array.isArray(v) && v.length === 0 ? undefined : v,
    },
    correctAnswer: {
      type: mongoose.Schema.Types.Mixed,
      required: function (this) {
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
      required: function (this) {
        return this.type !== QuestionTypesEnum.written;
      },
    },
  },
  {
    strictQuery: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    id: false,
  }
);

questionSchema.virtual("id").get(function () {
  return this._id;
});

questionSchema.methods.toJSON = function () {
  const { _id, text, type, options } = this.toObject() as FullIQuestion;
  return {
    id: _id,
    text,
    type,
    options: options?.length ? options : undefined,
  };
};

const quizQuestionsSchema = new mongoose.Schema<IQuizQuestions>(
  {
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
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    id: false,
  }
);

quizQuestionsSchema.index({ quizId: 1, userId: 1 }, { unique: true });

quizQuestionsSchema.virtual("id").get(function () {
  return this._id;
});

quizQuestionsSchema.methods.toJSON = function () {
  const { _id, quizId, userId, createdAt, updatedAt } =
    this.toObject() as FullIQuizQuestions;
  return {
    id: _id,
    quizId,
    userId,
    createdAt,
    updatedAt,
    questions: (this.questions as HIQuestion[]).map((question) => {
      return (question as HIQuestion).toJSON();
    }),
  };
};

const QuizQuestionsModel =
  (mongoose.models.QuizQuestions as Model<IQuizQuestions>) ||
  mongoose.model<IQuizQuestions>(
    ModelsNames.quizQuestionsModel,
    quizQuestionsSchema
  );

export default QuizQuestionsModel;
