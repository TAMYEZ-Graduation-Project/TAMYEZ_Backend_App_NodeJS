import { z } from "zod";
import StringConstants from "../../utils/constants/strings.constants.ts";
import {
  CareerResourceNamesEnum,
  LanguagesEnum,
  RoadmapStepPricingTypesEnum,
} from "../../utils/constants/enum.constants.ts";
import generalValidationConstants from "../../utils/constants/validation.constants.ts";
import StringFormats from "../../utils/formats/string.formats.ts";
import fileValidation from "../../utils/multer/file_validation.multer.ts";
import EnvFields from "../../utils/constants/env_fields.constants.ts";

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
          .array(this.roadmapStepResource.body, {
            error: StringConstants.PATH_REQUIRED_MESSAGE("courses"),
          })
          .min(1)
          .max(5),
        youtubePlaylists: z
          .array(this.roadmapStepResource.body, {
            error: StringConstants.PATH_REQUIRED_MESSAGE("youtubePlaylists"),
          })
          .min(1)
          .max(5),
        books: z
          .array(this.roadmapStepResource.body)
          .max(5)
          .optional()
          .default([]),
        quizzesIds: z
          .array(generalValidationConstants.objectId, {
            error: StringConstants.PATH_REQUIRED_MESSAGE("quizzesIds"),
          })
          .min(1)
          .max(5),
        allowGlobalResources: z.boolean().optional(),
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

        if (new Set(data.quizzesIds).size !== data.quizzesIds.length) {
          ctx.addIssue({
            code: "custom",
            path: ["quizzesIds"],
            message: "Some quiz ids are duplicated ⚠️",
          });
        }
      }),
  };

  static getRoadmap = {
    query: z.strictObject({
      size: z.coerce.number().int().min(2).max(30).optional().default(15),
      page: z.coerce.number().int().min(1).max(300).optional().default(1),
      searchKey: z.string().nonempty().min(1).max(100).optional(),
      belongToCareers: z
        .union([
          z.enum([StringConstants.ALL]),
          generalValidationConstants.objectIdsSeparatedByCommas({
            min: 1,
            max: 2,
          }),
        ])
        .optional(),
      haveQuizzes: generalValidationConstants
        .objectIdsSeparatedByCommas({ min: 1, max: 5 })
        .optional(),
    }),
  };

  static getRoadmapStep = {
    params: z.strictObject({
      roadmapStepId: generalValidationConstants.objectId,
    }),
  };

  static updateRoadmapStep = {
    params: this.getRoadmapStep.params,
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
          .min(1)
          .max(5)
          .optional(),
        books: z.array(this.roadmapStepResource.body).max(5).optional(),
        removeCourses: z
          .array(generalValidationConstants.objectId)
          .min(1)
          .max(5)
          .optional(),
        removeYoutubePlaylists: z
          .array(generalValidationConstants.objectId)
          .min(1)
          .max(5)
          .optional(),
        removeBooks: z
          .array(generalValidationConstants.objectId)
          .min(1)
          .max(5)
          .optional(),
        quizzesIds: z
          .array(generalValidationConstants.objectId)
          .min(1)
          .max(5)
          .optional(),
        removeQuizzesIds: z
          .array(generalValidationConstants.objectId)
          .min(1)
          .max(5)
          .optional(),
        allowGlobalResources: z.boolean().optional(),
        v: generalValidationConstants.v,
      })
      .superRefine((data, ctx) => {
        generalValidationConstants.checkValuesForUpdate(data, ctx);

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
        if (
          data.quizzesIds?.length &&
          new Set(data.quizzesIds).size !== data.quizzesIds.length
        ) {
          ctx.addIssue({
            code: "custom",
            path: ["quizzesIds"],
            message: "Some quiz ids are duplicated ⚠️",
          });
        }
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
            maxSize: Number(
              process.env[EnvFields.CAREER_RESOURCE_PICTURE_SIZE],
            ),
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
        v: generalValidationConstants.v,
      })
      .superRefine((data, ctx) => {
        generalValidationConstants.checkValuesForUpdate(data, ctx);
      }),
  };

  static archiveRoadmapStep = {
    params: this.getRoadmapStep.params,
    body: z.strictObject({
      v: generalValidationConstants.v,
    }),
  };

  static restoreRoadmapStep = {
    params: this.getRoadmapStep.params,
    body: z.strictObject({
      v: generalValidationConstants.v,
      quizId: generalValidationConstants.objectId.optional(),
    }),
  };

  static deleteRoadmapStep = {
    params: this.getRoadmapStep.params,
    body: z.strictObject({
      v: generalValidationConstants.v,
    }),
  };
}

export default RoadmapValidators;
