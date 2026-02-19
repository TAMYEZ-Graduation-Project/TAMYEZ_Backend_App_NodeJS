import mongoose, { Model } from "mongoose";
import ModelsNames from "../../utils/constants/models.names.constants.js";
import DocumentFormat from "../../utils/formats/document.format.js";
import { DashboardReviewTypes } from "../../utils/constants/enum.constants.js";
const dashboardReviewSchema = new mongoose.Schema({
    reviewType: {
        type: String,
        enum: Object.values(DashboardReviewTypes),
        required: true,
        unique: true,
    },
    activeCount: {
        type: BigInt,
        validate: { validator: Number.isInteger },
        required: true,
    },
}, {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    versionKey: false,
});
dashboardReviewSchema.methods.toJSON = function () {
    const reviewObject = DocumentFormat.getIdFrom_Id(this.toObject());
    return {
        id: reviewObject?.id,
        reviewType: reviewObject?.reviewType,
        activeCount: reviewObject?.activeCount,
        createdAt: reviewObject?.createdAt,
        updateAt: reviewObject?.updateAt,
        v: reviewObject?.v,
    };
};
const DashboardReviewModel = mongoose.models.DashboardReview ||
    mongoose.model(ModelsNames.dashboardReviewModel, dashboardReviewSchema);
export default DashboardReviewModel;
