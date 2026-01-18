import mongoose from "mongoose";
import ModelsNames from "../../utils/constants/models.names.constants.js";
import { softDeleteFunction } from "../../utils/soft_delete/soft_delete.js";
import DocumentFormat from "../../utils/formats/document.format.js";
import { atByObjectSchema } from "./common_schemas.model.js";
import slugify from "slugify";
import { CareerResourceAppliesToEnum, LanguagesEnum, RoadmapStepPricingTypesEnum, } from "../../utils/constants/enum.constants.js";
import S3KeyUtil from "../../utils/multer/s3_key.multer.js";
const careerResourceSchema = new mongoose.Schema({
    title: { type: String, required: true, min: 3, max: 100 },
    url: { type: String, min: 5, required: true },
    pricingType: {
        type: String,
        enum: Object.values(RoadmapStepPricingTypesEnum),
        default: RoadmapStepPricingTypesEnum.free,
    },
    language: {
        type: String,
        enum: Object.values(LanguagesEnum),
        required: true,
    },
    pictureUrl: { type: String },
    appliesTo: {
        type: String,
        enum: Object.values(CareerResourceAppliesToEnum),
        default: CareerResourceAppliesToEnum.all,
    },
    specifiedSteps: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: ModelsNames.roadmapStepModel,
        required: function () {
            return this.appliesTo === CareerResourceAppliesToEnum.specific;
        },
    },
}, {
    timestamps: false,
});
const careerSchema = new mongoose.Schema({
    title: { type: String, unique: true, required: true, min: 3, max: 100 },
    slug: { type: String },
    pictureUrl: { type: String, required: true },
    description: { type: String, min: 5, max: 10_000, required: true },
    assetFolderId: { type: String, required: true },
    isActive: { type: Boolean, default: false },
    courses: { type: [careerResourceSchema], max: 5, default: [] },
    youtubePlaylists: {
        type: [careerResourceSchema],
        max: 5,
        default: [],
    },
    books: { type: [careerResourceSchema], max: 5, default: [] },
    stepsCount: { type: Number, default: 0 },
    freezed: atByObjectSchema,
    restored: atByObjectSchema,
}, {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false,
});
careerSchema.virtual("id").get(function () {
    return this._id.toHexString();
});
careerSchema.virtual("roadmapSteps", {
    ref: ModelsNames.roadmapStepModel,
    localField: "_id",
    foreignField: "careerId",
    justOne: false,
    options: { sort: { order: 1 } },
});
careerSchema.methods.toJSON = function () {
    const userObject = DocumentFormat.getIdFrom_Id(this.toObject());
    return {
        id: userObject.id,
        title: userObject.title,
        slug: userObject.slug,
        pictureUrl: S3KeyUtil.generateS3UploadsUrlFromSubKey(userObject.pictureUrl),
        description: userObject.description,
        isActive: userObject.isActive,
        roadmapSteps: userObject?.roadmapSteps?.map((step) => {
            return {
                id: step?._id,
                order: step?.order,
                careerId: step?.careerId,
                title: step?.title,
                description: step?.description,
            };
        }),
        freezed: userObject?.freezed,
        restored: userObject?.restored,
        createdAt: userObject.createdAt,
        updatedAt: userObject.updatedAt,
    };
};
careerSchema.pre("save", async function (next) {
    if (this.isModified("title")) {
        this.slug = slugify.default(this.title);
    }
    next();
});
careerSchema.pre(["find", "findOne", "findOneAndUpdate", "countDocuments"], function (next) {
    softDeleteFunction(this);
    next();
});
const CareerModel = mongoose.models?.Career ||
    mongoose.model(ModelsNames.careerModel, careerSchema);
export default CareerModel;
