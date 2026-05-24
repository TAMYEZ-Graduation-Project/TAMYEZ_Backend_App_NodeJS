import http from "node:http";
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
import routeTimeoutMiddleware from "./middlewares/route_timeout_middleware.ts";

async function bootstrap() {
  const app: Express = express();
  const server = http.createServer(app);

  // global timeouts
  server.requestTimeout = 25000; // full request (headers+body) must arrive
  server.headersTimeout = 10000; // headers must arrive within 10s
  server.keepAliveTimeout = 15000; // idle keep-alive sockets closed after 15s

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
    app.use(routeTimeoutMiddleware(15000));
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
  server.listen(process.env.PORT, () => {
    console.log(StringConstants.SERVER_STARTED_MESSAGE(process.env.PORT!));
  });
  server.on("error", (error) => {
    if (error) {
      console.log(StringConstants.ERROR_STARTING_SERVER_MESSAGE(error));
    }
  });
}

export default bootstrap;
