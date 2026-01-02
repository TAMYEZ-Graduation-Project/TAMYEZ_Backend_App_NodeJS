import z from "zod";
import StringConstants from "./strings.constants.ts";
import AppRegex from "./regex.constants.ts";
import { Types } from "mongoose";
import { StorageTypesEnum } from "./enum.constants.ts";
import Stream from "node:stream";

const generalValidationConstants = {
  objectId: z.string().refine(
    (value) => {
      return Types.ObjectId.isValid(value);
    },
    { error: StringConstants.INVALID_PARAMETER_MESSAGE() }
  ),
  name: z
    .string({ error: StringConstants.PATH_REQUIRED_MESSAGE("name") })
    .regex(AppRegex.nameRegex, StringConstants.NAME_VALIDATION_MESSAGE),

  fullName: z
    .string({ error: StringConstants.PATH_REQUIRED_MESSAGE("fullName") })
    .regex(
      AppRegex.fullNameRegex,
      StringConstants.FULL_NAME_VALIDATION_MESSAGE
    ),

  email: z.email(StringConstants.INVALID_EMAIL_MESSAGE),
  password: (fieldName: string = "password") => {
    return z
      .string({ error: StringConstants.PATH_REQUIRED_MESSAGE(fieldName) })
      .regex(
        AppRegex.passwordRegex,
        StringConstants.PASSWORD_VALIDATION_MESSAGE
      );
  },

  otp: z
    .string({ error: StringConstants.PATH_REQUIRED_MESSAGE("otp") })
    .regex(AppRegex.otpRegex, {
      error: StringConstants.INVALID_OTP_VALIDATION_MESSAGE,
    }),
  confirmPasswordChecker: (
    data: { confirmPassword: string; password: String } & Record<string, any>,
    ctx: z.core.$RefinementCtx
  ) => {
    if (data.confirmPassword !== data.password) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: StringConstants.MISMATCH_CONFIRM_PASSWORD_MESSAGE,
      });
    }
  },

  phoneNumber: z
    .string({ error: StringConstants.PATH_REQUIRED_MESSAGE("phoneNumber") })
    .regex(AppRegex.phoneNumberRegex, {
      error: StringConstants.PHONE_NUMBER_VALIDATION_MESSAGE,
    }),

  token: z
    .string({ error: StringConstants.PATH_REQUIRED_MESSAGE("token") })
    .regex(AppRegex.tokenRegex, {
      error: StringConstants.INVALID_VALIDATION_TOKEN_MESSAGE,
    }),

  bearerWithToken: z
    .string({
      error: StringConstants.PATH_REQUIRED_MESSAGE("token"),
    })
    .regex(AppRegex.bearerWithTokenRegex, {
      error: StringConstants.INVALID_VALIDATION_BEARER_TOKEN_MESSAGE,
    }),

  fileKeys: function ({
    storageApproach = StorageTypesEnum.memory,
    fieldName,
    mimetype,
    maxSize,
  }: {
    storageApproach?: StorageTypesEnum;
    fieldName: string;
    mimetype: string[];
    maxSize: number;
  }) {
    return z
      .strictObject(
        {
          fieldname: z.string(),
          originalname: z.string(),
          encoding: z.string(),
          mimetype: z.string(),
          stream: z.instanceof(Stream.Readable).optional(),
          basePath: z
            .string()
            .optional()
            .refine(
              (value) => {
                if (storageApproach === StorageTypesEnum.disk)
                  return !value ? false : true;

                return true;
              },
              { error: StringConstants.PATH_REQUIRED_MESSAGE("basePath") }
            ),
          finalPath: z
            .string()
            .optional()
            .refine(
              (value) => {
                if (storageApproach === StorageTypesEnum.disk)
                  return !value ? false : true;

                return true;
              },
              { error: StringConstants.PATH_REQUIRED_MESSAGE("finalPath") }
            ),
          destination: z
            .string()
            .optional()
            .refine(
              (value) => {
                if (storageApproach === StorageTypesEnum.disk)
                  return !value ? false : true;

                return true;
              },
              { error: StringConstants.PATH_REQUIRED_MESSAGE("destination") }
            ),
          filename: z
            .string()
            .optional()
            .refine(
              (value) => {
                if (storageApproach === StorageTypesEnum.disk)
                  return !value ? false : true;

                return true;
              },
              { error: StringConstants.PATH_REQUIRED_MESSAGE("filename") }
            ),
          path: z
            .string()
            .optional()
            .refine(
              (value) => {
                if (storageApproach === StorageTypesEnum.disk)
                  return !value ? false : true;

                return true;
              },
              { error: StringConstants.PATH_REQUIRED_MESSAGE("path") }
            ),
          size: z.number().positive().max(maxSize),
          buffer: z
            .instanceof(Buffer)
            .refine((buffer) => buffer.length > 0)
            .optional()
            .refine(
              (value) => {
                if (storageApproach === StorageTypesEnum.memory)
                  return !value ? false : true;

                return true;
              },
              { error: StringConstants.PATH_REQUIRED_MESSAGE("buffer") }
            ),
        },
        { error: StringConstants.PATH_REQUIRED_MESSAGE("image") }
      )
      .superRefine((data, ctx) => {
        if (data.fieldname !== fieldName) {
          ctx.addIssue({
            code: "custom",
            path: [fieldName],
            message: StringConstants.PATH_REQUIRED_MESSAGE(fieldName),
          });
        }
        if (!mimetype.includes(data.mimetype)) {
          ctx.addIssue({
            code: "custom",
            path: [fieldName],
            message: StringConstants.INVALID_FILE_MIMETYPE_MESSAGE(mimetype),
          });
        }
      });
  },
  deviceId: z
    .string({ error: StringConstants.PATH_REQUIRED_MESSAGE("deviceId") })
    .regex(AppRegex.deviceIdRegex, {
      error: "Invalid deviceId, it should be a valid UUID ❌",
    }),
  fcmToken: z
    .string({ error: StringConstants.PATH_REQUIRED_MESSAGE("fcmToken") })
    .regex(AppRegex.fcmTokenRegex, {
      error: "Invalid fcmToken format ❌",
    }),
};

export default generalValidationConstants;
