import { z } from "zod";
import generalValidationConstants from "../../utils/constants/validation.constants.ts";
import StringConstants from "../../utils/constants/strings.constants.ts";
import { GenderEnum } from "../../utils/constants/enum.constants.ts";

class AuthValidators {
  static logIn = {
    body: z.strictObject({
      email: generalValidationConstants.email,
      password: generalValidationConstants.password,
    }),
  };
  static signUp = {
    body: this.logIn.body
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
        password: generalValidationConstants.password,
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
