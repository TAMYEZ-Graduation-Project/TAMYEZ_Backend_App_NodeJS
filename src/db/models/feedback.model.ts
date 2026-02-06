import mongoose, { Model, Types } from "mongoose";
import ModelsNames from "../../utils/constants/models.names.constants.ts";
import DocumentFormat from "../../utils/formats/document.format.ts";
import type { IFeedback, IReply } from "../interfaces/feedback.interface.ts";
import type { FullIUser, IUser } from "../interfaces/user.interface.ts";
import type { PartialUndefined } from "../../utils/types/partial_undefined.type.ts";

const replySchema = new mongoose.Schema<IReply>(
  {
    text: { type: String, required: true, min: 5, max: 1000 },
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
    text: { type: String, required: true, min: 5, max: 1000 },
    stars: { type: Number, required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: ModelsNames.userModel,
      required: true,
    },
    reply: { type: replySchema },
  },
  {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

feedbackSchema.methods.toJSON = function () {
  const feedbackObject = DocumentFormat.getIdFrom_Id<IFeedback>(
    this.toObject(),
  );

  if (!Types.ObjectId.isValid(feedbackObject.createdBy.toString())) {
    (
      feedbackObject.createdBy as unknown as PartialUndefined<FullIUser>
    ).firstName = undefined;
    (
      feedbackObject.createdBy as unknown as PartialUndefined<FullIUser>
    ).lastName = undefined;

    feedbackObject.createdBy = DocumentFormat.getIdFrom_Id<IUser>(
      feedbackObject.createdBy as unknown as FullIUser,
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
    createdAt: feedbackObject?.createdAt,
    updateAt: feedbackObject?.updatedAt,
    v: feedbackObject?.v,
  };
};

const FeedbackModel =
  (mongoose.models.Feedback as Model<IFeedback>) ||
  mongoose.model<IFeedback>(ModelsNames.feedbackModel, feedbackSchema);

export default FeedbackModel;
