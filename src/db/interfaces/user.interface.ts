import type { HydratedDocument, Types } from "mongoose";
import type {
  ProvidersEnum,
  GenderEnum,
  RolesEnum,
} from "../../utils/constants/enum.constants.ts";

export interface IOtpOrLinkObject {
  code: string;
  expiresAt: Date;
  count: number;
}

export interface IUser {
  id?: Types.ObjectId; // virtual

  fullName?: string;
  firstName: string;
  lastName: string; // vitual

  email: string;
  confirmEmailLink?: IOtpOrLinkObject;
  confirmedAt?: Date;

  password: string;
  forgetPasswordOtp?: IOtpOrLinkObject;
  forgetPasswordVerificationExpiresAt?: Date;
  lastResetPasswordAt?: Date;

  changeCredentialsTime?: Date;

  gender: GenderEnum;
  role: RolesEnum;
  authProvider: ProvidersEnum;

  phoneNumber?: string;

  dateOfBirth?: Date;

  profilePicture: {
    url: string;
    provider: ProvidersEnum;
  };

  // Acadamic Info
  education?: string;
  skills?: string[];
  coursesAndCertifications?: string[];
  careerPathId?: Types.ObjectId;

  freezed?: {
    at: Date;
    by: Types.ObjectId;
  };
  restored?: {
    at: Date;
    by: Types.ObjectId;
  };

  createdAt: Date;
  updatedAt: Date;
}

export type HIUserType = HydratedDocument<IUser>;
