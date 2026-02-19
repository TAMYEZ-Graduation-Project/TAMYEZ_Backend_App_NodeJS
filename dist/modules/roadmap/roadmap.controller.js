import { Router } from "express";
import RoadmapService from "./roadmap.service.js";
import RoutePaths from "../../utils/constants/route_paths.constants.js";
import Auths from "../../middlewares/auths.middleware.js";
import roadmapAuthorizationEndpoints from "./roadmap.authorization.js";
import validationMiddleware from "../../middlewares/validation.middleware.js";
import RoadmapValidators from "./roadmap.validation.js";
import { rateLimit } from "express-rate-limit";
import CloudMulter from "../../utils/multer/cloud.multer.js";
import StringConstants from "../../utils/constants/strings.constants.js";
import fileValidation from "../../utils/multer/file_validation.multer.js";
import { ApplicationTypeEnum, StorageTypesEnum, } from "../../utils/constants/enum.constants.js";
import { expressRateLimitError } from "../../utils/constants/error.constants.js";
export const roadmapRouter = Router();
export const adminRoadmapRouter = Router();
const roadmapService = new RoadmapService();
roadmapRouter.get(RoutePaths.getRoadmap, Auths.authenticationMiddleware({ isOptional: true }), validationMiddleware({ schema: RoadmapValidators.getRoadmap }), roadmapService.getRoadmap());
roadmapRouter.get(RoutePaths.getRoadmapStep, Auths.authenticationMiddleware(), validationMiddleware({ schema: RoadmapValidators.getRoadmapStep }), roadmapService.getRoadmapStep());
adminRoadmapRouter.use(Auths.combinedWithGateway({
    accessRoles: roadmapAuthorizationEndpoints.createRoadmapStep,
    applicationType: ApplicationTypeEnum.adminDashboard,
}));
adminRoadmapRouter.post(RoutePaths.createRoadmapStep, validationMiddleware({ schema: RoadmapValidators.createRoadmapStep }), roadmapService.createRoadmapStep);
adminRoadmapRouter.get(RoutePaths.getArchivedRoadmap, validationMiddleware({ schema: RoadmapValidators.getRoadmap }), roadmapService.getRoadmap({ archived: true }));
adminRoadmapRouter.get(RoutePaths.getArchivedRoadmapStep, validationMiddleware({ schema: RoadmapValidators.getRoadmapStep }), roadmapService.getRoadmapStep({ archived: true }));
adminRoadmapRouter.patch(RoutePaths.archiveRoadmapStep, validationMiddleware({ schema: RoadmapValidators.archiveRoadmapStep }), roadmapService.archiveRoadmapStep);
adminRoadmapRouter.patch(RoutePaths.restoreRoadmapStep, validationMiddleware({ schema: RoadmapValidators.restoreRoadmapStep }), roadmapService.restoreRoadmapStep);
adminRoadmapRouter.patch(RoutePaths.updateRoadmapStep, rateLimit({
    limit: 10,
    windowMs: 10 * 60 * 1000,
    message: expressRateLimitError,
}), validationMiddleware({ schema: RoadmapValidators.updateRoadmapStep }), roadmapService.updateRoadmapStep);
adminRoadmapRouter.patch(RoutePaths.updateRoadmapStepResource, rateLimit({
    limit: 10,
    windowMs: 10 * 60 * 1000,
    message: expressRateLimitError,
}), CloudMulter.handleSingleFileUpload({
    fieldName: StringConstants.ATTACHMENT_FIELD_NAME,
    validation: fileValidation.image,
    storageApproach: StorageTypesEnum.memory,
}), validationMiddleware({ schema: RoadmapValidators.updateRoadmapStepResource }), roadmapService.updateRoadmapStepResource);
adminRoadmapRouter.delete(RoutePaths.deleteRoadmapStep, validationMiddleware({ schema: RoadmapValidators.deleteRoadmapStep }), roadmapService.deleteRoadmapStep);
