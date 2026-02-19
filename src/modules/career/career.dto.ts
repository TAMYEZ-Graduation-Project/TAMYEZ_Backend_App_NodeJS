import { z } from "zod";
import type CareerValidators from "./career.validation.ts";

export type CreateCareerBodyDto = z.infer<
  typeof CareerValidators.createCareer.body
>;

export type GetCareersQueryDto = z.infer<
  typeof CareerValidators.getCareers.query
>;

export type GetCareerParamsDto = z.infer<
  typeof CareerValidators.getCareer.params
>;

export type UploadCareerPictureParamsDto = z.infer<
  typeof CareerValidators.uploadCareerPicture.params
>;

export type UploadCareerPictureBodyDto = z.infer<
  typeof CareerValidators.uploadCareerPicture.body
>;

export type UpdateCareerParamsDto = z.infer<
  typeof CareerValidators.updateCareer.params
>;

export type UpdateCareerBodyDto = z.infer<
  typeof CareerValidators.updateCareer.body
>;

export type UpdateCareerResourceParamsDto = z.infer<
  typeof CareerValidators.updateCareerResource.params
>;

export type UpdateCareerResourceBodyDto = z.infer<
  typeof CareerValidators.updateCareerResource.body
>;

export type ArchiveCareerParamsDto = z.infer<
  typeof CareerValidators.archiveCareer.params
>;

export type ArchiveCareerBodyDto = z.infer<
  typeof CareerValidators.archiveCareer.body
>;

export type RestoreCareerParamsDto = z.infer<
  typeof CareerValidators.restoreCareer.params
>;

export type RestoreCareerBodyDto = z.infer<
  typeof CareerValidators.restoreCareer.body
>;

export type DeleteCareerParamsDto = z.infer<
  typeof CareerValidators.deleteCareer.params
>;

export type DeleteCareerBodyDto = z.infer<
  typeof CareerValidators.deleteCareer.body
>;
