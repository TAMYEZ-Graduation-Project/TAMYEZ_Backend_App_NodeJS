import mongoose from "mongoose";
import ModelsNames from "../../utils/constants/models.names.constants.js";
import DocumentFormat from "../../utils/formats/document.format.js";
const suggestedCareerSchema = new mongoose.Schema({
    careerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: ModelsNames.careerModel,
        required: true,
    },
    title: { type: String, required: true },
    reason: { type: String, required: true },
    confidence: { type: Number, required: true },
}, {
    strictQuery: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    id: false,
});
suggestedCareerSchema.virtual("id").get(function () {
    return this._id;
});
suggestedCareerSchema.methods.toJSON = function () {
    const { careerId, title, reason, confidence } = this.toObject();
    return {
        careerId,
        title,
        reason,
        confidence,
    };
};
const careerSuggestionAttemptSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        unique: true,
        ref: ModelsNames.userModel,
    },
    suggestions: [suggestedCareerSchema],
    expiresAt: { type: Date, required: true, expires: 0 },
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    id: false,
});
careerSuggestionAttemptSchema.virtual("id").get(function () {
    return this._id;
});
careerSuggestionAttemptSchema.methods.toJSON = function () {
    return DocumentFormat.getIdFrom_Id(this.toObject());
};
const CareerSuggestionAttemptModel = mongoose.models
    .CareerSuggestionAttempt ||
    mongoose.model(ModelsNames.careerSuggestionAttemptModel, careerSuggestionAttemptSchema);
export default CareerSuggestionAttemptModel;
