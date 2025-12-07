import mongoose, { Model } from "mongoose";
import type { IQuizCooldown } from "../interfaces/quiz_cooldown.interface.ts";
import ModelsNames from "../../utils/constants/models.names.ts";

const quizCooldownSchema = new mongoose.Schema<IQuizCooldown>(
  {
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
  },
  {
    id: false,
    strictQuery: true,
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

quizCooldownSchema.virtual("id").get(function () {
  return this._id;
});

quizCooldownSchema.index({ quizId: 1, userId: 1 }, { unique: true });

const QuizCooldownModel =
  (mongoose.models.QuizCooldown as Model<IQuizCooldown>) ||
  mongoose.model<IQuizCooldown>(
    ModelsNames.quizCooldownModel,
    quizCooldownSchema
  );

export default QuizCooldownModel;
