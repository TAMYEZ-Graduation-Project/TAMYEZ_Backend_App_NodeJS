import { Router } from "express";
import RoutePaths from "../../utils/constants/route_paths.constants.ts";
import Auths from "../../middlewares/auths.middleware.ts";
import firebaseAuthorizationEndpoints from "./firebase.authorization.ts";
import validationMiddleware from "../../middlewares/validation.middleware.ts";
import FirebaseValidators from "./firebase.validation.ts";
import FirebaseService from "./firebase.service.ts";
import { ApplicationTypeEnum } from "../../utils/constants/enum.constants.ts";

export const firebaseRouter = Router();
export const adminFirebaseRouter = Router();

const firebaseService = new FirebaseService();

// normal user apis
firebaseRouter.post(
  RoutePaths.enableNotifications,
  Auths.authenticationWithGateway({
    applicationType: ApplicationTypeEnum.user,
  }),
  validationMiddleware({ schema: FirebaseValidators.enableNotifications }),
  firebaseService.enableNotifications,
);

firebaseRouter.post(
  RoutePaths.refreshFcmToken,
  Auths.authenticationWithGateway({
    applicationType: ApplicationTypeEnum.user,
  }),
  validationMiddleware({ schema: FirebaseValidators.refreshFcmToken }),
  firebaseService.refreshFcmToken,
);

firebaseRouter.post(
  RoutePaths.disableNotifications,
  Auths.authenticationWithGateway({
    applicationType: ApplicationTypeEnum.user,
  }),
  validationMiddleware({ schema: FirebaseValidators.disableNotifications }),
  firebaseService.disableNotifications,
);

// admin apis
adminFirebaseRouter.use(
  Auths.combinedWithGateway({
    accessRoles: firebaseAuthorizationEndpoints.sendNotification,
    applicationType: ApplicationTypeEnum.adminDashboard,
  }),
);
adminFirebaseRouter.post(
  RoutePaths.sendNotification,
  validationMiddleware({ schema: FirebaseValidators.sendNotification }),
  firebaseService.sendFirebaseNotification,
);

adminFirebaseRouter.post(
  RoutePaths.sendMultipleNotifications,
  validationMiddleware({ schema: FirebaseValidators.sendMultiNotifications }),
  firebaseService.sendMultipleFirebaseNotifications,
);

adminFirebaseRouter.post(
  RoutePaths.sendNotificationsToAllUsers,
  validationMiddleware({
    schema: FirebaseValidators.sendNotificationsToAllUsers,
  }),
  firebaseService.sendNotificationsToAllUsers,
);

adminFirebaseRouter.post(
  RoutePaths.sendNotificationToCareerUsers,
  validationMiddleware({
    schema: FirebaseValidators.sendNotificationToCareerUsers,
  }),
  firebaseService.sendNotificationsToCareerUsers,
);
