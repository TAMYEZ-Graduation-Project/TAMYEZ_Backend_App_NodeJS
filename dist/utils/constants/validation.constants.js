import z from "zod";
import StringConstants from "./strings.constants.js";
import AppRegex from "./regex.constants.js";
import { Types } from "mongoose";
const generalValidationConstants = {
    objectId: z.string().refine((value) => {
        return Types.ObjectId.isValid(value);
    }, { error: StringConstants.INVALID_USER_ID_MESSAGE }),
    fullName: z
        .string({ error: StringConstants.PATH_REQUIRED_MESSAGE("fullName") })
        .regex(AppRegex.fullNameRegex, StringConstants.NAME_VALIDATION_MESSAGE),
    email: z.email(StringConstants.INVALID_EMAIL_MESSAGE),
    password: z
        .string({ error: StringConstants.PATH_REQUIRED_MESSAGE("password") })
        .regex(AppRegex.passwordRegex, StringConstants.PASSWORD_VALIDATION_MESSAGE),
    otp: z
        .string({ error: StringConstants.PATH_REQUIRED_MESSAGE("otp") })
        .regex(AppRegex.otpRegex, { error: StringConstants.INVALID_OTP_VALIDATION_MESSAGE }),
    confirmPasswordChecker: (data, ctx) => {
        if (data.confirmPassword !== data.password) {
            ctx.addIssue({
                code: "custom",
                path: ["confirmPassword"],
                message: StringConstants.MISMATCH_CONFIRM_PASSWORD_MESSAGE,
            });
        }
    },
    requiredObjectCheker: (objectName, data, ctx) => {
        if (data == undefined) {
            ctx.addIssue({
                code: "custom",
                path: [""],
                message: StringConstants.MISMATCH_CONFIRM_PASSWORD_MESSAGE,
            });
        }
    },
};
export default generalValidationConstants;
