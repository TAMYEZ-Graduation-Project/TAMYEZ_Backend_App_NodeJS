import { z } from "zod";
import type AuthValidators from "./auth.validation.ts";

export type SignUpBodyDtoType = z.infer<typeof AuthValidators.signUp.body>;
export type LogInBodyDtoType = z.infer<typeof AuthValidators.logIn.body>;

export type VerifyEmailQueryDtoType = z.infer<
  typeof AuthValidators.verifyEmail.query
>;

export type ResendEmailVerificationLinkBodyDtoType = z.infer<
  typeof AuthValidators.resendEmailVerificationLink.body
>;

export type ForgetPasswordBodyDtoType = z.infer<
  typeof AuthValidators.forgetPassword.body
>;
export type VerifyForgetPasswordBodyDtoType = z.infer<
  typeof AuthValidators.verifyForgetPassword.body
>;
export type ResetForgetPasswordBodyDtoType = z.infer<
  typeof AuthValidators.resetForgetPassword.body
>;

export type SignUpLogInGmailBodyDtoType = z.infer<
  typeof AuthValidators.signUpLogInGamil.body
>;
