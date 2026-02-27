import express from "express";
import type { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import morgan from "morgan";
import connnectToDB from "./db/db.connection.ts";
import modulesRouter from "./modules/modules.routes.ts";
import { ProjectMoodsEnum } from "./utils/constants/enum.constants.ts";
import StringConstants from "./utils/constants/strings.constants.ts";
import globalErrorHandler from "./utils/handlers/global_error.handler.ts";
import RoutePaths from "./utils/constants/route_paths.constants.ts";
import protocolAndHostHanlder from "./utils/handlers/protocol_host.handler.ts";
import uploadsRouter from "./uploads/uploads.routes.ts";
import startAllCronJobs from "./utils/cron_jobs/cron_jobs.controller.ts";
import mongoose from "mongoose";

async function bootstrap() {
  const app: Express = express();

  // Security Options
  app.use(cors());
  app.use(helmet());
  app.use(
    morgan(process.env.MOOD === ProjectMoodsEnum.dev ? "dev" : "combined"),
  );
  app.use(
    rateLimit({
      limit: 300,
      windowMs: 15 * 60 * 1000,
    }),
  );
  // trust the first proxy (NGINX)
  if (process.env.MOOD === ProjectMoodsEnum.prod) app.set("trust proxy", 1);
  if (!(await connnectToDB())) {
    app.use(RoutePaths.ALL_PATH, (req: Request, res: Response) => {
      res.status(500).json({
        error: { message: StringConstants.GENERIC_ERROR_MESSAGE },
      });
    });
  } else {
    // Routes
    if (process.env.MOOD === ProjectMoodsEnum.dev) {
      await mongoose.syncIndexes();
    }

    app.use(protocolAndHostHanlder);
    app.use(express.json());
    app.use(RoutePaths.uploads, uploadsRouter);
    app.use([RoutePaths.SLASH_PATH, RoutePaths.API_V1_PATH], modulesRouter);
    app.use(RoutePaths.ALL_PATH, (req: Request, res: Response) => {
      res.status(404).json({
        error: { message: StringConstants.WRONG_ROUTE_MESSAGE(req) },
      });
    });
    app.use(globalErrorHandler);
  }

  // Initialize Cron Jobs
  startAllCronJobs();

  // Start the server
  app.listen(process.env.PORT, (error) => {
    if (error) {
      console.log(StringConstants.ERROR_STARTING_SERVER_MESSAGE(error));
    }
    console.log(StringConstants.SERVER_STARTED_MESSAGE(process.env.PORT!));
  });
}

export default bootstrap;
