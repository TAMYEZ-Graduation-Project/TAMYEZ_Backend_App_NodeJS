import type { Default__v, HydratedDocument, Require_id, Types } from "mongoose";
import type {
  ProvidersEnum,
  GenderEnum,
  RolesEnum,
} from "../../utils/constants/enum.constants.ts";
import type {
  IAtByObject,
  ICodeExpireCountObject,
  IIdSelectedAtObject,
  IProfilePictureObject,
} from "./common.interface.ts";

export interface IQuizAttempts {
  count: number;
  lastAttempt: Date;
}

export interface ICareerDeleted {
  message: string;
  newSuggestedCareer?: Types.ObjectId;
}

export interface IUser {
  id?: Types.ObjectId | undefined; // virtual

  fullName?: string;
  firstName: string;
  lastName: string; // vitual

  email: string;
  confirmEmailLink?: ICodeExpireCountObject;
  confirmedAt?: Date;
  restoreEmailLink: ICodeExpireCountObject;

  password: string;
  forgetPasswordOtp?: ICodeExpireCountObject;
  forgetPasswordVerificationExpiresAt?: Date;
  lastResetPasswordAt?: Date;

  changeCredentialsTime?: Date;

  gender: GenderEnum;
  role: RolesEnum;
  authProvider: ProvidersEnum;

  phoneNumber: string;

  dateOfBirth?: Date;

  profilePicture?: IProfilePictureObject;
  coverImages?: string[];

  // Acadamic Info
  careerPath?: IIdSelectedAtObject;
  careerDeleted?: ICareerDeleted;

  // Quiz Info
  quizAttempts: IQuizAttempts;

  freezed?: IAtByObject;
  restored?: IAtByObject;

  createdAt: Date;
  updatedAt: Date;
}

export type FullIUser = Require_id<Default__v<IUser>>;

export type HIUserType = HydratedDocument<IUser>;
