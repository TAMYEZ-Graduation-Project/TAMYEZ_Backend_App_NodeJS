import type { FlattenMaps } from "mongoose";
import type { FullIQuiz } from "../../db/interfaces/quiz.interface.ts";
import type { FullIQuizAttempt } from "../../db/interfaces/quiz_attempt.interface.ts";
import type { Types } from "mongoose";

export interface IGetQuizDetailsResponse {
  quiz: Partial<FullIQuiz>;
}

export interface IGetQuizQuestionsResponse {
  quizAttempt: Partial<FlattenMaps<FullIQuizAttempt>>
}

export interface ICheckQuizAnswersResponse {
  savedQuizId?: Types.ObjectId | undefined;
  totalQuestions: number;
  mcqTotal: number;
  writtenTotal: number;
  wrongAnswersCount: number;
  correctAnswersCount: number;
  mcqScore: number;
  writtenScore: number;
  finalScore: number;
}
