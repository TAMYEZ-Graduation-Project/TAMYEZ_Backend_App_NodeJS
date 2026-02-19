import { z } from "zod";
import type QuizValidators from "./quiz.validation.ts";

export type CreateQuizBodyDtoType = z.infer<
  typeof QuizValidators.createQuiz.body
>;

export type UpdateQuizParamsDtoType = z.infer<
  typeof QuizValidators.updateQuiz.params
>;

export type UpdateQuizBodyDtoType = z.infer<
  typeof QuizValidators.updateQuiz.body
>;

export type GetQuizParamsDtoType = z.infer<
  typeof QuizValidators.getQuiz.params
>;

export type GetQuizQuestionsParamsDtoType = z.infer<
  typeof QuizValidators.getQuizQuestions.params
>;

export type GetQuizzesQueryDtoType = z.infer<
  typeof QuizValidators.getQuizzes.query
>;

export type CheckQuizAnswersParamsDtoType = z.infer<
  typeof QuizValidators.checkQuizAnswers.params
>;

export type CheckQuizAnswersBodyDtoType = z.infer<
  typeof QuizValidators.checkQuizAnswers.body
>;

export type GetSavedQuizzesQueryDtoType = z.infer<
  typeof QuizValidators.getSavedQuizzes.query
>;
export type GetSavedQuizParamsDtoType = z.infer<
  typeof QuizValidators.getSavedQuiz.params
>;

export type ArchiveQuizParamsDtoType = z.infer<
  typeof QuizValidators.archiveQuiz.params
>;

export type ArchiveQuizBodyDtoType = z.infer<
  typeof QuizValidators.archiveQuiz.body
>;

export type RestoreQuizParamsDtoType = z.infer<
  typeof QuizValidators.restoreQuiz.params
>;

export type RestoreQuizBodyDtoType = z.infer<
  typeof QuizValidators.restoreQuiz.body
>;

export type DeleteQuizParamsDtoType = z.infer<
  typeof QuizValidators.deleteQuiz.params
>;

export type DeleteQuizBodyDtoType = z.infer<
  typeof QuizValidators.deleteQuiz.body
>;
