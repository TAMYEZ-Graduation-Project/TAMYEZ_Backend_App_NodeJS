import type { Default__v, HydratedDocument, Require_id, Types } from "mongoose";
import type {
  OptionIdsEnum,
  QuestionTypesEnum,
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

export interface IQuizQuestions {
  id?: Types.ObjectId | undefined;

  quizId: Types.ObjectId;

  userId: Types.ObjectId;

  questions: IQuestion[];

  expiresAt: Date;

  createdAt: Date;
  updatedAt: Date;
}
export type QuizQuestionsAnswersMapValueType = {
  text?: string | undefined;
  type: QuestionTypesEnum;
};

export type FullIQuizQuestions = Require_id<Default__v<IQuizQuestions>>;

export type HIQuizQuestions = HydratedDocument<IQuizQuestions>;
