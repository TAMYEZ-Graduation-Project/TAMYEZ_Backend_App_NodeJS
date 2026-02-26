import mongoose, { Model } from "mongoose";
import ModelsNames from "../../utils/constants/models.names.constants.js";
import DocumentFormat from "../../utils/formats/document.format.js";
const userCareerProgressSchema = new mongoose.Schema({
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
        required: true,
    },
    frontierStep: {
        type: mongoose.Schema.Types.ObjectId,
        ref: ModelsNames.roadmapStepModel,
    },
    orderEpoch: { type: Number, default: 0 },
    percentageCompleted: { type: Number, default: 0 },
}, {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
userCareerProgressSchema.methods.toJSON = function () {
    const quizObject = DocumentFormat.getIdFrom_Id(this.toObject());
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
const UserCareerProgressModel = mongoose.models.UserCareerProgress ||
    mongoose.model(ModelsNames.userCareerProgressModel, userCareerProgressSchema);
export default UserCareerProgressModel;
