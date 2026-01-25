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
  static readonly adminLogin = "/admin-log-in";
  static readonly signUpGmail = "/sign-up-gmail";
  static readonly logInGmail = "/log-in-gmail";
  static readonly adminLogInGmail = "/admin-log-in-gmail";
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

  // career routes
  static readonly career = "/career";
  static readonly createCareer = "/";
  static readonly getCareers = "/";
  static readonly getArchivedCareers = "/archives";
  static readonly getCareer = "/:careerId";
  static readonly getArchivedCareer = "/:careerId/archives";
  static readonly updateCareer = "/:careerId";
  static readonly uploadCareerPicture = "/:careerId/picture";
  static readonly updateCareerResource = "/:careerId/:resourceName/:resourceId";

  // roadmap routes
  static readonly roadmap = "/roadmap";
  static readonly createRoadmapStep = "/";
  static readonly getRoadmap = "/";
  static readonly getArchivedRoadmap = "/archives";
  static readonly getRoadmapStep = "/:roadmapStepId";
  static readonly getArchivedRoadmapStep = "/:roadmapStepId/archives";
  static readonly updateRoadmapStep = "/:roadmapStepId";
  static readonly updateRoadmapStepResource =
    "/:roadmapStepId/:resourceName/:resourceId";

  // quiz routes
  static readonly quiz = "/quiz";
  static readonly getQuizzes = "/";
  static readonly getArchivedQuizzes = "/archives";
  static readonly getQuiz = "/:quizId";
  static readonly getArchivedQuiz = "/:quizId/archives";
  static readonly getQuizQuestions = "/questions/:quizId";
  static readonly getSavedQuizzes = "/saved";
  static readonly getSavedQuiz = "/saved/:savedQuizId";
  static readonly checkQuizAnswers = "/:quizId";
  static readonly createQuiz = "/";
  static readonly updateQuiz = "/:quizId";
  static readonly archiveQuiz = "/:quizId/archive";
  static readonly restoreQuiz = "/:quizId/restore";
  static readonly deleteQuiz = "/:quizId/delete";

  // firebase route
  static readonly firebase = "/firebase";
  static readonly sendNotification = "/test-send-notification";
  static readonly sendMultipleNotifications =
    "/test-send-multiple-notifications";
  static readonly sendNotificationsToAllUsers = "/send-notifications-all";
  static readonly enableNotifications = "/enable-notifications";
  static readonly disableNotifications = "/disable-notifications";
  static readonly refreshFcmToken = "/refresh-fcm-token";
}

export default RoutePaths;
