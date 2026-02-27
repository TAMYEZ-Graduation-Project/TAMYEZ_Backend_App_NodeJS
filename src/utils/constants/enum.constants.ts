export enum ProjectMoodsEnum {
  dev = "Development",
  prod = "Production",
}

export enum ErrorCodesEnum {
  SERVER_ERROR = "SERVER_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_PARAMETERS = "MISSING_PARAMETERS",
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  CONFLICT_ERROR = "CONFLICT_ERROR",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  TOO_MANY_RQUESTS = "TOO_MANY_REQUESTS",
  ASSET_ERROR = "ASSET_ERROR",
  CONTENT_TOO_LARGE = "CONTENT_TOO_LARGE",
  VERSION_CONFLICT = "VERSION_CONFLICT",
}

export enum EmailEventsEnum {
  emailVerification = "EmailVerification",
  forgetPassword = "ForgetPassword",
  emailRestoration = "EmailRestoration",
  feedbackReply = "FeedReply",
}

export enum NotificationEventsEnum {
  allUsers = "AllUsers",
  careerUsers = "CareerUsers",
}

export enum GenderEnum {
  male = "Male",
  female = "Female",
}

export enum ProvidersEnum {
  local = "Local",
  google = "Google",
}

export enum RolesEnum {
  user = "User",
  admin = "Admin",
  superAdmin = "SuperAdmin",
}

export enum OTPsOrLinksEnum {
  confirmEmailLink = "ConfirmEmailLink",
  forgetPasswordOTP = "ForgetPasswordOTP",
}

export enum EmailStatusEnum {
  notConfirmed = "NotConfirmed",
  confirmed = "Confirmed",
}

export enum SignatureLevelsEnum {
  BearerUser = "BUser",
  BearerSystem = "BSystem",
  BearerSuperSystem = "BSuperSystem",
}

export enum TokenTypesEnum {
  accessToken = "AccessToken",
}

export enum StorageTypesEnum {
  disk = "Disk",
  memory = "Memory",
}

export enum FileDownloadValuesEnum {
  true = "true",
  false = "false",
}

export enum QuizTypesEnum {
  careerAssessment = "CareerAssessment",
  stepQuiz = "StepQuiz",
}

export enum LogoutFlagsEnum {
  all = "All",
  one = "One",
  stay = "Stay",
}

export enum QuestionTypesEnum {
  mcqSingle = "mcq-single",
  mcqMulti = "mcq-multi",
  written = "written",
}

export enum OptionIdsEnum {
  empty = "optEmpty",
  optionA = "optA",
  optionB = "optB",
  optionC = "optC",
  optionD = "optD",
}

export enum PlatformsEnum {
  flutterAndroid = "flutter-android",
  flutterIos = "flutter-ios",
  web = "web",
}

export enum AdminNotificationTypesEnum {
  allUsers = "AllUsers",
  careerSpecific = "CareerSpecific",
}

export enum RoadmapStepPricingTypesEnum {
  free = "Free",
  paid = "Paid",
  subscription = "Subscription",
}

export enum LanguagesEnum {
  en = "en", // English
  ar = "ar", // Arabic
  in = "in", // Indonesian
  fr = "fr", // French
  es = "es", // Spanish
  de = "de", // German
  it = "it", // Italian
  ja = "ja", // Japanese
  ko = "ko", // Korean
  zh = "zh", // Chinese
  ru = "ru", // Russian
  pt = "pt", // Portuguese
  hi = "hi", // Hindi
  nl = "nl", // Dutch
  sv = "sv", // Swedish
}

export enum CareerResourceAppliesToEnum {
  all = "All",
  specific = "Specific",
}

export enum CareerResourceNamesEnum {
  courses = "courses",
  youtubePlaylists = "youtubePlaylists",
  books = "books",
}

export enum ApplicationTypeEnum {
  user = "User",
  adminDashboard = "AdminDashboard",
}

export enum DashboardReviewTypes {
  users = "users",
  careers = "careers",
  quizzes = "quizzes",
}

export enum BucketProvidersEnum {
  aws = "AWS",
  cloudflare = "Cloudflare",
}

export enum CareerAssessmentStatusEnum {
  notStarted = "NotStarted",
  inProgress = "InProgress",
  completed = "Completed",
  canRetake = "CanRetake",
}

export enum RoadmapStepProgressStatusEnum {
  completed = "Completed",
  inProgress = "InProgress",
  available = "Available",
  lockedPrereq = "LockedPrereq",
  disabledFrozen = "DisabledFrozen",
}
