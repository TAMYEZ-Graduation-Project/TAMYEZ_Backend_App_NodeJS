import mongoose from "mongoose";
import ModelsNames from "../../utils/constants/models.names.constants.js";
import { softDeleteFunction } from "../../utils/soft_delete/soft_delete.js";
import DocumentFormat from "../../utils/formats/document.format.js";
import { atByObjectSchema } from "./common_schemas.model.js";
import { LanguagesEnum, RoadmapStepPricingTypesEnum, } from "../../utils/constants/enum.constants.js";
import S3KeyUtil from "../../utils/multer/s3_key.multer.js";
const roadmapStepResourceSchema = new mongoose.Schema({
    title: { type: String, required: true, min: 3, max: 300 },
    url: { type: String, required: true },
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
}, {
    timestamps: false,
});
const roadmapStepSchema = new mongoose.Schema({
    careerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: ModelsNames.careerModel,
        required: true,
    },
    order: {
        type: Number,
        required: true,
        min: 1,
        max: 1_000,
        validators: {
            varidator: Number.isInteger,
            message: "{VALUE} is not an integer value",
        },
    },
    title: { type: String, required: true, min: 3, max: 100 },
    description: { type: String, min: 5, max: 10_000, required: true },
    courses: {
        type: [roadmapStepResourceSchema],
        min: 1,
        max: 5,
        required: true,
    },
    youtubePlaylists: {
        type: [roadmapStepResourceSchema],
        min: 1,
        max: 5,
        required: true,
    },
    books: { type: [roadmapStepResourceSchema], max: 5, default: [] },
    allowGlobalResources: { type: Boolean, default: false },
    quizzesIds: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: ModelsNames.quizModel,
        min: 1,
        max: 5,
        required: true,
    },
    freezed: atByObjectSchema,
    restored: atByObjectSchema,
}, {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false,
});
roadmapStepSchema.index({ careerId: 1, order: 1 }, { unique: true });
roadmapStepSchema.index({ careerId: 1, title: 1 }, { unique: true });
roadmapStepSchema.index({ _id: 1, "courses._id": 1 }, { unique: true });
roadmapStepSchema.index({ _id: 1, "youtubePlaylists._id": 1 }, { unique: true });
roadmapStepSchema.index({ _id: 1, "books._id": 1 }, { unique: true });
roadmapStepSchema.virtual("id").get(function () {
    return this._id.toHexString();
});
roadmapStepSchema.methods.toJSON = function () {
    const roadmapStepObject = DocumentFormat.getIdFrom_Id(this.toObject());
    return {
        id: roadmapStepObject?.id,
        order: roadmapStepObject?.order,
        careerId: roadmapStepObject?.careerId,
        title: roadmapStepObject?.title,
        description: roadmapStepObject?.description,
        courses: roadmapStepObject?.courses?.map((course) => {
            course.pictureUrl = S3KeyUtil.generateS3UploadsUrlFromSubKey(course.pictureUrl);
            return DocumentFormat.getIdFrom_Id(course);
        }),
        youtubePlaylists: roadmapStepObject?.youtubePlaylists?.map((playlist) => {
            playlist.pictureUrl = S3KeyUtil.generateS3UploadsUrlFromSubKey(playlist.pictureUrl);
            return DocumentFormat.getIdFrom_Id(playlist);
        }),
        books: roadmapStepObject?.books?.map((book) => {
            book.pictureUrl = S3KeyUtil.generateS3UploadsUrlFromSubKey(book.pictureUrl);
            return DocumentFormat.getIdFrom_Id(book);
        }),
        quizzesIds: roadmapStepObject.quizzesIds,
        freezed: roadmapStepObject?.freezed,
        restored: roadmapStepObject?.restored,
        createdAt: roadmapStepObject.createdAt,
        updatedAt: roadmapStepObject.updatedAt,
    };
};
roadmapStepSchema.pre(["find", "findOne", "findOneAndUpdate", "countDocuments"], function (next) {
    softDeleteFunction(this);
    next();
});
const RoadmapStepModel = mongoose.models?.RoadmapStep ||
    mongoose.model(ModelsNames.roadmapStepModel, roadmapStepSchema);
export default RoadmapStepModel;
