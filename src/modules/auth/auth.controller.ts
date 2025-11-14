import { Router } from "express";
import authService from "./auth.service.ts";
import validationMiddleware from "../../middlewares/validation.middleware.ts";
import AuthValidator from "./auth.validation.ts";
import RoutePaths from "../../utils/constants/route_paths.constants.ts";

const authRouter = Router();

authRouter.post(
  RoutePaths.signUp,
  validationMiddleware({ schema: AuthValidator.signUp }),
  authService.signUp
);

authRouter.post(
  RoutePaths.logIn,
  validationMiddleware({ schema: AuthValidator.logIn }),
  authService.logIn
);


authRouter.post(
  RoutePaths.resendEmailVerificationLink,
  validationMiddleware({ schema: AuthValidator.resendEmailVerificationLink }),
  authService.resendEmailVerificationLink
)

authRouter.post(
  RoutePaths.forgetPassword,
  validationMiddleware({ schema: AuthValidator.forgetPassword }),
  authService.forgetPassword
)

authRouter.post(
  RoutePaths.verifyForgetPassowrd,
  validationMiddleware({ schema: AuthValidator.verifyForgetPassword }),
  authService.verifyForgetPassword
)

authRouter.post(
  RoutePaths.resetForgetPassword,
  validationMiddleware({ schema: AuthValidator.resetForgetPassword }),
  authService.resetForgetPassword
)

authRouter.get(
  RoutePaths.verifyEmail,
  validationMiddleware({ schema: AuthValidator.verifyEmail }),
  authService.verifyEmail
)

export default authRouter;
