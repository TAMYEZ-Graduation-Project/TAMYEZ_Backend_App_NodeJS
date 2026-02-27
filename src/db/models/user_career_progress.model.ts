import mongoose, { Model } from "mongoose";
import type { IUserCareerProgress } from "../interfaces/user_career_progress.interface.ts";
import ModelsNames from "../../utils/constants/models.names.constants.ts";
import DocumentFormat from "../../utils/formats/document.format.ts";

const userCareerProgressSchema = new mongoose.Schema<IUserCareerProgress>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: ModelsNames.userModel,
      required: true,
    },
    careerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: ModelsNames.careerModel,
      required: true,
    },

    completedSteps: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: ModelsNames.roadmapStepModel,
      },
    ],
    inProgressStep: {
      type: mongoose.Schema.Types.ObjectId,
      ref: ModelsNames.roadmapStepModel,
    },
    nextStep: {
      type: mongoose.Schema.Types.ObjectId,
      ref: ModelsNames.roadmapStepModel,
    },
    frontierStep: {
      type: mongoose.Schema.Types.ObjectId,
      ref: ModelsNames.roadmapStepModel,
    },

    orderEpoch: { type: Number, default: 0 },
    percentageCompleted: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userCareerProgressSchema.methods.toJSON = function () {
  const quizObject = DocumentFormat.getIdFrom_Id<IUserCareerProgress>(
    this.toObject(),
  );

  return {
    id: quizObject?.id,
    userId: quizObject?.userId,
    careerId: quizObject?.careerId,
    completedSteps: quizObject?.completedSteps,
    inProgressStep: quizObject?.inProgressStep,
    nextStep: quizObject?.nextStep,
    frontierStep: quizObject?.frontierStep,
    percentageCompleted: quizObject?.percentageCompleted,
    createdAt: quizObject?.createdAt,
    updatedAt: quizObject?.updatedAt,
    v: quizObject?.v,
  };
};

userCareerProgressSchema.index({ userId: 1, careerId: 1 }, { unique: true });
userCareerProgressSchema.index({ careerId: 1 });

// userCareerProgressSchema.pre(
//   ["find", "findOne", "updateOne", "findOneAndUpdate", "countDocuments"],
//   function (next) {
//     softDeleteFunction(this);
//     next();
//   },
// );

const UserCareerProgressModel =
  (mongoose.models.UserCareerProgress as Model<IUserCareerProgress>) ||
  mongoose.model<IUserCareerProgress>(
    ModelsNames.userCareerProgressModel,
    userCareerProgressSchema,
  );

export default UserCareerProgressModel;
