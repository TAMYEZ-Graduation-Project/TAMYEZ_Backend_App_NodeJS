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
  validationMiddleware({ schema: UserValidators.getProfile }),
  userService.getProfile(),
);

userRouter.post(
  RoutePaths.logout,
  Auths.authenticationMiddleware(),
  validationMiddleware({ schema: UserValidators.logout }),
  userService.logout,
);

userRouter.post(
  RoutePaths.submitFeedback,
  Auths.authenticationWithGateway({
    applicationType: ApplicationTypeEnum.user,
  }),
  validationMiddleware({ schema: UserValidators.submitFeedback }),
  userService.submitFeedback,
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

userRouter.patch(
  RoutePaths.archiveAccount,
  Auths.authenticationMiddleware(),
  validationMiddleware({ schema: UserValidators.archiveAccount }),
  userService.archiveAccount,
);

userRouter.delete(
  RoutePaths.deleteAccount,
  Auths.authenticationMiddleware(),
  validationMiddleware({ schema: UserValidators.deleteAccount }),
  userService.deleteAccount,
);

// admin apis
adminUserRouter.use(
  Auths.combinedWithGateway({
    accessRoles: userAuthorizationEndpoints.getUsers,
    applicationType: ApplicationTypeEnum.adminDashboard,
  }),
);

adminUserRouter.get(
  RoutePaths.getAdminDashboardData,
  userService.getAdminDashboardData,
);

adminUserRouter.get(
  RoutePaths.getUsers,
  validationMiddleware({ schema: UserValidators.getUsers }),
  userService.getUsers(),
);

adminUserRouter.get(
  RoutePaths.getArchivedUsers,
  validationMiddleware({ schema: UserValidators.getUsers }),
  userService.getUsers({ archived: true }),
);

adminUserRouter.get(
  RoutePaths.archivedUserProfile,
  validationMiddleware({ schema: UserValidators.getProfile }),
  userService.getProfile({ archived: true }),
);

adminUserRouter.patch(
  RoutePaths.changeRole,
  validationMiddleware({ schema: UserValidators.changeRole }),
  userService.changeRole,
);

adminUserRouter.patch(
  RoutePaths.restoreAccount,
  validationMiddleware({ schema: UserValidators.restoreAccount }),
  userService.restoreAccount,
);
