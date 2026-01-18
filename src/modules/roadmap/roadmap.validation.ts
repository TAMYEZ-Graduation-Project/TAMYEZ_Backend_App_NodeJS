import { z } from "zod";
import StringConstants from "../../utils/constants/strings.constants.ts";
import {
  LanguagesEnum,
  RoadmapStepPricingTypesEnum,
} from "../../utils/constants/enum.constants.ts";
import generalValidationConstants from "../../utils/constants/validation.constants.ts";
import StringFormats from "../../utils/formats/string.formats.ts";

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
}

export default RoadmapValidators;
