import { z } from "zod";
import generalValidationConstants from "../../utils/constants/validation.constants.ts";
import fileValidation from "../../utils/multer/file_validation.multer.ts";
import StringConstants from "../../utils/constants/strings.constants.ts";
import EnvFields from "../../utils/constants/env_fields.constants.ts";
import {
  GenderEnum,
  LogoutFlagsEnum,
} from "../../utils/constants/enum.constants.ts";
import AppRegex from "../../utils/constants/regex.constants.ts";

class UserValidators {
  static uploadProfilePicture = {
    body: z.strictObject({
      attachment: generalValidationConstants.fileKeys({
        fieldName: StringConstants.ATTACHMENT_FIELD_NAME,
        maxSize: Number(process.env[EnvFields.PROFILE_PICTURE_SIZE]),
        mimetype: fileValidation.image,
      }),
    }),
  };

  static updateProfile = {
    body: z
      .strictObject({
        firstName: generalValidationConstants.name.optional(),
        lastName: generalValidationConstants.name.optional(),
        phoneNumber: generalValidationConstants.phoneNumber.optional(),
        gender: z.enum(Object.values(GenderEnum)).optional(),
      })
      .superRefine((data, ctx) => {
        if (!Object.values(data).length) {
          ctx.addIssue({
            code: "custom",
            path: [""],
            message: "All fields are empty ❌",
          });
        }
      }),
  };

  static changePassword = {
    body: z
      .strictObject({
        currentPassword: generalValidationConstants.password("currentPassword"),
        newPassword: generalValidationConstants.password("newPassword"),
        confirmPassword: generalValidationConstants.password("confirmPassword"),
        flag: z
          .enum(Object.values(LogoutFlagsEnum))
          .optional()
          .default(LogoutFlagsEnum.stay),
      })
      .superRefine((data, ctx) => {
        if (data.currentPassword == data.newPassword) {
          ctx.addIssue({
            code: "custom",
            path: ["newPassword"],
            message: "Current and New passwords shouldn't be the same 🔑☹️",
          });
        }

        generalValidationConstants.confirmPasswordChecker(
          {
            password: data.newPassword,
            confirmPassword: data.confirmPassword,
          },
          ctx
        );
      }),
  };

  static logout = {
    body: z.strictObject({
      deviceId: z
        .string({ error: StringConstants.PATH_REQUIRED_MESSAGE("deviceId") })
        .regex(AppRegex.deviceIdRegex, {
          error: "Invalid deviceId, it should be a valid UUID ❌",
        })
        .optional(),
      flag: z
        .enum(Object.values(LogoutFlagsEnum))
        .optional()
        .default(LogoutFlagsEnum.one)
        .refine((value) => {
          return value != LogoutFlagsEnum.stay;
        }),
    }),
  };
}

export default UserValidators;
