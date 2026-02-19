import type { HIUserType } from "../../db/interfaces/user.interface.ts";
import {
  EmailStatusEnum,
  OTPsOrLinksEnum,
} from "../constants/enum.constants.ts";
import EnvFields from "../constants/env_fields.constants.ts";
import StringConstants from "../constants/strings.constants.ts";
import {
  BadRequestException,
  TooManyRequestsException,
} from "../exceptions/custom.exceptions.ts";

class OTPSecurityUtil {
  static checkRequestOfNewOTP = ({
    user,
    otpType = OTPsOrLinksEnum.confirmEmailLink,
    checkEmailStatus = EmailStatusEnum.notConfirmed,
    otpExpiringTime = Number(
      process.env[EnvFields.OTP_EXPIRES_IN_MILLISECONDS],
    ),
    windowTimePreferedToNewOtpRequest = Number(
      process.env[EnvFields.WINDOW_PREFERED_TO_NEW_OTP_REQUST_IN_MILLISECONDS],
    ),
  }: {
    user: HIUserType | null;
    otpType?: OTPsOrLinksEnum;
    checkEmailStatus?: EmailStatusEnum;
    otpExpiringTime?: number;
    windowTimePreferedToNewOtpRequest?: number;
  }): number => {
    if (
      !user ||
      (checkEmailStatus === EmailStatusEnum.notConfirmed
        ? user!.confirmedAt
        : !user.confirmedAt)
    ) {
      throw new BadRequestException(
        `Invalid Account or ${
          checkEmailStatus === EmailStatusEnum.notConfirmed ? "" : "NOT"
        }already Verified!`,
      );
    }
    let otpObject;
    switch (otpType) {
      case OTPsOrLinksEnum.confirmEmailLink:
        otpObject = user!.confirmEmailLink;
        break;
      case OTPsOrLinksEnum.forgetPasswordOTP:
        otpObject = user!.forgetPasswordOtp;
        break;
    }
    //console.log({ otpObject });

    if (otpObject && otpObject.expiresAt) {
      if (otpObject.count! >= 5) {
        if (
          Date.now() - (otpObject.expiresAt.getTime() - otpExpiringTime) >=
          900_000 // 15 minutes
        ) {
          otpObject.count = 0;
        } else {
          throw new TooManyRequestsException(
            StringConstants.TRY_AFTER_A_WHILE_MESSAGE,
          );
        }
      } else {
        if (
          Date.now() + otpExpiringTime - otpObject.expiresAt.getTime() <=
          windowTimePreferedToNewOtpRequest
        ) {
          otpObject.count!++;
        } else {
          otpObject.count = 0;
        }
      }
    }
    return otpObject?.count || 0;
  };
}

export default OTPSecurityUtil;
