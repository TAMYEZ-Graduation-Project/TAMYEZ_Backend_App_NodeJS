import type { Default__v, HydratedDocument, Require_id, Types } from "mongoose";

export interface IReply {
  text: string;
  createdBy: Types.ObjectId;
}

export interface IFeedback {
  id?: Types.ObjectId | undefined;

  text: string;
  stars: number;
  createdBy: Types.ObjectId;
  reply: IReply;

  createdAt: Date;
  updatedAt: Date;
}

export type FullIFeedback = Require_id<Default__v<IFeedback>>;

export type HIFeedback = HydratedDocument<IFeedback>;
