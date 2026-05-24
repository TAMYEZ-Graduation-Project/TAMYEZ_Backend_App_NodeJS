import type { Default__v, HydratedDocument, Require_id, Types } from "mongoose";
import type {
  OptionIdsEnum,
  QuestionTypesEnum,
  QuizTypesEnum,
} from "../../utils/constants/enum.constants.ts";
import type { IQuizQuestionOption } from "./common.interface.ts";

export interface IQuestion {
  id?: Types.ObjectId;
  text: string;
  type: QuestionTypesEnum;
  options?: IQuizQuestionOption[] | undefined;
  correctAnswer?: OptionIdsEnum[] | undefined;
  explanation?: string | undefined;
}

export type FullIQuestion = Require_id<Default__v<IQuestion>>;

export type HIQuestion = HydratedDocument<IQuestion>;

export interface IQuizAttempt {
  id?: Types.ObjectId | undefined;

  quizId: Types.ObjectId;

  userId: Types.ObjectId;

  careerId?: Types.ObjectId;

  roadmapStepId?: Types.ObjectId;

  attemptType: QuizTypesEnum;

  questions: IQuestion[];

  expiresAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export type FullIQuizAttempt = Require_id<Default__v<IQuizAttempt>>;

export type HIQuizAttempt = HydratedDocument<IQuizAttempt>;
