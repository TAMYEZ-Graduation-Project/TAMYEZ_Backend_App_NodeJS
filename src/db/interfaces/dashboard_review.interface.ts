import type { Default__v, HydratedDocument, Require_id } from "mongoose";
import type { DashboardReviewTypes } from "../../utils/constants/enum.constants.ts";

export interface IDashboardReview {
  reviewType: DashboardReviewTypes;
  activeCount: bigint;

  createdAt?: Date;
  updateAt?: Date;
}

export type FullIDashboardReview = Require_id<Default__v<IDashboardReview>>;
export type HIDashboardReview = HydratedDocument<IDashboardReview>;
