export var ProjectMoodsEnum;
(function (ProjectMoodsEnum) {
    ProjectMoodsEnum["dev"] = "Development";
    ProjectMoodsEnum["prod"] = "Production";
})(ProjectMoodsEnum || (ProjectMoodsEnum = {}));
export var ErrorCodesEnum;
(function (ErrorCodesEnum) {
    ErrorCodesEnum["SERVER_ERROR"] = "SERVER_ERROR";
    ErrorCodesEnum["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCodesEnum["INVALID_INPUT"] = "INVALID_INPUT";
    ErrorCodesEnum["MISSING_PARAMETERS"] = "MISSING_PARAMETERS";
    ErrorCodesEnum["RESOURCE_NOT_FOUND"] = "RESOURCE_NOT_FOUND";
    ErrorCodesEnum["CONFLICT_ERROR"] = "CONFLICT_ERROR";
    ErrorCodesEnum["UNAUTHORIZED"] = "UNAUTHORIZED";
    ErrorCodesEnum["FORBIDDEN"] = "FORBIDDEN";
    ErrorCodesEnum["TOO_MANY_RQUESTS"] = "TOO_MANY_REQUESTS";
    ErrorCodesEnum["ASSET_ERROR"] = "ASSET_ERROR";
})(ErrorCodesEnum || (ErrorCodesEnum = {}));
export var EmailEventsEnum;
(function (EmailEventsEnum) {
    EmailEventsEnum["emailVerification"] = "EmailVerification";
    EmailEventsEnum["forgetPassword"] = "ForgetPassword";
})(EmailEventsEnum || (EmailEventsEnum = {}));
export var NotificationEventsEnum;
(function (NotificationEventsEnum) {
    NotificationEventsEnum["mutlipleNotifications"] = "MultipleNotifications";
})(NotificationEventsEnum || (NotificationEventsEnum = {}));
export var GenderEnum;
(function (GenderEnum) {
    GenderEnum["male"] = "Male";
    GenderEnum["female"] = "Female";
})(GenderEnum || (GenderEnum = {}));
export var ProvidersEnum;
(function (ProvidersEnum) {
    ProvidersEnum["local"] = "Local";
    ProvidersEnum["google"] = "Google";
})(ProvidersEnum || (ProvidersEnum = {}));
export var RolesEnum;
(function (RolesEnum) {
    RolesEnum["user"] = "User";
    RolesEnum["admin"] = "Admin";
    RolesEnum["superAdmin"] = "SuperAdmin";
})(RolesEnum || (RolesEnum = {}));
export var OTPsOrLinksEnum;
(function (OTPsOrLinksEnum) {
    OTPsOrLinksEnum["confirmEmailLink"] = "ConfirmEmailLink";
    OTPsOrLinksEnum["forgetPasswordOTP"] = "ForgetPasswordOTP";
})(OTPsOrLinksEnum || (OTPsOrLinksEnum = {}));
export var EmailStatusEnum;
(function (EmailStatusEnum) {
    EmailStatusEnum["notConfirmed"] = "NotConfirmed";
    EmailStatusEnum["confirmed"] = "Confirmed";
})(EmailStatusEnum || (EmailStatusEnum = {}));
export var SignatureLevelsEnum;
(function (SignatureLevelsEnum) {
    SignatureLevelsEnum["BearerUser"] = "BUser";
    SignatureLevelsEnum["BearerSystem"] = "BSystem";
    SignatureLevelsEnum["BearerSuperSystem"] = "BSuperSystem";
})(SignatureLevelsEnum || (SignatureLevelsEnum = {}));
export var TokenTypesEnum;
(function (TokenTypesEnum) {
    TokenTypesEnum["accessToken"] = "AccessToken";
})(TokenTypesEnum || (TokenTypesEnum = {}));
export var StorageTypesEnum;
(function (StorageTypesEnum) {
    StorageTypesEnum["disk"] = "Disk";
    StorageTypesEnum["memory"] = "Memory";
})(StorageTypesEnum || (StorageTypesEnum = {}));
export var FileDownloadValuesEnum;
(function (FileDownloadValuesEnum) {
    FileDownloadValuesEnum["true"] = "true";
    FileDownloadValuesEnum["false"] = "false";
})(FileDownloadValuesEnum || (FileDownloadValuesEnum = {}));
export var QuizTypesEnum;
(function (QuizTypesEnum) {
    QuizTypesEnum["careerAssessment"] = "CareerAssessment";
    QuizTypesEnum["stepQuiz"] = "StepQuiz";
})(QuizTypesEnum || (QuizTypesEnum = {}));
export var LogoutFlagsEnum;
(function (LogoutFlagsEnum) {
    LogoutFlagsEnum["all"] = "All";
    LogoutFlagsEnum["one"] = "One";
    LogoutFlagsEnum["stay"] = "Stay";
})(LogoutFlagsEnum || (LogoutFlagsEnum = {}));
export var QuestionTypesEnum;
(function (QuestionTypesEnum) {
    QuestionTypesEnum["mcqSingle"] = "mcq-single";
    QuestionTypesEnum["mcqMulti"] = "mcq-multi";
    QuestionTypesEnum["written"] = "written";
})(QuestionTypesEnum || (QuestionTypesEnum = {}));
export var OptionIdsEnum;
(function (OptionIdsEnum) {
    OptionIdsEnum["empty"] = "optEmpty";
    OptionIdsEnum["optionA"] = "optA";
    OptionIdsEnum["optionB"] = "optB";
    OptionIdsEnum["optionC"] = "optC";
    OptionIdsEnum["optionD"] = "optD";
})(OptionIdsEnum || (OptionIdsEnum = {}));
export var PlatformsEnum;
(function (PlatformsEnum) {
    PlatformsEnum["flutterAndroid"] = "flutter-android";
    PlatformsEnum["flutterIos"] = "flutter-ios";
    PlatformsEnum["web"] = "web";
})(PlatformsEnum || (PlatformsEnum = {}));
export var AdminNotificationTypesEnum;
(function (AdminNotificationTypesEnum) {
    AdminNotificationTypesEnum["allUsers"] = "AllUsers";
    AdminNotificationTypesEnum["careerSpecific"] = "CareerSpecific";
})(AdminNotificationTypesEnum || (AdminNotificationTypesEnum = {}));
