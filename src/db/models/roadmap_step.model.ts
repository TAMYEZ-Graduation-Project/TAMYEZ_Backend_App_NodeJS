import mongoose from "mongoose";
import ModelsNames from "../../utils/constants/models.names.constants.ts";
import { softDeleteFunction } from "../../utils/soft_delete/soft_delete.ts";
import DocumentFormat from "../../utils/formats/document.format.ts";
import { atByObjectSchema } from "./common_schemas.model.ts";
import type { IRoadmapStep } from "../interfaces/roadmap_step.interface.ts";
import type {
  FullIRoadmapStepResource,
  IRoadmapStepResource,
} from "../interfaces/common.interface.ts";
import {
  LanguagesEnum,
  RoadmapStepPricingTypesEnum,
} from "../../utils/constants/enum.constants.ts";

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
  }
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
  },
  {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false,
  }
);

roadmapStepSchema.index({ careerId: 1, order: 1 }, { unique: true });
roadmapStepSchema.index({ careerId: 1, title: 1 }, { unique: true });

roadmapStepSchema.virtual("id").get(function (this) {
  return this._id.toHexString();
});

roadmapStepSchema.methods.toJSON = function () {
  const userObject: IRoadmapStep = DocumentFormat.getIdFrom_Id<IRoadmapStep>(
    this.toObject()
  );

  return {
    id: userObject.id,
    order: userObject.order,
    careerId: userObject.careerId,
    title: userObject.title,
    description: userObject.description,
    courses: userObject.courses.map((course) =>
      DocumentFormat.getIdFrom_Id<IRoadmapStepResource>(
        course as FullIRoadmapStepResource
      )
    ),
    youtubePlaylists: userObject.youtubePlaylists.map((playlist) =>
      DocumentFormat.getIdFrom_Id<IRoadmapStepResource>(
        playlist as FullIRoadmapStepResource
      )
    ),
    books: userObject?.books?.map((book) =>
      DocumentFormat.getIdFrom_Id<IRoadmapStepResource>(
        book as FullIRoadmapStepResource
      )
    ),
    quizzesIds: userObject.quizzesIds,
    freezed: userObject?.freezed,
    restored: userObject?.restored,
    createdAt: userObject.createdAt,
    updatedAt: userObject.updatedAt,
  };
};

roadmapStepSchema.pre(
  ["find", "findOne", "findOneAndUpdate", "countDocuments"],
  function (next) {
    softDeleteFunction(this);

    next();
  }
);

const RoadmapStepModel =
  (mongoose.models?.RoadmapStep as mongoose.Model<IRoadmapStep>) ||
  mongoose.model<IRoadmapStep>(ModelsNames.roadmapStepModel, roadmapStepSchema);

export default RoadmapStepModel;
