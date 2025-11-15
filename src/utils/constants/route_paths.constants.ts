class RoutePaths {
  static readonly ALL_PATH = "{/*dummy}";
  static readonly API_V1_PATH = "/api/v1";
  static readonly SLASH_PATH = "/";

  // auth routes
  static readonly auth = "/auth";
  static readonly signUp = "/sign-up";
  static readonly logIn = "/log-in";
  static readonly signUpGmail = "/sign-up-gmail";
  static readonly logInGmail = "/log-in-gmail";
  static readonly verifyEmail = "/verify-email";
  static readonly forgetPassword = "/forget-password";
  static readonly verifyForgetPassowrd = "/verify-forget-password";
  static readonly resetForgetPassword = "/reset-forget-password";
  static readonly resendEmailVerificationLink = "/resend-email-verification";
}

export default RoutePaths;
