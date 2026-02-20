import type { Default__v, HydratedDocument, Require_id, Types } from "mongoose";
import type {
  OptionIdsEnum,
  QuestionTypesEnum,
} from "../../utils/constants/enum.constants.ts";
import type { IQuizQuestionOption } from "./common.interface.ts";

export interface ISavedQuestion {
  id?: Types.ObjectId;
  text: string;
  type: QuestionTypesEnum;
  options?: IQuizQuestionOption[] | undefined;
  isCorrect: boolean;
  userAnswer?: OptionIdsEnum[] | string;
  correction?: OptionIdsEnum[] | string | undefined;
  explanation?: string | undefined;
}
export type FullISavedQuestion = Require_id<Default__v<ISavedQuestion>>;
export type HISavedQuestion = HydratedDocument<ISavedQuestion>;

export interface ISavedQuiz {
  id?: Types.ObjectId | undefined;

  quizId: Types.ObjectId;
  userId: Types.ObjectId;
  careerId: Types.ObjectId;
  roadmapStepId: Types.ObjectId;

  questions: ISavedQuestion[];

  score: string;

  takenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type FullISavedQuiz = Require_id<Default__v<ISavedQuiz>>;

export type HISavedQuiz = HydratedDocument<ISavedQuiz>;
