import mongoose, { Types } from "mongoose";
import ModelsNames from "../../utils/constants/models.names.constants.ts";
import { softDeleteFunction } from "../../utils/soft_delete/soft_delete.ts";
import DocumentFormat from "../../utils/formats/document.format.ts";
import { atByObjectSchema } from "./common_schemas.model.ts";
import type { IRoadmapStep } from "../interfaces/roadmap_step.interface.ts";
import type {
  FullIRoadmapStepResource,
  ICareerResource,
  IRoadmapStepResource,
} from "../interfaces/common.interface.ts";
import {
  CareerResourceAppliesToEnum,
  LanguagesEnum,
  RoadmapStepPricingTypesEnum,
} from "../../utils/constants/enum.constants.ts";
import S3KeyUtil from "../../utils/multer/s3_key.multer.ts";
import { roadmapStepArraySchemaValidator } from "../../utils/validators/mongoose.validators.ts";
import type { FullIQuiz, IQuiz } from "../interfaces/quiz.interface.ts";
import type { ICareer } from "../interfaces/career.interface.ts";

const roadmapStepResourceSchema = new mongoose.Schema<IRoadmapStepResource>(
  {
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
  },
  {
    timestamps: false,
  },
);

const roadmapStepSchema = new mongoose.Schema<IRoadmapStep>(
  {
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
  },
  {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false,
  },
);

roadmapStepSchema.index({ careerId: 1, order: 1 }, { unique: true });
roadmapStepSchema.index({ careerId: 1, title: 1 }, { unique: true });

roadmapStepSchema.index({ _id: 1, "courses._id": 1 }, { unique: true });
roadmapStepSchema.index(
  { _id: 1, "youtubePlaylists._id": 1 },
  { unique: true },
);
roadmapStepSchema.index({ _id: 1, "books._id": 1 }, { unique: true });

roadmapStepSchema.virtual("id").get(function (this) {
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
    },
  },
});

function mergeResources({
  stepId,
  current,
  global,
}: {
  stepId: Types.ObjectId;
  current: IRoadmapStepResource[];
  global?: ICareerResource[] | undefined;
}) {
  if (!global || !global?.length) return;
  const out = current;

  for (const res of global) {
    if (
      (res.appliesTo === CareerResourceAppliesToEnum.all ||
        res.specifiedSteps?.includes(stepId)) &&
      current.findIndex((c) => c.title == res.title || c.url == res.url) == -1
    ) {
      out.push(res);
    }
  }

  return out;
}

roadmapStepSchema.methods.toJSON = function () {
  const roadmapStepObject = DocumentFormat.getIdFrom_Id<IRoadmapStep>(
    this.toObject(),
  );

  return {
    id: roadmapStepObject?.id,
    order: roadmapStepObject?.order,
    careerId: roadmapStepObject?.careerId || undefined,
    title: roadmapStepObject?.title,
    description: roadmapStepObject?.description,
    courses: roadmapStepObject?.courses?.map((course) => {
      course.pictureUrl = S3KeyUtil.generateS3UploadsUrlFromSubKey(
        course.pictureUrl,
      );
      return DocumentFormat.getIdFrom_Id<IRoadmapStepResource>(
        course as FullIRoadmapStepResource,
      );
    }),
    youtubePlaylists: roadmapStepObject?.youtubePlaylists?.map((playlist) => {
      playlist.pictureUrl = S3KeyUtil.generateS3UploadsUrlFromSubKey(
        playlist.pictureUrl,
      );
      return DocumentFormat.getIdFrom_Id<IRoadmapStepResource>(
        playlist as FullIRoadmapStepResource,
      );
    }),
    books: roadmapStepObject?.books?.map((book) => {
      book.pictureUrl = S3KeyUtil.generateS3UploadsUrlFromSubKey(
        book.pictureUrl,
      );

      return DocumentFormat.getIdFrom_Id<IRoadmapStepResource>(
        book as FullIRoadmapStepResource,
      );
    }),
    quizzesIds:
      roadmapStepObject?.quizzesIds?.length &&
      !Types.ObjectId.isValid(roadmapStepObject.quizzesIds[0]?.toString() ?? "")
        ? roadmapStepObject.quizzesIds.map((quiz) => {
            console.log("Inside map");

            return DocumentFormat.getIdFrom_Id<IQuiz>(
              quiz as unknown as FullIQuiz,
            );
          })
        : roadmapStepObject?.quizzesIds,
    freezed: roadmapStepObject?.freezed,
    restored: roadmapStepObject?.restored,
    createdAt: roadmapStepObject.createdAt,
    updatedAt: roadmapStepObject.updatedAt,
    v: roadmapStepObject.v,
  };
};

roadmapStepSchema.pre(
  ["find", "findOne", "findOneAndUpdate", "countDocuments"],
  function (next) {
    softDeleteFunction(this);

    next();
  },
);

roadmapStepSchema.post("findOne", function (doc, next) {
  if (doc.allowGlobalResources && !Types.ObjectId.isValid(doc.career)) {
    mergeResources({
      current: doc.courses,
      global: (doc as unknown as IRoadmapStep & { career: ICareer }).career
        ?.courses,
      stepId: doc._id,
    });

    mergeResources({
      current: doc.youtubePlaylists,
      global: (doc as unknown as IRoadmapStep & { career: ICareer }).career
        ?.youtubePlaylists,
      stepId: doc._id,
    });

    mergeResources({
      current: doc.books,
      global:
        (doc as unknown as IRoadmapStep & { career: ICareer }).career?.books ??
        [],
      stepId: doc._id,
    });
  }

  next();
});

const RoadmapStepModel =
  (mongoose.models?.RoadmapStep as mongoose.Model<IRoadmapStep>) ||
  mongoose.model<IRoadmapStep>(ModelsNames.roadmapStepModel, roadmapStepSchema);

export default RoadmapStepModel;
