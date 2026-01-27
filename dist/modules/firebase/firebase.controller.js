import { Router } from "express";
import RoutePaths from "../../utils/constants/route_paths.constants.js";
import Auths from "../../middlewares/auths.middleware.js";
import firebaseAuthorizationEndpoints from "./firebase.authorization.js";
import validationMiddleware from "../../middlewares/validation.middleware.js";
import FirebaseValidators from "./firebase.validation.js";
import FirebaseService from "./firebase.service.js";
import { ApplicationTypeEnum } from "../../utils/constants/enum.constants.js";
export const firebaseRouter = Router();
export const adminFirebaseRouter = Router();
const firebaseService = new FirebaseService();
firebaseRouter.post(RoutePaths.enableNotifications, Auths.authenticationMiddleware(), validationMiddleware({ schema: FirebaseValidators.enableNotifications }), firebaseService.enableNotifications);
firebaseRouter.post(RoutePaths.refreshFcmToken, Auths.authenticationMiddleware(), validationMiddleware({ schema: FirebaseValidators.refreshFcmToken }), firebaseService.refreshFcmToken);
firebaseRouter.post(RoutePaths.disableNotifications, Auths.authenticationMiddleware(), validationMiddleware({ schema: FirebaseValidators.disableNotifications }), firebaseService.disableNotifications);
adminFirebaseRouter.use(Auths.combined({
    accessRoles: firebaseAuthorizationEndpoints.sendNotification,
    applicationType: ApplicationTypeEnum.adminDashboard,
}));
adminFirebaseRouter.post(RoutePaths.sendNotification, validationMiddleware({ schema: FirebaseValidators.sendNotification }), firebaseService.sendFirebaseNotification);
adminFirebaseRouter.post(RoutePaths.sendMultipleNotifications, validationMiddleware({ schema: FirebaseValidators.sendMultiNotifications }), firebaseService.sendMultipleFirebaseNotifications);
adminFirebaseRouter.post(RoutePaths.sendNotificationsToAllUsers, validationMiddleware({
    schema: FirebaseValidators.sendNotificationsToAllUsers,
}), firebaseService.sendNotificationsToAllUsers);
