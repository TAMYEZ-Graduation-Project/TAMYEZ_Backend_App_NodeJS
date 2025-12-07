class RoutePaths {
  static readonly ALL_PATH = "{/*dummy}";
  static readonly API_V1_PATH = "/api/v1";
  static readonly SLASH_PATH = "/";

  // uploads routes
  static readonly uploads = "/uploads";
  static readonly getFileFromSubKey = "/*path";
  static readonly getFileFromSubKeyByPresignedUrl = "/presignd-url/*path";

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

  // user routes
  static readonly user = "/user";
  static readonly userProfile = "/";
  static readonly profilePicture = "/profile-picture";
  static readonly updateProfile = "/";
  static readonly changePassword = "/change-password";
  static readonly logout = "/logout";

  // quiz routes
  static readonly quiz = "/quiz";
  static readonly getQuizDetails = "/:quizId";
  static readonly getQuizQuestions = "/questions/:quizId";
  static readonly getSavedQuizzes = "/saved";
  static readonly getSavedQuiz = "/saved/:savedQuizId";
  static readonly checkQuizAnswers = "/:quizId";
  static readonly createQuiz = "/admin/";
  static readonly updateQuiz = "/admin/:quizId";
}

export default RoutePaths;
