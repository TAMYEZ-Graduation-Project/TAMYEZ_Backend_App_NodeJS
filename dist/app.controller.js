import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import morgan from "morgan";
import connnectToDB from "./db/db.connection.js";
import modulesRouter from "./modules/modules.routes.js";
import { ProjectMoodsEnum } from "./utils/constants/enum.constants.js";
import StringConstants from "./utils/constants/strings.constants.js";
import globalErrorHandler from "./utils/handlers/global_error.handler.js";
import RoutePaths from "./utils/constants/route_paths.constants.js";
import UserModel from "./db/models/user.model.js";
import protocolAndHostHanlder from "./utils/handlers/protocol_host.handler.js";
async function bootstrap() {
    const app = express();
    app.use(cors());
    app.use(helmet());
    app.use(morgan(process.env.MOOD === ProjectMoodsEnum.dev ? "dev" : "combined"));
    app.use(rateLimit({
        limit: 200,
        windowMs: 15 * 60 * 60 * 1000,
    }));
    if (!(await connnectToDB())) {
        app.use(RoutePaths.ALL_PATH, (req, res) => {
            res.status(500).json({
                error: { message: StringConstants.GENERIC_ERROR_MESSAGE },
            });
        });
    }
    else {
        await UserModel.syncIndexes();
        app.use(protocolAndHostHanlder);
        app.use(express.json());
        app.use([RoutePaths.SLASH_PATH, RoutePaths.API_V1_PATH], modulesRouter);
        app.use(RoutePaths.ALL_PATH, (req, res) => {
            res.status(404).json({
                error: { message: StringConstants.WRONG_ROUTE_MESSAGE(req) },
            });
        });
        app.use(globalErrorHandler);
    }
    app.listen(process.env.PORT, (error) => {
        if (error) {
            console.log(StringConstants.ERROR_STARTING_SERVER_MESSAGE(error));
        }
        console.log(StringConstants.SERVER_STARTED_MESSAGE(process.env.PORT));
    });
}
export default bootstrap;
