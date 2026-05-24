import mongoose, { Model, Types } from "mongoose";
import ModelsNames from "../../utils/constants/models.names.constants.ts";
import DocumentFormat from "../../utils/formats/document.format.ts";
import type { IFeedback, IReply } from "../interfaces/feedback.interface.ts";
import type { FullIUser, IUser } from "../interfaces/user.interface.ts";
import type { PartialUndefined } from "../../utils/types/partial_undefined.type.ts";
import S3KeyUtil from "../../utils/multer/s3_key.multer.ts";
import { ProvidersEnum } from "../../utils/constants/enum.constants.ts";

const replySchema = new mongoose.Schema<IReply>(
  {
    text: { type: String, required: true, min: 5, max: 500 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: ModelsNames.userModel,
      required: true,
    },
  },
  { _id: false, versionKey: false },
);

const feedbackSchema = new mongoose.Schema<IFeedback>(
  {
    text: { type: String, required: true, min: 5, max: 500 },
    stars: { type: Number, required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: ModelsNames.userModel,
      required: true,
    },
    reply: { type: replySchema },
    accountDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

feedbackSchema.methods.toJSON = function () {
  console.log(this.toObject());

  const feedbackObject = DocumentFormat.getIdFrom_Id<IFeedback>(
    this.toObject(),
  );

  if (
    feedbackObject.createdBy &&
    !Types.ObjectId.isValid(feedbackObject.createdBy.toString())
  ) {
    const userObject =
      feedbackObject.createdBy as unknown as PartialUndefined<FullIUser>;
    userObject.firstName = undefined;
    userObject.lastName = undefined;

    (userObject.profilePicture as String | undefined) = userObject
      ?.profilePicture?.url
      ? userObject.profilePicture!.provider === ProvidersEnum.local
        ? S3KeyUtil.generateS3UploadsUrlFromSubKey(
            userObject.profilePicture.url,
          )
        : userObject.profilePicture.url
      : undefined;

    feedbackObject.createdBy = DocumentFormat.getIdFrom_Id<IUser>(
      userObject as unknown as FullIUser,
    ) as unknown as Types.ObjectId;
  }

  if (
    feedbackObject?.reply &&
    !Types.ObjectId.isValid(feedbackObject.reply.createdBy.toString())
  ) {
    feedbackObject.reply.createdBy = DocumentFormat.getIdFrom_Id<IUser>(
      feedbackObject.reply.createdBy as unknown as FullIUser,
    ) as unknown as Types.ObjectId;
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

const FeedbackModel =
  (mongoose.models.Feedback as Model<IFeedback>) ||
  mongoose.model<IFeedback>(ModelsNames.feedbackModel, feedbackSchema);

export default FeedbackModel;
