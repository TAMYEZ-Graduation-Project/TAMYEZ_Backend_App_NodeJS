import { Router } from "express";
import validationMiddleware from "../../middlewares/validation.middleware.ts";
import Auths from "../../middlewares/auths.middleware.ts";
import careerAuthorizationEndpoints from "./career.authorization.ts";
import CareerService from "./career.service.ts";
import CareerValidators from "./career.validation.ts";
import RoutePaths from "../../utils/constants/route_paths.constants.ts";
import CloudMulter from "../../utils/multer/cloud.multer.ts";
import EnvFields from "../../utils/constants/env_fields.constants.ts";
import fileValidation from "../../utils/multer/file_validation.multer.ts";
import {
  ApplicationTypeEnum,
  StorageTypesEnum,
} from "../../utils/constants/enum.constants.js";
import StringConstants from "../../utils/constants/strings.constants.ts";
import { rateLimit } from "express-rate-limit";
import { expressRateLimitError } from "../../utils/constants/error.constants.ts";

export const careerRouter = Router();
export const adminCareerRouter = Router();

const careerService = new CareerService();

// normal user apis

careerRouter.get(
  RoutePaths.getCareers,
  validationMiddleware({ schema: CareerValidators.getCareers }),
  careerService.getCareers(),
);

careerRouter.get(
  RoutePaths.getCareer,
  Auths.authenticationMiddleware({ isOptional: true }),
  validationMiddleware({ schema: CareerValidators.getCareer }),
  careerService.getCareer(),
);

careerRouter.post(
  RoutePaths.checkCareerAssessment,
  Auths.authenticationWithGateway({
    applicationType: ApplicationTypeEnum.user,
  }),
  validationMiddleware({ schema: CareerValidators.checkCareerAssessment }),
  careerService.checkCareerAssessment,
);

careerRouter.get(
  RoutePaths.chooseSuggestedCareer,
  Auths.authenticationWithGateway({
    applicationType: ApplicationTypeEnum.user,
  }),
  validationMiddleware({ schema: CareerValidators.chooseSuggestedCareer }),
  careerService.chooseSuggestedCareer,
);

// admin apis
adminCareerRouter.use(
  Auths.combinedWithGateway({
    accessRoles: careerAuthorizationEndpoints.createCareer,
    applicationType: ApplicationTypeEnum.adminDashboard,
  }),
);
adminCareerRouter.post(
  RoutePaths.createCareer,
  validationMiddleware({ schema: CareerValidators.createCareer }),
  careerService.createCareer,
);

adminCareerRouter.get(
  RoutePaths.getArchivedCareers,
  validationMiddleware({ schema: CareerValidators.getCareers }),
  careerService.getCareers({ archived: true }),
);

adminCareerRouter.get(
  RoutePaths.getArchivedCareer,
  validationMiddleware({ schema: CareerValidators.getCareer }),
  careerService.getCareer({ archived: true }),
);

adminCareerRouter.patch(
  RoutePaths.uploadCareerPicture,
  CloudMulter.handleSingleFileUpload({
    fieldName: StringConstants.ATTACHMENT_FIELD_NAME,
    maxFileSize: Number(process.env[EnvFields.CAREER_PICTURE_SIZE]),
    validation: fileValidation.image,
    storageApproach: StorageTypesEnum.memory,
  }),
  validationMiddleware({ schema: CareerValidators.uploadCareerPicture }),
  careerService.uploadCareerPicture,
);

adminCareerRouter.patch(
  RoutePaths.archiveCareer,
  validationMiddleware({ schema: CareerValidators.archiveCareer }),
  careerService.archiveCareer,
);

adminCareerRouter.patch(
  RoutePaths.restoreCareer,
  validationMiddleware({ schema: CareerValidators.restoreCareer }),
  careerService.restoreCareer,
);

adminCareerRouter.patch(
  RoutePaths.updateCareer,
  rateLimit({
    limit: 10,
    windowMs: 10 * 60 * 1000,
    message: expressRateLimitError,
  }),
  validationMiddleware({ schema: CareerValidators.updateCareer }),
  careerService.updateCareer,
);

adminCareerRouter.patch(
  RoutePaths.updateCareerResource,
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
  validationMiddleware({ schema: CareerValidators.updateCareerResource }),
  careerService.updateCareerResource,
);

adminCareerRouter.delete(
  RoutePaths.deleteCareer,
  validationMiddleware({ schema: CareerValidators.deleteCareer }),
  careerService.deleteCareer,
);
