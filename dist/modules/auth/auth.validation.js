import { z } from "zod";
import generalValidationConstants from "../../utils/constants/validation.constants.js";
import StringConstants from "../../utils/constants/strings.constants.js";
import { GenderEnum } from "../../utils/constants/enum.constants.js";
class AuthValidators {
    static checkNotificationStatus = {
        body: z
            .strictObject({
            deviceId: generalValidationConstants.deviceId.optional(),
            fcmToken: generalValidationConstants.fcmToken.optional(),
        })
            .superRefine((data, ctx) => {
            if ((!data.deviceId || !data.fcmToken) &&
                !(!data.deviceId && !data.fcmToken)) {
                ctx.addIssue({
                    code: "custom",
                    path: [!data.deviceId ? "deviceId" : "fcmToken"],
                    message: "For checking notifcations status both deviceId and fcmToken must be provided 🚫",
                });
            }
        }),
    };
    static logIn = {
        body: this.checkNotificationStatus.body.safeExtend({
            email: generalValidationConstants.email,
            password: generalValidationConstants.password(),
        }),
    };
    static adminLogIn = {
        body: z.strictObject({
            email: generalValidationConstants.email,
            password: generalValidationConstants.password(),
        }),
    };
    static signUp = {
        body: this.adminLogIn.body
            .extend({
            fullName: generalValidationConstants.fullName,
            confirmPassword: z.string({
                error: StringConstants.PATH_REQUIRED_MESSAGE("confirmPassword"),
            }),
            gender: z.enum(Object.values(GenderEnum), {
                error: StringConstants.INVALID_GENDER_MESSAGE,
            }),
            phoneNumber: generalValidationConstants.phoneNumber,
        })
            .superRefine((data, ctx) => {
            generalValidationConstants.confirmPasswordChecker(data, ctx);
        }),
    };
    static signUpLogInGamil = {
        body: this.checkNotificationStatus.body.safeExtend({
            idToken: generalValidationConstants.token,
        }),
    };
    static adminLogInGmail = {
        body: z.strictObject({
            idToken: generalValidationConstants.token,
        }),
    };
    static verifyEmail = {
        query: z.strictObject({
            token: z
                .string({ error: StringConstants.PATH_REQUIRED_MESSAGE("token") })
                .nonempty({ error: StringConstants.PATH_NOEMPTY_MESSAGE("token") }),
        }),
    };
    static restoreEmail = {
        query: this.verifyEmail.query,
    };
    static resendEmailVerificationLink = {
        body: z.strictObject({
            email: generalValidationConstants.email,
        }),
    };
    static forgetPassword = {
        body: z.strictObject({
            email: generalValidationConstants.email,
        }),
    };
    static verifyForgetPassword = {
        body: this.forgetPassword.body.extend({
            otp: generalValidationConstants.otp,
        }),
    };
    static resetForgetPassword = {
        body: this.forgetPassword.body
            .extend({
            password: generalValidationConstants.password(),
            confirmPassword: z.string({
                error: StringConstants.PATH_REQUIRED_MESSAGE("confirmPassword"),
            }),
        })
            .superRefine((data, ctx) => {
            generalValidationConstants.confirmPasswordChecker(data, ctx);
        }),
    };
}
export default AuthValidators;
