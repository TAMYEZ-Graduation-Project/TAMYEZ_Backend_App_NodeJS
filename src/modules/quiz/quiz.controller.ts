import { Router } from "express";
import QuizService from "./quiz.service.ts";
import RoutePaths from "../../utils/constants/route_paths.constants.ts";
import Auths from "../../middlewares/auths.middleware.ts";
import quizAuthorizationEndpoints from "./quiz.auhorization.ts";
import validationMiddleware from "../../middlewares/validation.middleware.ts";
import QuizValidators from "./quiz.validation.ts";
import { ApplicationTypeEnum } from "../../utils/constants/enum.constants.ts";

export const quizRouter = Router();
export const adminQuizRouter = Router();

const quizService = new QuizService();

// normal user apis

quizRouter.get(
  RoutePaths.getSavedQuizzes,
  Auths.authenticationMiddleware(),
  validationMiddleware({ schema: QuizValidators.getSavedQuizzes }),
  quizService.getSavedQuizzes,
);

quizRouter.get(
  RoutePaths.getSavedQuiz,
  Auths.authenticationMiddleware(),
  validationMiddleware({ schema: QuizValidators.getSavedQuiz }),
  quizService.getSavedQuiz,
);

quizRouter.get(
  RoutePaths.getQuizQuestions,
  Auths.authenticationMiddleware(),
  validationMiddleware({ schema: QuizValidators.getQuiz }),
  quizService.getQuizQuestions,
);

quizRouter.get(
  RoutePaths.getQuiz,
  Auths.authenticationMiddleware(),
  validationMiddleware({ schema: QuizValidators.getQuiz }),
  quizService.getQuiz(),
);

quizRouter.post(
  RoutePaths.checkQuizAnswers,
  Auths.authenticationMiddleware(),
  validationMiddleware({ schema: QuizValidators.checkQuizAnswers }),
  quizService.checkQuizAnswers,
);

// admin apis
adminQuizRouter.use(
  Auths.combined({
    accessRoles: quizAuthorizationEndpoints.createQuiz,
    applicationType: ApplicationTypeEnum.adminDashboard,
  }),
);
adminQuizRouter.post(
  RoutePaths.createQuiz,
  validationMiddleware({ schema: QuizValidators.createQuiz }),
  quizService.createQuiz,
);

adminQuizRouter.get(
  RoutePaths.getQuizzes,
  validationMiddleware({ schema: QuizValidators.getQuizzes }),
  quizService.getQuizzes(),
);

adminQuizRouter.get(
  RoutePaths.getArchivedQuizzes,
  validationMiddleware({ schema: QuizValidators.getQuizzes }),
  quizService.getQuizzes({ archived: true }),
);

adminQuizRouter.get(
  RoutePaths.getArchivedQuiz,
  validationMiddleware({ schema: QuizValidators.getQuiz }),
  quizService.getQuiz({ archived: true }),
);

adminQuizRouter.patch(
  RoutePaths.archiveQuiz,
  validationMiddleware({ schema: QuizValidators.archiveQuiz }),
  quizService.archiveQuiz,
);

adminQuizRouter.patch(
  RoutePaths.restoreQuiz,
  validationMiddleware({ schema: QuizValidators.restoreQuiz }),
  quizService.restoreQuiz,
);

adminQuizRouter.patch(
  RoutePaths.updateQuiz,
  validationMiddleware({ schema: QuizValidators.updateQuiz }),
  quizService.updateQuiz,
);

adminQuizRouter.delete(
  RoutePaths.deleteQuiz,
  validationMiddleware({ schema: QuizValidators.deleteQuiz }),
  quizService.deleteQuiz,
);
