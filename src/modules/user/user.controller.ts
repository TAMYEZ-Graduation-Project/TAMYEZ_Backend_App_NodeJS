import { Router } from "express";
import RoutePaths from "../../utils/constants/route_paths.constants.ts";
import Auths from "../../middlewares/auths.middleware.ts";
import UserService from "./user.service.ts";
import validationMiddleware from "../../middlewares/validation.middleware.ts";
import UserValidators from "./user.validation.ts";
import CloudMulter from "../../utils/multer/cloud.multer.ts";
import StringConstants from "../../utils/constants/strings.constants.ts";
import fileValidation from "../../utils/multer/file_validation.multer.ts";
import EnvFields from "../../utils/constants/env_fields.constants.ts";
import { ApplicationTypeEnum } from "../../utils/constants/enum.constants.ts";
import { userAuthorizationEndpoints } from "./user.authorization.ts";

export const userRouter = Router();
export const adminUserRouter = Router();

const userService = new UserService();


// normal users apis
userRouter.get(
  RoutePaths.userProfile,
  Auths.authenticationMiddleware(),
  userService.getProfile,
);

userRouter.post(
  RoutePaths.logout,
  validationMiddleware({ schema: UserValidators.logout }),
  Auths.authenticationMiddleware(),
  userService.logout,
);

userRouter.patch(
  RoutePaths.profilePicture,
  Auths.authenticationMiddleware(),
  CloudMulter.handleSingleFileUpload({
    fieldName: StringConstants.ATTACHMENT_FIELD_NAME,
    maxFileSize: Number(process.env[EnvFields.PROFILE_PICTURE_SIZE]),
    validation: fileValidation.image,
  }),
  validationMiddleware({ schema: UserValidators.uploadProfilePicture }),
  userService.uploadProfilePicture,
);

userRouter.patch(
  RoutePaths.updateProfile,
  Auths.authenticationMiddleware(),
  validationMiddleware({ schema: UserValidators.updateProfile }),
  userService.updateProfile,
);

userRouter.patch(
  RoutePaths.changePassword,
  Auths.authenticationMiddleware(),
  validationMiddleware({ schema: UserValidators.changePassword }),
  userService.changePassword,
);


// admin apis
adminUserRouter.use(
  Auths.combined({
    accessRoles: userAuthorizationEndpoints.getUsers,
    applicationType: ApplicationTypeEnum.adminDashboard,
  }),
);