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

async function bootstrap() {
  const app: Express = express();

  // Security Options
  app.use(cors());
  app.use(helmet());
  app.use(
    morgan(process.env.MOOD === ProjectMoodsEnum.dev ? "dev" : "combined")
  );
  app.use(
    rateLimit({
      limit: 200,
      windowMs: 15 * 60 * 60 * 1000,
    })
  );

  if (!(await connnectToDB())) {
    app.use(RoutePaths.ALL_PATH, (req: Request, res: Response) => {
      res.status(500).json({
        error: { message: StringConstants.GENERIC_ERROR_MESSAGE },
      });
    });
  } else {
    // Routes
    // emailEvent.publish({
    //   eventName: EventsEnum.emailVerification,
    //   payload: {
    //     otpOrLink: "12243324",
    //     to: "klilmohammed9@gmail.com",
    //     subject: StringConstants.EMAIL_VERIFICATION_SUBJECT,
    //   },
    // });
    app.use(express.json());
    app.use([RoutePaths.SLASH_PATH, RoutePaths.API_V1_PATH], modulesRouter);
    app.use(RoutePaths.ALL_PATH, (req: Request, res: Response) => {
      res.status(404).json({
        error: { message: StringConstants.WRONG_ROUTE_MESSAGE(req) },
      });
    });
    app.use(globalErrorHandler);
  }

  // Start the server
  app.listen(process.env.PORT, (error) => {
    if (error) {
      console.log(StringConstants.ERROR_STARTING_SERVER_MESSAGE(error));
    }
    console.log(StringConstants.SERVER_STARTED_MESSAGE(process.env.PORT!));
  });
}

export default bootstrap;
