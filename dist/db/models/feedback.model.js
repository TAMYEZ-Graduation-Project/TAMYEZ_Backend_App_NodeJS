import mongoose, { Model, Types } from "mongoose";
import ModelsNames from "../../utils/constants/models.names.constants.js";
import DocumentFormat from "../../utils/formats/document.format.js";
import S3KeyUtil from "../../utils/multer/s3_key.multer.js";
import { ProvidersEnum } from "../../utils/constants/enum.constants.js";
const replySchema = new mongoose.Schema({
    text: { type: String, required: true, min: 5, max: 500 },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: ModelsNames.userModel,
        required: true,
    },
}, { _id: false, versionKey: false });
const feedbackSchema = new mongoose.Schema({
    text: { type: String, required: true, min: 5, max: 500 },
    stars: { type: Number, required: true },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: ModelsNames.userModel,
        required: true,
    },
    reply: { type: replySchema },
    accountDeleted: { type: Boolean, default: false },
}, {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
feedbackSchema.methods.toJSON = function () {
    console.log(this.toObject());
    const feedbackObject = DocumentFormat.getIdFrom_Id(this.toObject());
    if (feedbackObject.createdBy &&
        !Types.ObjectId.isValid(feedbackObject.createdBy.toString())) {
        const userObject = feedbackObject.createdBy;
        userObject.firstName = undefined;
        userObject.lastName = undefined;
        userObject.profilePicture = userObject
            ?.profilePicture?.url
            ? userObject.profilePicture.provider === ProvidersEnum.local
                ? S3KeyUtil.generateS3UploadsUrlFromSubKey(userObject.profilePicture.url)
                : userObject.profilePicture.url
            : undefined;
        feedbackObject.createdBy = DocumentFormat.getIdFrom_Id(userObject);
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
        accountDeleted: feedbackObject?.accountDeleted,
        createdAt: feedbackObject?.createdAt,
        updateAt: feedbackObject?.updatedAt,
        v: feedbackObject?.v,
    };
};
const FeedbackModel = mongoose.models.Feedback ||
    mongoose.model(ModelsNames.feedbackModel, feedbackSchema);
export default FeedbackModel;
