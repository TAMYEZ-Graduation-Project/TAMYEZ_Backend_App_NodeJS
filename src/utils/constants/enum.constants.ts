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
}

export enum EventsEnum {
  emailVerification = "EmailVerification",
  forgetPassword = "ForgetPassword",
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
