import { z } from "zod";
import StringConstants from "../../utils/constants/strings.constants.js";
import { CareerResourceNamesEnum, LanguagesEnum, RoadmapStepPricingTypesEnum, } from "../../utils/constants/enum.constants.js";
import generalValidationConstants from "../../utils/constants/validation.constants.js";
import StringFormats from "../../utils/formats/string.formats.js";
import fileValidation from "../../utils/multer/file_validation.multer.js";
import EnvFields from "../../utils/constants/env_fields.constants.js";
class RoadmapValidators {
    static roadmapStepResource = {
        body: z.strictObject({
            title: z
                .string({ error: StringConstants.PATH_REQUIRED_MESSAGE("title") })
                .min(3)
                .max(100),
            url: z.url().min(5),
            pricingType: z.enum(RoadmapStepPricingTypesEnum),
            language: z.enum(LanguagesEnum),
        }),
    };
    static createRoadmapStep = {
        body: z
            .strictObject({
            careerId: generalValidationConstants.objectId,
            title: z
                .string({ error: StringConstants.PATH_REQUIRED_MESSAGE("title") })
                .min(3)
                .max(100),
            order: z
                .number({ error: StringConstants.PATH_REQUIRED_MESSAGE("order") })
                .int()
                .min(1)
                .max(500)
                .optional(),
            description: z
                .string({
                error: StringConstants.PATH_REQUIRED_MESSAGE("description"),
            })
                .min(5)
                .max(10_000),
            courses: z
                .array(this.roadmapStepResource.body)
                .max(5)
                .optional()
                .default([]),
            youtubePlaylists: z
                .array(this.roadmapStepResource.body)
                .max(5)
                .optional()
                .default([]),
            books: z
                .array(this.roadmapStepResource.body)
                .max(5)
                .optional()
                .default([]),
        })
            .superRefine((data, ctx) => {
            data.title = StringFormats.normalizeStepTitle(data.title);
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
    static updateRoadmapStep = {
        params: z.strictObject({
            roadmapStepId: generalValidationConstants.objectId,
        }),
        body: z
            .strictObject({
            title: z
                .string({ error: StringConstants.PATH_REQUIRED_MESSAGE("title") })
                .min(3)
                .max(100)
                .optional(),
            order: z
                .number({ error: StringConstants.PATH_REQUIRED_MESSAGE("order") })
                .int()
                .min(1)
                .max(500)
                .optional(),
            description: z
                .string({
                error: StringConstants.PATH_REQUIRED_MESSAGE("description"),
            })
                .min(5)
                .max(10_000)
                .optional(),
            courses: z.array(this.roadmapStepResource.body).max(5).optional(),
            youtubePlaylists: z
                .array(this.roadmapStepResource.body)
                .max(5)
                .optional(),
            books: z.array(this.roadmapStepResource.body).max(5).optional(),
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
        })
            .superRefine((data, ctx) => {
            if (!Object.values(data).length) {
                ctx.addIssue({
                    code: "custom",
                    path: [""],
                    message: "All fields are empty ⚠️",
                });
            }
            if (data.title)
                data.title = StringFormats.normalizeStepTitle(data.title);
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
    static updateRoadmapStepResource = {
        params: this.updateRoadmapStep.params.extend({
            resourceName: z.enum(Object.values(CareerResourceNamesEnum)),
            resourceId: generalValidationConstants.objectId,
        }),
        body: z
            .strictObject({
            attachment: generalValidationConstants
                .fileKeys({
                fieldName: StringConstants.ATTACHMENT_FIELD_NAME,
                maxSize: Number(process.env[EnvFields.CAREER_RESOURCE_PICTURE_SIZE]),
                mimetype: fileValidation.image,
            })
                .optional(),
            title: z
                .string({ error: StringConstants.PATH_REQUIRED_MESSAGE("title") })
                .min(3)
                .max(100)
                .optional(),
            url: z.url().min(5).optional(),
            pricingType: z.enum(RoadmapStepPricingTypesEnum).optional(),
            language: z.enum(LanguagesEnum).optional(),
        })
            .superRefine((data, ctx) => {
            if (!Object.values(data).length) {
                ctx.addIssue({
                    code: "custom",
                    path: [""],
                    message: "All fields are empty ⚠️",
                });
            }
        }),
    };
}
export default RoadmapValidators;
