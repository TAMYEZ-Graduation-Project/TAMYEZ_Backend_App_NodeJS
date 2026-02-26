import { z } from "zod";
import { CareerResourceAppliesToEnum, CareerResourceNamesEnum, } from "../../utils/constants/enum.constants.js";
import generalValidationConstants from "../../utils/constants/validation.constants.js";
import StringConstants from "../../utils/constants/strings.constants.js";
import AppRegex from "../../utils/constants/regex.constants.js";
import fileValidation from "../../utils/multer/file_validation.multer.js";
import EnvFields from "../../utils/constants/env_fields.constants.js";
import { RoadmapValidators } from "../roadmap/index.js";
import { QuizValidators } from "../quiz/index.js";
class CareerValidators {
    static careerResource = {
        body: RoadmapValidators.roadmapStepResource.body
            .extend({
            appliesTo: z
                .enum(CareerResourceAppliesToEnum)
                .default(CareerResourceAppliesToEnum.all),
            specifiedSteps: z
                .array(generalValidationConstants.objectId)
                .default([])
                .optional(),
        })
            .superRefine((data, ctx) => {
            if (data.appliesTo == CareerResourceAppliesToEnum.specific &&
                (!data.specifiedSteps?.length || !(data.specifiedSteps.length > 1))) {
                ctx.addIssue({
                    code: "custom",
                    path: ["specifiedSteps"],
                    message: "specifiedSteps are missing or less then 2 ❌",
                });
            }
            else if (data.appliesTo == CareerResourceAppliesToEnum.all &&
                data.specifiedSteps?.length) {
                ctx.addIssue({
                    code: "custom",
                    path: ["specifiedSteps"],
                    message: "specifiedSteps can have values when appliesTo equals All ❌",
                });
            }
        }),
    };
    static createCareer = {
        body: z
            .strictObject({
            title: z
                .string()
                .regex(AppRegex.careerTitleRegex, {
                error: "Career title must follow this format: [Domain Words] [Role Type] (Optional Focus), e.g., Mobile Developer (iOS) or Data Scientist (NLP).",
            })
                .min(3)
                .max(100),
            description: z.string().min(5).max(10_000),
            summary: z.string().min(5).max(150),
            courses: z
                .array(RoadmapValidators.roadmapStepResource.body)
                .max(5)
                .optional()
                .default([]),
            youtubePlaylists: z
                .array(RoadmapValidators.roadmapStepResource.body)
                .max(5)
                .optional()
                .default([]),
            books: z
                .array(RoadmapValidators.roadmapStepResource.body)
                .max(5)
                .optional()
                .default([]),
        })
            .superRefine((data, ctx) => {
            generalValidationConstants.checkCoureseUrls({
                data: { courses: data.courses },
                ctx,
            });
            generalValidationConstants.checkYoutubePlaylistsUrls({
                data: { youtubePlaylists: data.youtubePlaylists },
                ctx,
            });
            generalValidationConstants.checkBooksUrls({
                data: { books: data.books },
                ctx,
            });
            generalValidationConstants.checkDuplicateCourses({
                data: { courses: data.courses },
                ctx,
            });
            generalValidationConstants.checkDuplicateYoutubePlaylists({
                data: { youtubePlaylists: data.youtubePlaylists },
                ctx,
            });
            generalValidationConstants.checkDuplicateBooks({
                data: { books: data.books },
                ctx,
            });
        }),
    };
    static uploadCareerPicture = {
        params: z.strictObject({
            careerId: generalValidationConstants.objectId,
        }),
        body: z.strictObject({
            attachment: generalValidationConstants.fileKeys({
                fieldName: StringConstants.ATTACHMENT_FIELD_NAME,
                maxSize: Number(process.env[EnvFields.CAREER_PICTURE_SIZE]),
                mimetype: fileValidation.image,
            }),
            v: generalValidationConstants.v,
        }),
    };
    static getCareers = {
        query: z.strictObject({
            size: z.coerce.number().int().min(2).max(30).optional().default(15),
            page: z.coerce.number().int().min(1).max(300).optional().default(1),
            searchKey: z.string().nonempty().min(1).optional(),
        }),
    };
    static getCareer = {
        params: this.uploadCareerPicture.params,
    };
    static checkCareerAssessment = QuizValidators.checkQuizAnswers;
    static chooseSuggestedCareer = {
        params: this.uploadCareerPicture.params,
    };
    static updateCareer = {
        params: this.uploadCareerPicture.params,
        body: z
            .strictObject({
            title: z
                .string()
                .regex(AppRegex.careerTitleRegex, {
                error: "Career title must follow this format: [Domain Words] [Role Type] (Optional Focus), e.g., Mobile Developer (iOS) or Data Scientist (NLP).",
            })
                .min(3)
                .max(100)
                .optional(),
            description: z.string().min(5).max(10_000).optional(),
            courses: z.array(this.careerResource.body).max(5).optional(),
            youtubePlaylists: z.array(this.careerResource.body).max(5).optional(),
            books: z.array(this.careerResource.body).max(5).optional(),
            removeCourses: z
                .array(generalValidationConstants.objectId)
                .max(5)
                .optional(),
            removeYoutubePlaylists: z
                .array(generalValidationConstants.objectId)
                .max(5)
                .optional(),
            removeBooks: z
                .array(generalValidationConstants.objectId)
                .max(5)
                .optional(),
            v: generalValidationConstants.v,
        })
            .superRefine((data, ctx) => {
            generalValidationConstants.checkValuesForUpdate(data, ctx);
            generalValidationConstants.checkCoureseUrls({
                data: { courses: data.courses },
                ctx,
            });
            generalValidationConstants.checkYoutubePlaylistsUrls({
                data: { youtubePlaylists: data.youtubePlaylists },
                ctx,
            });
            generalValidationConstants.checkBooksUrls({
                data: { books: data.books },
                ctx,
            });
            generalValidationConstants.checkDuplicateCourses({
                data: { courses: data.courses },
                ctx,
            });
            generalValidationConstants.checkDuplicateYoutubePlaylists({
                data: { youtubePlaylists: data.youtubePlaylists },
                ctx,
            });
            generalValidationConstants.checkDuplicateBooks({
                data: { books: data.books },
                ctx,
            });
        }),
    };
    static updateCareerResource = {
        params: this.uploadCareerPicture.params.extend({
            resourceName: z.enum(Object.values(CareerResourceNamesEnum)),
            resourceId: generalValidationConstants.objectId,
        }),
        body: RoadmapValidators.updateRoadmapStepResource.body
            .safeExtend({
            appliesTo: z.enum(CareerResourceAppliesToEnum).optional(),
            specifiedSteps: z.array(generalValidationConstants.objectId).optional(),
        })
            .superRefine((data, ctx) => {
            if (data.appliesTo == CareerResourceAppliesToEnum.specific &&
                (!data.specifiedSteps?.length || !(data.specifiedSteps.length > 1))) {
                ctx.addIssue({
                    code: "custom",
                    path: ["specifiedSteps"],
                    message: "specifiedSteps are missing or less then 2 ❌",
                });
            }
            else if (data.appliesTo == CareerResourceAppliesToEnum.all) {
                if (data.specifiedSteps?.length) {
                    ctx.addIssue({
                        code: "custom",
                        path: ["specifiedSteps"],
                        message: "specifiedSteps can have values when appliesTo equals All ❌",
                    });
                }
                data.specifiedSteps = [];
            }
        }),
    };
    static archiveCareer = {
        params: this.uploadCareerPicture.params,
        body: z.strictObject({
            v: generalValidationConstants.v,
            confirmFreezing: z.coerce.boolean().default(false).optional(),
        }),
    };
    static restoreCareer = {
        params: this.uploadCareerPicture.params,
        body: z.strictObject({
            v: generalValidationConstants.v,
        }),
    };
    static deleteCareer = {
        params: this.uploadCareerPicture.params,
        body: z.strictObject({
            v: generalValidationConstants.v,
        }),
    };
}
export default CareerValidators;
