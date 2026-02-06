import { z } from "zod";
import generalValidationConstants from "../../utils/constants/validation.constants.ts";
import fileValidation from "../../utils/multer/file_validation.multer.ts";
import StringConstants from "../../utils/constants/strings.constants.ts";
import EnvFields from "../../utils/constants/env_fields.constants.ts";
import {
  GenderEnum,
  LogoutFlagsEnum,
  RolesEnum,
} from "../../utils/constants/enum.constants.ts";

class UserValidators {
  static getProfile = {
    params: z.strictObject({
      userId: generalValidationConstants.objectId.optional(),
    }),
  };

  static getUsers = {
    query: z.strictObject({
      size: z.coerce.number().int().min(2).max(30).optional().default(15),
      page: z.coerce.number().int().min(1).max(300).optional().default(1),
      searchKey: z.string().nonempty().min(1).optional(),
    }),
  };

  static uploadProfilePicture = {
    body: z.strictObject({
      attachment: generalValidationConstants.fileKeys({
        fieldName: StringConstants.ATTACHMENT_FIELD_NAME,
        maxSize: Number(process.env[EnvFields.PROFILE_PICTURE_SIZE]),
        mimetype: fileValidation.image,
      }),
      v: generalValidationConstants.v,
    }),
  };

  static updateProfile = {
    body: z
      .strictObject({
        firstName: generalValidationConstants.name.optional(),
        lastName: generalValidationConstants.name.optional(),
        phoneNumber: generalValidationConstants.phoneNumber.optional(),
        gender: z.enum(Object.values(GenderEnum)).optional(),
        v: generalValidationConstants.v,
      })
      .superRefine((data, ctx) => {
        generalValidationConstants.checkValuesForUpdate(data, ctx);
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
        v: generalValidationConstants.v,
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
          ctx,
        );
      }),
  };

  static logout = {
    body: z.strictObject({
      deviceId: generalValidationConstants.deviceId.optional(),
      flag: z
        .enum(Object.values(LogoutFlagsEnum))
        .optional()
        .default(LogoutFlagsEnum.one)
        .refine((value) => {
          return value != LogoutFlagsEnum.stay;
        }),
    }),
  };

  static changeRole = {
    params: z.strictObject({
      userId: generalValidationConstants.objectId,
    }),
    body: z.strictObject({
      role: z.enum(Object.values(RolesEnum)),
      v: generalValidationConstants.v,
    }),
  };

  static archiveAccount = {
    params: this.getProfile.params,
    body: z.strictObject({
      v: generalValidationConstants.v,
      refreeze: z.coerce.boolean().optional(),
    }),
  };

  static restoreAccount = {
    params: this.changeRole.params,
    body: z.strictObject({
      v: generalValidationConstants.v,
    }),
  };

  static deleteAccount = {
    params: this.getProfile.params,
    body: z.strictObject({
      v: generalValidationConstants.v,
    }),
  };

  static submitFeedback = {
    body: z.strictObject({
      text: z.string().nonempty().min(1).max(1000),
      stars: z.coerce.number().int().min(1).max(5),
    })
  }
}

export default UserValidators;
