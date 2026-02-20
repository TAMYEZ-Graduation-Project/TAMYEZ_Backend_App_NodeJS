import { Router } from "express";
import RoadmapService from "./roadmap.service.ts";
import RoutePaths from "../../utils/constants/route_paths.constants.ts";
import Auths from "../../middlewares/auths.middleware.ts";
import roadmapAuthorizationEndpoints from "./roadmap.authorization.ts";
import validationMiddleware from "../../middlewares/validation.middleware.ts";
import RoadmapValidators from "./roadmap.validation.ts";
import { rateLimit } from "express-rate-limit";
import CloudMulter from "../../utils/multer/cloud.multer.ts";
import StringConstants from "../../utils/constants/strings.constants.ts";
import fileValidation from "../../utils/multer/file_validation.multer.ts";
import {
  ApplicationTypeEnum,
  StorageTypesEnum,
} from "../../utils/constants/enum.constants.ts";
import { expressRateLimitError } from "../../utils/constants/error.constants.ts";

export const roadmapRouter: Router = Router();
export const adminRoadmapRouter = Router();

const roadmapService = new RoadmapService();

// normal user apis

roadmapRouter.get(
  RoutePaths.getRoadmap,
  Auths.authenticationMiddleware({ isOptional: true }),
  validationMiddleware({ schema: RoadmapValidators.getRoadmap }),
  roadmapService.getRoadmap(),
);

roadmapRouter.get(
  RoutePaths.getRoadmapStep,
  Auths.authenticationMiddleware(),
  validationMiddleware({ schema: RoadmapValidators.getRoadmapStep }),
  roadmapService.getRoadmapStep(),
);

// admin apis
adminRoadmapRouter.use(
  Auths.combinedWithGateway({
    accessRoles: roadmapAuthorizationEndpoints.createRoadmapStep,
    applicationType: ApplicationTypeEnum.adminDashboard,
  }),
);
adminRoadmapRouter.post(
  RoutePaths.createRoadmapStep,
  validationMiddleware({ schema: RoadmapValidators.createRoadmapStep }),
  roadmapService.createRoadmapStep,
);
adminRoadmapRouter.get(
  RoutePaths.getArchivedRoadmap,
  validationMiddleware({ schema: RoadmapValidators.getRoadmap }),
  roadmapService.getRoadmap({ archived: true }),
);

adminRoadmapRouter.get(
  RoutePaths.getArchivedRoadmapStep,
  validationMiddleware({ schema: RoadmapValidators.getRoadmapStep }),
  roadmapService.getRoadmapStep({ archived: true }),
);

adminRoadmapRouter.patch(
  RoutePaths.archiveRoadmapStep,
  validationMiddleware({ schema: RoadmapValidators.archiveRoadmapStep }),
  roadmapService.archiveRoadmapStep,
);

adminRoadmapRouter.patch(
  RoutePaths.restoreRoadmapStep,
  validationMiddleware({ schema: RoadmapValidators.restoreRoadmapStep }),
  roadmapService.restoreRoadmapStep,
);

adminRoadmapRouter.patch(
  RoutePaths.updateRoadmapStep,
  rateLimit({
    limit: 10,
    windowMs: 10 * 60 * 1000,
    message: expressRateLimitError,
  }),
  validationMiddleware({ schema: RoadmapValidators.updateRoadmapStep }),
  roadmapService.updateRoadmapStep,
);

adminRoadmapRouter.patch(
  RoutePaths.updateRoadmapStepResource,
  rateLimit({
    limit: 10,
    windowMs: 10 * 60 * 1000,
    message: expressRateLimitError,
  }),
  CloudMulter.handleSingleFileUpload({
    fieldName: StringConstants.ATTACHMENT_FIELD_NAME,
    validation: fileValidation.image,
    storageApproach: StorageTypesEnum.memory,
  }),
  validationMiddleware({ schema: RoadmapValidators.updateRoadmapStepResource }),
  roadmapService.updateRoadmapStepResource,
);

adminRoadmapRouter.delete(
  RoutePaths.deleteRoadmapStep,
  validationMiddleware({ schema: RoadmapValidators.deleteRoadmapStep }),
  roadmapService.deleteRoadmapStep,
);
