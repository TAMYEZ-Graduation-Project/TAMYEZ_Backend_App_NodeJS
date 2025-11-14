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
})(ErrorCodesEnum || (ErrorCodesEnum = {}));
export var EventsEnum;
(function (EventsEnum) {
    EventsEnum["emailVerification"] = "EmailVerification";
    EventsEnum["forgetPassword"] = "ForgetPassword";
})(EventsEnum || (EventsEnum = {}));
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
