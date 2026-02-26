import type { Default__v, HydratedDocument, Require_id, Types } from "mongoose";

export interface IUserCareerProgress {
  id?: Types.ObjectId | undefined;

  userId: Types.ObjectId;
  careerId: Types.ObjectId;

  completedSteps: Types.ObjectId[];
  inProgressStep: Types.ObjectId | undefined;
  nextStep: Types.ObjectId;
  frontierStep: Types.ObjectId | undefined;

  percentageCompleted: number;

  orderEpoch: number;


  createdAt: Date;
  updatedAt: Date;
}

export type FullIUserCareerProgress = Require_id<
  Default__v<IUserCareerProgress>
>;

export type HIUserCareerProgress = HydratedDocument<IUserCareerProgress>;
