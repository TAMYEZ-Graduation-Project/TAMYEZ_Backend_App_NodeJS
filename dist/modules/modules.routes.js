import { Router } from "express";
import { authRouter } from "./auth/index.js";
import RoutePaths from "../utils/constants/route_paths.constants.js";
import { userRouter } from "./user/index.js";
import { quizRouter } from "./quiz/index.js";
import { firebaseRouter } from "./firebase/index.js";
const modulesRouter = Router();
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
