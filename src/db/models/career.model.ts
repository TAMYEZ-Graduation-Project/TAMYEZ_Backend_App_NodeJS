import mongoose from "mongoose";
import type { ICareer } from "../interfaces/career.interface.ts";
import ModelsNames from "../../utils/constants/models.names.constants.ts";
import { softDeleteFunction } from "../../utils/soft_delete/soft_delete.ts";
import DocumentFormat from "../../utils/formats/document.format.ts";
import { atByObjectSchema } from "./common_schemas.model.ts";
import slugify from "slugify";
import type { FullIRoadmapStep } from "../interfaces/roadmap_step.interface.ts";
import type { ICareerResource } from "../interfaces/common.interface.ts";
import {
  CareerResourceAppliesToEnum,
  LanguagesEnum,
  RoadmapStepPricingTypesEnum,
} from "../../utils/constants/enum.constants.ts";
import S3KeyUtil from "../../utils/multer/s3_key.multer.ts";

const careerResourceSchema = new mongoose.Schema<ICareerResource>(
  {
    title: { type: String, required: true, min: 3, max: 100 },
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

    appliesTo: {
      type: String,
      enum: Object.values(CareerResourceAppliesToEnum),
      default: CareerResourceAppliesToEnum.all,
    },

    specifiedSteps: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: ModelsNames.roadmapStepModel,
      required: function (this: ICareerResource) {
        return this.appliesTo === CareerResourceAppliesToEnum.specific;
      },
    },
  },
  {
    timestamps: false,
  }
);

const careerSchema = new mongoose.Schema<ICareer>(
  {
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
  },
  {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false,
  }
);

careerSchema.virtual("id").get(function (this) {
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
  const userObject: ICareer = DocumentFormat.getIdFrom_Id<ICareer>(
    this.toObject()
  );

  return {
    id: userObject.id,
    title: userObject.title,
    slug: userObject.slug,
    pictureUrl: S3KeyUtil.generateS3UploadsUrlFromSubKey(userObject.pictureUrl),
    description: userObject.description,
    isActive: userObject.isActive,
    roadmapSteps: userObject?.roadmapSteps?.map((step) => {
      return {
        id: (step as FullIRoadmapStep)?._id,
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

careerSchema.pre(
  ["find", "findOne", "findOneAndUpdate", "countDocuments"],
  function (next) {
    softDeleteFunction(this);

    next();
  }
);

const CareerModel =
  (mongoose.models?.Career as mongoose.Model<ICareer>) ||
  mongoose.model<ICareer>(ModelsNames.careerModel, careerSchema);

export default CareerModel;
