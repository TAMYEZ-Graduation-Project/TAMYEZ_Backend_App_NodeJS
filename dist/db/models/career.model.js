import mongoose, {} from "mongoose";
import ModelsNames from "../../utils/constants/models.names.constants.js";
import { softDeleteFunction } from "../../utils/soft_delete/soft_delete.js";
import DocumentFormat from "../../utils/formats/document.format.js";
import { atByObjectSchema } from "./common_schemas.model.js";
import slugify from "slugify";
import { CareerResourceAppliesToEnum, LanguagesEnum, RoadmapStepPricingTypesEnum, } from "../../utils/constants/enum.constants.js";
import S3KeyUtil from "../../utils/multer/s3_key.multer.js";
import EnvFields from "../../utils/constants/env_fields.constants.js";
import { careerArraySchemaValidator } from "../../utils/validators/mongoose.validators.js";
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
    summary: { type: String, min: 5, max: 150, required: true },
    assetFolderId: { type: String, required: true },
    isActive: { type: Boolean, default: false },
    courses: {
        type: [careerResourceSchema],
        default: [],
        validate: careerArraySchemaValidator(),
    },
    youtubePlaylists: {
        type: [careerResourceSchema],
        default: [],
        validate: careerArraySchemaValidator(),
    },
    books: {
        type: [careerResourceSchema],
        default: [],
        validate: careerArraySchemaValidator(),
    },
    stepsCount: { type: Number, default: 0 },
    orderEpoch: { type: Number, default: 0 },
    freezed: atByObjectSchema,
    restored: atByObjectSchema,
}, {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false,
});
careerSchema.index({ _id: 1, "courses._id": 1 }, { unique: true });
careerSchema.index({ _id: 1, "youtubePlaylists._id": 1 }, { unique: true });
careerSchema.index({ _id: 1, "books._id": 1 }, { unique: true });
careerSchema.virtual("id").get(function () {
    return this?._id?.toHexString();
});
careerSchema.virtual("roadmap", {
    ref: ModelsNames.roadmapStepModel,
    localField: "_id",
    foreignField: "careerId",
    justOne: false,
    options: { sort: { order: 1 } },
});
careerSchema.methods.toJSON = function () {
    const careerObject = DocumentFormat.getIdFrom_Id(this.toObject());
    return {
        id: careerObject?.id,
        title: careerObject?.title,
        slug: careerObject?.slug,
        pictureUrl: careerObject.pictureUrl ===
            process.env[EnvFields.CAREER_DEFAULT_PICTURE_URL]
            ? careerObject.pictureUrl
            : S3KeyUtil.generateS3UploadsUrlFromSubKey(careerObject?.pictureUrl),
        description: careerObject?.description,
        isActive: careerObject?.isActive,
        courses: careerObject?.courses?.map((c) => {
            c.pictureUrl = S3KeyUtil.generateS3UploadsUrlFromSubKey(c.pictureUrl);
            return DocumentFormat.getIdFrom_Id(c);
        }),
        youtubePlaylists: careerObject?.youtubePlaylists?.map((c) => {
            c.pictureUrl = S3KeyUtil.generateS3UploadsUrlFromSubKey(c.pictureUrl);
            return DocumentFormat.getIdFrom_Id(c);
        }),
        books: careerObject?.books?.map((c) => {
            c.pictureUrl = S3KeyUtil.generateS3UploadsUrlFromSubKey(c.pictureUrl);
            return DocumentFormat.getIdFrom_Id(c);
        }),
        stepsCount: careerObject?.stepsCount,
        orderEpoch: careerObject?.orderEpoch,
        roadmap: careerObject?.roadmap?.map((step) => {
            return {
                id: step?._id,
                title: step?.title,
                description: step?.description,
                order: step?.order,
                createdAt: step?.createdAt,
                updatedAT: step?.updatedAt,
                v: step?.__v,
                freezed: step?.freezed,
            };
        }),
        freezed: careerObject?.freezed,
        restored: careerObject?.restored,
        createdAt: careerObject?.createdAt,
        updatedAt: careerObject?.updatedAt,
        v: careerObject?.v,
    };
};
careerSchema.pre("save", async function (next) {
    if (this.isModified("title")) {
        this.slug = slugify.default(this.title);
    }
    next();
});
careerSchema.pre(["find", "findOne", "updateOne", "findOneAndUpdate", "countDocuments"], function (next) {
    const update = this.getUpdate();
    if (update) {
        if (Array.isArray(update)) {
            if (update[0]["$set"]?.title) {
                update[0]["$set"].slug = slugify.default(update[0]["$set"]?.title);
            }
        }
        else {
            if (update.title) {
                update.slug = slugify.default(update.title);
            }
        }
        this.setUpdate(update);
    }
    softDeleteFunction(this);
    next();
});
const CareerModel = mongoose.models?.Career ||
    mongoose.model(ModelsNames.careerModel, careerSchema);
export default CareerModel;
