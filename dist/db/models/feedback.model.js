import mongoose, { Model, Types } from "mongoose";
import ModelsNames from "../../utils/constants/models.names.constants.js";
import DocumentFormat from "../../utils/formats/document.format.js";
const replySchema = new mongoose.Schema({
    text: { type: String, required: true, min: 5, max: 1000 },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: ModelsNames.userModel,
        required: true,
    },
}, { _id: false, versionKey: false });
const feedbackSchema = new mongoose.Schema({
    text: { type: String, required: true, min: 5, max: 1000 },
    stars: { type: Number, required: true },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: ModelsNames.userModel,
        required: true,
    },
    reply: { type: replySchema },
}, {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
feedbackSchema.methods.toJSON = function () {
    const feedbackObject = DocumentFormat.getIdFrom_Id(this.toObject());
    if (!Types.ObjectId.isValid(feedbackObject.createdBy.toString())) {
        feedbackObject.createdBy.firstName = undefined;
        feedbackObject.createdBy.lastName = undefined;
        feedbackObject.createdBy = DocumentFormat.getIdFrom_Id(feedbackObject.createdBy);
    }
    if (feedbackObject?.reply &&
        !Types.ObjectId.isValid(feedbackObject.reply.createdBy.toString())) {
        feedbackObject.reply.createdBy = DocumentFormat.getIdFrom_Id(feedbackObject.reply.createdBy);
    }
    return {
        id: feedbackObject?.id,
        text: feedbackObject?.text,
        stars: feedbackObject?.stars,
        createdBy: feedbackObject?.createdBy,
        reply: feedbackObject?.reply,
        createdAt: feedbackObject?.createdAt,
        updateAt: feedbackObject?.updatedAt,
        v: feedbackObject?.v,
    };
};
const FeedbackModel = mongoose.models.Feedback ||
    mongoose.model(ModelsNames.feedbackModel, feedbackSchema);
export default FeedbackModel;
