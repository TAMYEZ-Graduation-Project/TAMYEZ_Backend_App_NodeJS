import { Router } from "express";
import validationMiddleware from "../../middlewares/validation.middleware.js";
import Auths from "../../middlewares/auths.middleware.js";
import careerAuthorizationEndpoints from "./career.authorization.js";
import CareerService from "./career.service.js";
import CareerValidators from "./career.validation.js";
import RoutePaths from "../../utils/constants/route_paths.constants.js";
import CloudMulter from "../../utils/multer/cloud.multer.js";
import EnvFields from "../../utils/constants/env_fields.constants.js";
import fileValidation from "../../utils/multer/file_validation.multer.js";
import { StorageTypesEnum } from "../../utils/constants/enum.constants.js";
import StringConstants from "../../utils/constants/strings.constants.js";
import { rateLimit } from "express-rate-limit";
const careerRouter = Router();
const careerService = new CareerService();
careerRouter.post(RoutePaths.createCareer, Auths.combined({ accessRoles: careerAuthorizationEndpoints.createCareer }), validationMiddleware({ schema: CareerValidators.createCareer }), careerService.createCareer);
careerRouter.get(RoutePaths.getCareers, validationMiddleware({ schema: CareerValidators.getCareers }), careerService.getCareers());
careerRouter.get(RoutePaths.getArchivedCareers, Auths.combined({ accessRoles: careerAuthorizationEndpoints.createCareer }), validationMiddleware({ schema: CareerValidators.getCareers }), careerService.getCareers({ archived: true }));
careerRouter.patch(RoutePaths.uploadCareerPicture, Auths.combined({ accessRoles: careerAuthorizationEndpoints.createCareer }), CloudMulter.handleSingleFileUpload({
    fieldName: StringConstants.ATTACHMENT_FIELD_NAME,
    maxFileSize: Number(process.env[EnvFields.CAREER_PICTURE_SIZE]),
    validation: fileValidation.image,
    storageApproach: StorageTypesEnum.memory,
}), validationMiddleware({ schema: CareerValidators.uploadCareerPicture }), careerService.uploadCareerPicture);
careerRouter.patch(RoutePaths.updateCareer, rateLimit({
    limit: 10,
    windowMs: 10 * 60 * 1000,
    message: "Too many update career requests, please try after a while.",
}), Auths.combined({ accessRoles: careerAuthorizationEndpoints.createCareer }), validationMiddleware({ schema: CareerValidators.updateCareer }), careerService.updateCareer);
careerRouter.patch(RoutePaths.updateCareerResource, rateLimit({
    limit: 10,
    windowMs: 10 * 60 * 1000,
    message: "Too many update career requests, please try after a while.",
}), Auths.combined({ accessRoles: careerAuthorizationEndpoints.createCareer }), CloudMulter.handleSingleFileUpload({
    fieldName: StringConstants.ATTACHMENT_FIELD_NAME,
    validation: fileValidation.image,
    storageApproach: StorageTypesEnum.memory,
}), validationMiddleware({ schema: CareerValidators.updateCareerResource }), careerService.updateCareerResource);
export default careerRouter;
