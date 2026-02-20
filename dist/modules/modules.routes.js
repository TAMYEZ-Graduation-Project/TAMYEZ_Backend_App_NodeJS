import { Router } from "express";
import { authRouter, adminAuthRouter } from "./auth/index.js";
import RoutePaths from "../utils/constants/route_paths.constants.js";
import { adminUserRouter, userRouter } from "./user/index.js";
import { adminQuizRouter, quizRouter } from "./quiz/index.js";
import { adminFirebaseRouter, firebaseRouter } from "./firebase/index.js";
import { adminCareerRouter, careerRouter } from "./career/index.js";
import { adminRoadmapRouter, roadmapRouter } from "./roadmap/index.js";
const modulesRouter = Router();
modulesRouter.get("/", (req, res) => {
    res.status(200).json({
        message: `Welcome to Our Graduation Project ${process.env.APP_NAME} ❤️ 🎓`,
    });
});
modulesRouter.use(RoutePaths.auth, authRouter);
modulesRouter.use(RoutePaths.user, userRouter);
modulesRouter.use(RoutePaths.career, careerRouter);
modulesRouter.use(RoutePaths.roadmap, roadmapRouter);
modulesRouter.use(RoutePaths.quiz, quizRouter);
modulesRouter.use(RoutePaths.firebase, firebaseRouter);
modulesRouter.use(RoutePaths.adminAuth, adminAuthRouter);
modulesRouter.use(RoutePaths.adminUser, adminUserRouter);
modulesRouter.use(RoutePaths.adminCareer, adminCareerRouter);
modulesRouter.use(RoutePaths.adminRoadmap, adminRoadmapRouter);
modulesRouter.use(RoutePaths.adminQuiz, adminQuizRouter);
modulesRouter.use(RoutePaths.adminFirebase, adminFirebaseRouter);
export default modulesRouter;
