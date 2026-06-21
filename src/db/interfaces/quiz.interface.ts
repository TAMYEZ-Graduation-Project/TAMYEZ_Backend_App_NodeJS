import type { Default__v, HydratedDocument, Require_id, Types } from "mongoose";
import type { QuizTypesEnum } from "../../utils/constants/enum.constants.ts";
import type { IAtByObject } from "./common.interface.ts";

export interface IQuiz {
  id?: Types.ObjectId | undefined;

  uniqueKey: string;

  title: string;
  description: string;

  questionsNumber: number;

  type: QuizTypesEnum;
  duration?: number | undefined; // in seconds

  tags?: string[] | undefined;

  createdBy: Types.ObjectId;

  freezed: IAtByObject;
  restored: IAtByObject;

  createdAt: Date;
  updatedAt: Date;
}

export type FullIQuiz = Require_id<Default__v<IQuiz>>;

export type HIQuiz = HydratedDocument<IQuiz>;
