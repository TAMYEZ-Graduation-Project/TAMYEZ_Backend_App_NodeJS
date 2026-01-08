import type { FlattenMaps } from "mongoose";
import type { FullIQuiz } from "../../db/interfaces/quiz.interface.ts";
import type { FullIQuizAttempt } from "../../db/interfaces/quiz_questions.interface.ts";

export interface IGetQuizDetailsResponse {
  quiz: Partial<FullIQuiz>;
}

export interface IGetQuizQuestionsResponse {
  quiz: Partial<FlattenMaps<FullIQuizAttempt>>
}

