import { EmailStatusEnum, OTPsOrLinksEnum, } from "../constants/enum.constants.js";
import EnvFields from "../constants/env_fields.constants.js";
import StringConstants from "../constants/strings.constants.js";
import { BadRequestException, TooManyRequestsException, } from "../exceptions/custom.exceptions.js";
class OTPSecurityUtil {
    static checkRequestOfNewOTP = ({ user, otpType = OTPsOrLinksEnum.confirmEmailLink, checkEmailStatus = EmailStatusEnum.notConfirmed, otpExpiringTime = Number(process.env[EnvFields.OTP_EXPIRES_IN_MILLISECONDS]), windowTimePreferedToNewOtpRequest = Number(process.env[EnvFields.WINDOW_PREFERED_TO_NEW_OTP_REQUST_IN_MILLISECONDS]), }) => {
        if (!user ||
            (checkEmailStatus === EmailStatusEnum.notConfirmed
                ? user.confirmedAt
                : !user.confirmedAt)) {
            throw new BadRequestException(`Invalid Account or ${checkEmailStatus === EmailStatusEnum.notConfirmed ? "" : "NOT"}already Verified!`);
        }
        let otpObject;
        switch (otpType) {
            case OTPsOrLinksEnum.confirmEmailLink:
                otpObject = user.confirmEmailLink;
                break;
            case OTPsOrLinksEnum.forgetPasswordOTP:
                otpObject = user.forgetPasswordOtp;
                break;
        }
        console.log({ otpObject });
        if (otpObject && otpObject.expiresAt) {
            if (otpObject.count >= 5) {
                if (Date.now() + otpExpiringTime - otpObject.expiresAt.getTime() >=
                    otpExpiringTime) {
                    otpObject.count = 0;
                }
                else {
                    throw new TooManyRequestsException(StringConstants.TRY_AFTER_A_WHILE_MESSAGE);
                }
            }
            else {
                if (Date.now() + otpExpiringTime - otpObject.expiresAt.getTime() <=
                    windowTimePreferedToNewOtpRequest) {
                    otpObject.count++;
                }
                else {
                    otpObject.count = 0;
                }
            }
        }
        return otpObject?.count || 0;
    };
}
export default OTPSecurityUtil;
