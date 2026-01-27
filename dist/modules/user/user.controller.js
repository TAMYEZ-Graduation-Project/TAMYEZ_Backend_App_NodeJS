import { Router } from "express";
import RoutePaths from "../../utils/constants/route_paths.constants.js";
import Auths from "../../middlewares/auths.middleware.js";
import UserService from "./user.service.js";
import validationMiddleware from "../../middlewares/validation.middleware.js";
import UserValidators from "./user.validation.js";
import CloudMulter from "../../utils/multer/cloud.multer.js";
import StringConstants from "../../utils/constants/strings.constants.js";
import fileValidation from "../../utils/multer/file_validation.multer.js";
import EnvFields from "../../utils/constants/env_fields.constants.js";
import { ApplicationTypeEnum } from "../../utils/constants/enum.constants.js";
import { userAuthorizationEndpoints } from "./user.authorization.js";
export const userRouter = Router();
export const adminUserRouter = Router();
const userService = new UserService();
userRouter.get(RoutePaths.userProfile, Auths.authenticationMiddleware(), userService.getProfile);
userRouter.post(RoutePaths.logout, validationMiddleware({ schema: UserValidators.logout }), Auths.authenticationMiddleware(), userService.logout);
userRouter.patch(RoutePaths.profilePicture, Auths.authenticationMiddleware(), CloudMulter.handleSingleFileUpload({
    fieldName: StringConstants.ATTACHMENT_FIELD_NAME,
    maxFileSize: Number(process.env[EnvFields.PROFILE_PICTURE_SIZE]),
    validation: fileValidation.image,
}), validationMiddleware({ schema: UserValidators.uploadProfilePicture }), userService.uploadProfilePicture);
userRouter.patch(RoutePaths.updateProfile, Auths.authenticationMiddleware(), validationMiddleware({ schema: UserValidators.updateProfile }), userService.updateProfile);
userRouter.patch(RoutePaths.changePassword, Auths.authenticationMiddleware(), validationMiddleware({ schema: UserValidators.changePassword }), userService.changePassword);
adminUserRouter.use(Auths.combined({
    accessRoles: userAuthorizationEndpoints.getUsers,
    applicationType: ApplicationTypeEnum.adminDashboard,
}));
