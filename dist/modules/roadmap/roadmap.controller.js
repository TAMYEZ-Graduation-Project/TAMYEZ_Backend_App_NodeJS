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
import { ErrorCodesEnum, StorageTypesEnum, } from "../../utils/constants/enum.constants.js";
const roadmapRouter = Router();
const roadmapService = new RoadmapService();
roadmapRouter.post(RoutePaths.createRoadmapStep, Auths.combined({
    accessRoles: roadmapAuthorizationEndpoints.createRoadmapStep,
}), validationMiddleware({ schema: RoadmapValidators.createRoadmapStep }), roadmapService.createRoadmapStep);
roadmapRouter.get(RoutePaths.getRoadmap, validationMiddleware({ schema: RoadmapValidators.getRoadmap }), roadmapService.getRoadmap());
roadmapRouter.get(RoutePaths.getArchivedRoadmap, Auths.combined({
    accessRoles: roadmapAuthorizationEndpoints.createRoadmapStep,
}), validationMiddleware({ schema: RoadmapValidators.getRoadmap }), roadmapService.getRoadmap({ archived: true }));
roadmapRouter.get(RoutePaths.getArchivedRoadmapStep, Auths.combined({
    accessRoles: roadmapAuthorizationEndpoints.createRoadmapStep,
}), validationMiddleware({ schema: RoadmapValidators.getRoadmapStep }), roadmapService.getRoadmapStep({ archived: true }));
roadmapRouter.get(RoutePaths.getRoadmapStep, Auths.authenticationMiddleware(), validationMiddleware({ schema: RoadmapValidators.getRoadmapStep }), roadmapService.getRoadmapStep());
roadmapRouter.patch(RoutePaths.updateRoadmapStep, rateLimit({
    limit: 10,
    windowMs: 10 * 60 * 1000,
    message: {
        code: ErrorCodesEnum.TOO_MANY_RQUESTS,
        message: "Too many update roadmap step requests, please try after a while.",
    },
}), Auths.combined({
    accessRoles: roadmapAuthorizationEndpoints.createRoadmapStep,
}), validationMiddleware({ schema: RoadmapValidators.updateRoadmapStep }), roadmapService.updateRoadmapStep);
roadmapRouter.patch(RoutePaths.updateRoadmapStepResource, rateLimit({
    limit: 10,
    windowMs: 10 * 60 * 1000,
    message: "Too many update career requests, please try after a while.",
}), Auths.combined({
    accessRoles: roadmapAuthorizationEndpoints.createRoadmapStep,
}), CloudMulter.handleSingleFileUpload({
    fieldName: StringConstants.ATTACHMENT_FIELD_NAME,
    validation: fileValidation.image,
    storageApproach: StorageTypesEnum.memory,
}), validationMiddleware({ schema: RoadmapValidators.updateRoadmapStepResource }), roadmapService.updateRoadmapStepResource);
export default roadmapRouter;
