import type { Default__v, HydratedDocument, Require_id, Types } from "mongoose";

export interface IQuizCooldown {
  id?: Types.ObjectId;
  userId: Types.ObjectId;
  quizId: Types.ObjectId;

  cooldownEndsAt: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export type FullIQuizCooldown = Require_id<Default__v<IQuizCooldown>>;

export type HIQuizCooldown = HydratedDocument<IQuizCooldown>;