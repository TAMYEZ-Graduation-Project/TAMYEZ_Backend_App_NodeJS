import mongoose, { Types } from "mongoose";
import ModelsNames from "../../utils/constants/models.names.constants.js";
import { softDeleteFunction } from "../../utils/soft_delete/soft_delete.js";
import DocumentFormat from "../../utils/formats/document.format.js";
import { atByObjectSchema } from "./common_schemas.model.js";
import { CareerResourceAppliesToEnum, LanguagesEnum, RoadmapStepPricingTypesEnum, } from "../../utils/constants/enum.constants.js";
import S3KeyUtil from "../../utils/multer/s3_key.multer.js";
import { roadmapStepArraySchemaValidator } from "../../utils/validators/mongoose.validators.js";
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
        required: true,
        validate: roadmapStepArraySchemaValidator(),
    },
    youtubePlaylists: {
        type: [roadmapStepResourceSchema],
        required: true,
        validate: roadmapStepArraySchemaValidator(),
    },
    books: { type: [roadmapStepResourceSchema], max: 5, default: [] },
    allowGlobalResources: { type: Boolean, default: true },
    quizzesIds: {
        type: [
            { type: mongoose.Schema.Types.ObjectId, ref: ModelsNames.quizModel },
        ],
        required: true,
        validate: roadmapStepArraySchemaValidator(),
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
roadmapStepSchema.virtual("career", {
    ref: ModelsNames.careerModel,
    localField: "careerId",
    foreignField: "_id",
    justOne: true,
    options: {
        projection: {
            courses: 1,
            youtubePlaylists: 1,
            books: 1,
            freezed: 1,
        },
    },
});
function mergeResources({ stepId, current, global, }) {
    if (!global || !global?.length)
        return;
    const out = current;
    for (const res of global) {
        if ((res.appliesTo === CareerResourceAppliesToEnum.all ||
            res.specifiedSteps?.includes(stepId)) &&
            current.findIndex((c) => c.title == res.title || c.url == res.url) == -1) {
            out.push(res);
        }
    }
    return out;
}
roadmapStepSchema.methods.toJSON = function () {
    const roadmapStepObject = DocumentFormat.getIdFrom_Id(this.toObject());
    return {
        id: roadmapStepObject?.id,
        order: roadmapStepObject?.order,
        careerId: roadmapStepObject?.careerId || undefined,
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
        quizzesIds: roadmapStepObject?.quizzesIds?.length &&
            !Types.ObjectId.isValid(roadmapStepObject.quizzesIds[0]?.toString() ?? "")
            ? roadmapStepObject.quizzesIds.map((quiz) => {
                console.log("Inside map");
                return DocumentFormat.getIdFrom_Id(quiz);
            })
            : roadmapStepObject?.quizzesIds,
        freezed: roadmapStepObject?.freezed,
        restored: roadmapStepObject?.restored,
        createdAt: roadmapStepObject.createdAt,
        updatedAt: roadmapStepObject.updatedAt,
        v: roadmapStepObject.v,
    };
};
roadmapStepSchema.pre(["find", "findOne", "updateOne", "findOneAndUpdate", "countDocuments"], function (next) {
    softDeleteFunction(this);
    next();
});
roadmapStepSchema.post("findOne", function (doc, next) {
    if (doc &&
        doc.allowGlobalResources &&
        !Types.ObjectId.isValid(doc.career?.toString()) &&
        !doc.freezed &&
        !doc.career?.freezed) {
        mergeResources({
            current: doc.courses,
            global: doc.career
                ?.courses,
            stepId: doc._id,
        });
        mergeResources({
            current: doc.youtubePlaylists,
            global: doc.career
                ?.youtubePlaylists,
            stepId: doc._id,
        });
        mergeResources({
            current: doc.books,
            global: doc.career?.books ??
                [],
            stepId: doc._id,
        });
    }
    next();
});
const RoadmapStepModel = mongoose.models?.RoadmapStep ||
    mongoose.model(ModelsNames.roadmapStepModel, roadmapStepSchema);
export default RoadmapStepModel;
