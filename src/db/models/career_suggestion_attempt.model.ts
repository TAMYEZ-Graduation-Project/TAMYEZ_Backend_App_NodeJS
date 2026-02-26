import mongoose from "mongoose";
import ModelsNames from "../../utils/constants/models.names.constants.ts";
import type { Model } from "mongoose";
import type {
  FullICareerSuggestionAttempt,
  ICareerSuggestionAttempt,
  ISuggestedCareer,
} from "../interfaces/career_suggestion_attempt.interface.ts";
import DocumentFormat from "../../utils/formats/document.format.ts";

const suggestedCareerSchema = new mongoose.Schema<ISuggestedCareer>(
  {
    careerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: ModelsNames.careerModel,
      required: true,
    },
    title: { type: String, required: true },
    reason: { type: String, required: true },
    confidence: { type: Number, required: true },
  },
  {
    strictQuery: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    id: false,
  },
);

suggestedCareerSchema.virtual("id").get(function () {
  return this._id;
});

suggestedCareerSchema.methods.toJSON = function () {
  const { careerId, title, reason, confidence } =
    this.toObject() as ISuggestedCareer;
  return {
    careerId,
    title,
    reason,
    confidence,
  };
};

const careerSuggestionAttemptSchema =
  new mongoose.Schema<ICareerSuggestionAttempt>(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        unique: true,
        ref: ModelsNames.userModel,
      },

      suggestions: [suggestedCareerSchema],

      expiresAt: { type: Date, required: true, expires: 0 },
    },
    {
      timestamps: true,
      toObject: { virtuals: true },
      toJSON: { virtuals: true },
      id: false,
    },
  );

careerSuggestionAttemptSchema.virtual("id").get(function () {
  return this._id;
});

careerSuggestionAttemptSchema.methods.toJSON = function () {
  return DocumentFormat.getIdFrom_Id<FullICareerSuggestionAttempt>(
    this.toObject(),
  );
};

const CareerSuggestionAttemptModel =
  (mongoose.models
    .CareerSuggestionAttempt as Model<ICareerSuggestionAttempt>) ||
  mongoose.model<ICareerSuggestionAttempt>(
    ModelsNames.careerSuggestionAttemptModel,
    careerSuggestionAttemptSchema,
  );

export default CareerSuggestionAttemptModel;
