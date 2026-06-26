import type { Default__v, HydratedDocument, Require_id, Types } from "mongoose";
import type { UserLevelsEnum } from "../../utils/constants/enum.constants.ts";

export interface ISuggestedCareer {
  careerId: Types.ObjectId;
  title: string;
  reason: string;
  confidence: number;
}

export interface ICareerSuggestionAttempt {
  id?: Types.ObjectId | undefined;

  userId: Types.ObjectId;

  suggestions: ISuggestedCareer[];

  userLevel: UserLevelsEnum;

  expiresAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export type FullICareerSuggestionAttempt = Require_id<
  Default__v<ICareerSuggestionAttempt>
>;

export type HICareerSuggestionAttempt =
  HydratedDocument<ICareerSuggestionAttempt>;
