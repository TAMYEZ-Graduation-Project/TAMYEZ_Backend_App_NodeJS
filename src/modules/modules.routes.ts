import { Router } from "express";
import authRouter from "./auth/auth.controller.ts";
import RoutePaths from "../utils/constants/route_paths.constants.ts";

const modulesRouter: Router = Router();

modulesRouter.get("/", (req, res) => {
  res.status(200).json({
    message: `Welcome to Our Graduation Project ${process.env.APP_NAME} ❤️ 🎓`,
  });
});

modulesRouter.use(RoutePaths.auth, authRouter);

export default modulesRouter;
