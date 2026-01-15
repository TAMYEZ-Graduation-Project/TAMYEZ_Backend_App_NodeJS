import { z } from "zod";
import StringConstants from "../../utils/constants/strings.constants.ts";
import {
  LanguagesEnum,
  RoadmapStepPricingTypesEnum,
} from "../../utils/constants/enum.constants.ts";
import generalValidationConstants from "../../utils/constants/validation.constants.ts";

class RoadmapValidators {
  static roadmapStepResource = {
    body: z.strictObject({
      title: z
        .string({ error: StringConstants.PATH_REQUIRED_MESSAGE("title") })
        .min(3)
        .max(300),
      url: z.url(),
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
