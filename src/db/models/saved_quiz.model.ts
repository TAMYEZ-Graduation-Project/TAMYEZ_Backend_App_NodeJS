import mongoose, { Model, Types } from "mongoose";
import type {
  FullISavedQuestion,
  FullISavedQuiz,
  HISavedQuestion,
  ISavedQuestion,
  ISavedQuiz,
} from "../interfaces/saved_quiz.interface.ts";
import { QuestionTypesEnum } from "../../utils/constants/enum.constants.ts";
import { validateIfValidQuestionAnswer } from "../../utils/question/validate_options.question.ts";
import ModelsNames from "../../utils/constants/models.names.constants.ts";
import { questionOptionSchema } from "./common_schemas.model.ts";
import type { IQuizQuestionOption } from "../interfaces/common.interface.ts";
import type { FullIQuiz } from "../interfaces/quiz.interface.ts";

const savedQuestionSchema = new mongoose.Schema<ISavedQuestion>(
  {
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
      requied: function (this) {
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
      required: function (this) {
        return this.isCorrect === false;
      },
    },
  },
  { strictQuery: true, timestamps: true, id: false },
);

savedQuestionSchema.virtual("id").get(function () {
  return this._id;
});

savedQuestionSchema.methods.toJSON = function () {
  const {
    _id,
    text,
    type,
    isCorrect,
    options,
    userAnswer,
    correction,
    explanation,
  } = this.toObject() as FullISavedQuestion;
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

const savedQuizSchema = new mongoose.Schema<ISavedQuiz>(
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

    careerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: ModelsNames.careerModel,
    },

    roadmapStepId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: ModelsNames.careerModel,
    },

    questions: {
      type: [savedQuestionSchema],
      required: true,
      minlength: 1,
      maxlength: 150,
    },

    score: { type: String, required: true },

    takenAt: { type: Date, required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false,
    strictQuery: true,
  },
);

savedQuizSchema.index({ quizId: 1, userId: 1 }, { unique: true });

savedQuizSchema.index({ careerId: 1 });

savedQuizSchema.index({ roadmapStepId: 1 });

savedQuizSchema.virtual("id").get(function () {
  return this._id;
});

savedQuizSchema.methods.toJSON = function () {
  const { _id, quizId, score, userId, takenAt, createdAt, updatedAt } =
    this.toObject() as FullISavedQuiz;

  let quiz;
  if (!Types.ObjectId.isValid(quizId.toString())) {
    const { _id, ...restObj } = quizId as unknown as FullIQuiz;
    quiz = { id: _id, ...restObj };
  }

  return {
    id: _id,
    quizId: quiz || quizId,
    userId,
    score,
    questions: (this.questions as HISavedQuestion[])?.map((question) => {
      return (question as HISavedQuestion).toJSON();
    }),
    takenAt,
    createdAt,
    updatedAt,
  };
};

const SavedQuizModel =
  (mongoose.models.SavedQuiz as Model<ISavedQuiz>) ||
  mongoose.model<ISavedQuiz>(ModelsNames.savedQuizModel, savedQuizSchema);

export default SavedQuizModel;
