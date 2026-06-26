import { z } from "zod";
import StringConstants from "../utils/constants/strings.constants.ts";
import AppRegex from "../utils/constants/regex.constants.ts";
import { FileDownloadValuesEnum } from "../utils/constants/enum.constants.ts";

class UploadsValidators {
  static getFileFromSubKey = {
    params: z.strictObject({
      path: z
        .array(
          z.string({ error: StringConstants.PATH_REQUIRED_MESSAGE("path") })
        )
        .refine(
          (data) => {     
                   
            return AppRegex.getFileWithUrlRegex.test(data.join("/"));
          },
          { error: StringConstants.INVALID_FILE_PATH_MESSAGE }
        ),
    }),
    query: z.strictObject({
      download: z
        .enum(Object.values(FileDownloadValuesEnum), {
          error: StringConstants.INVALID_ENUM_VALUE_MESSAGE({
            enumValueName: "download value",
            theEnum: FileDownloadValuesEnum,
          }),
        })
        .optional(),
      downloadName: z.string().min(3).max(50).optional(),
    }),
  };
}

export default UploadsValidators;
