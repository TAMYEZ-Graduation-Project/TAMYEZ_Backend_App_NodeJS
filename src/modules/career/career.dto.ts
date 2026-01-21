import { z } from "zod";
import type CareerValidators from "./career.validation.ts";

export type CreateCareerBodyDto = z.infer<
  typeof CareerValidators.createCareer.body
>;

export type GetCareersQueryDto = z.infer<
  typeof CareerValidators.getCareers.query
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
