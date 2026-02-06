import { z } from "zod";
import type UserValidators from "./user.validation.ts";

export type GetUsersQueryDtoType = z.infer<
  typeof UserValidators.getUsers.query
>;

export type GetProfileParamsDtoType = z.infer<
  typeof UserValidators.getProfile.params
>;

export type UploadProfilePictureBodyDtoType = z.infer<
  typeof UserValidators.uploadProfilePicture.body
>;

export type UpdateProfileBodyDtoType = z.infer<
  typeof UserValidators.updateProfile.body
>;

export type ChangePasswordBodyDtoType = z.infer<
  typeof UserValidators.changePassword.body
>;

export type LogoutBodyDtoType = z.infer<typeof UserValidators.logout.body>;

export type ChangeRoleParamsDtoType = z.infer<
  typeof UserValidators.changeRole.params
>;

export type ChangeRoleBodyDtoType = z.infer<
  typeof UserValidators.changeRole.body
>;

export type ArchiveAccountParamsDtoType = z.infer<
  typeof UserValidators.archiveAccount.params
>;

export type ArchiveAccountBodyDtoType = z.infer<
  typeof UserValidators.archiveAccount.body
>;

export type RestoreAccountParamsDtoType = z.infer<
  typeof UserValidators.restoreAccount.params
>;

export type RestoreAccountBodyDtoType = z.infer<
  typeof UserValidators.restoreAccount.body
>;

export type DeleteAccountParamsDtoType = z.infer<
  typeof UserValidators.deleteAccount.params
>;

export type DeleteAccountBodyDtoType = z.infer<
  typeof UserValidators.deleteAccount.body
>;

export type SubmitFeedbackBodyDtoType = z.infer<
  typeof UserValidators.submitFeedback.body
>;

