import type { HydratedDocument, Require_id, Types } from "mongoose";
import type {
  CareerResourceAppliesToEnum,
  LanguagesEnum,
  OptionIdsEnum,
  ProvidersEnum,
  RoadmapStepPricingTypesEnum,
} from "../../utils/constants/enum.constants.ts";
import type { Default__v } from "mongoose";

export interface IAtByObject {
  at: Date;
  by: Types.ObjectId;
}

export interface ICodeExpireCountObject {
  code: string;
  expiresAt: Date;
  count?: number;
}

export interface IProfilePictureObject {
  url: string;
  provider: ProvidersEnum;
}

export interface IIdSelectedAtObject {
  id: Types.ObjectId;
  selectedAt: Date;
}

export interface IQuizQuestionOption {
  id: OptionIdsEnum;
  text: string;
}
export type FullIQuizQuestionOption = Require_id<
  Default__v<IQuizQuestionOption>
>;
export type HIQuizQuestionOption = HydratedDocument<IQuizQuestionOption>;

export interface IRoadmapStepResource {
  id?: Types.ObjectId | undefined; // virtual
  title: string;
  url: string;
  pricingType?: RoadmapStepPricingTypesEnum;
  language: LanguagesEnum;
  pictureUrl?: string | undefined;
}

export type FullIRoadmapStepResource = Require_id<
  Default__v<IRoadmapStepResource>
>;
export type HIRoadmapStepResource = HydratedDocument<IRoadmapStepResource>;

export interface ICareerResource extends IRoadmapStepResource {
  appliesTo: CareerResourceAppliesToEnum;
  specifiedSteps?: Types.ObjectId[];
}

export type FullICareerResource = Require_id<
  Default__v<ICareerResource>
>;
export type HICareerResource = HydratedDocument<ICareerResource>;
