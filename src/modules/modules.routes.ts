import { Router } from "express";
import { authRouter } from "./auth/index.ts";
import RoutePaths from "../utils/constants/route_paths.constants.ts";
import { userRouter } from "./user/index.ts";
import { quizRouter } from "./quiz/index.ts";
import { firebaseRouter } from "./firebase/index.ts";

const modulesRouter: Router = Router();

modulesRouter.get("/", (req, res) => {
  res.status(200).json({
    message: `Welcome to Our Graduation Project ${process.env.APP_NAME} ❤️ 🎓`,
  });
});

modulesRouter.use(RoutePaths.auth, authRouter);
modulesRouter.use(RoutePaths.user, userRouter);
modulesRouter.use(RoutePaths.quiz, quizRouter);
modulesRouter.use(RoutePaths.firebase, firebaseRouter);

export default modulesRouter;
