import type { NextFunction, Request, Response } from "express";
import type {
  RequestKeysType,
  ZodSchemaType,
} from "../utils/types/valdiation_schema.type.ts";
import type { IssueObjectType } from "../utils/types/issue_object.type.ts";
import { ValidationException } from "../utils/exceptions/custom.exceptions.ts";
import StringConstants from "../utils/constants/strings.constants.ts";

const validationMiddleware = ({ schema }: { schema: ZodSchemaType }) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.file) {
      req.body[req.file.fieldname] = req.file;
    }
    if (req.files) {
      if (Array.isArray(req.files) && req.files.length > 0) {
        req.body[req.files[0]!.fieldname] = req.files;
      } else {
        const filesMap = req.files as unknown as Record<string, any>;
        for (const fieldname of Object.keys(filesMap)) {
          req.body[fieldname] = filesMap[fieldname];
        }
      }
    }

    let validationErrorObject: { message: string; details: IssueObjectType[] } =
      {
        message: "",
        details: [],
      };

    for (const key of Object.keys(schema) as RequestKeysType[]) {
      if (!schema[key]) continue;
      const result = await schema[key].safeParseAsync(req[key], {
        error: (issue) => {
          if (issue.code === "invalid_type")
            return StringConstants.REQUEST_KEY_REQUIRED_MESSAGE(key);

          return undefined;
        },
      });
      if (!result.success) {
        validationErrorObject.details.push(
          ...result.error.issues.map((issue): IssueObjectType => {
            validationErrorObject.message =
              validationErrorObject.message.concat(
                !validationErrorObject.message.length
                  ? issue.message
                  : `.\n${issue.message}`
              );
            return {
              key,
              path: issue.path.join("."),
              message: issue.message,
            };
          })
        );
      } else {
        if (!req.validationResult) {
          req.validationResult = {};
        }
        Object.assign(req.validationResult, {
          [key]: result.data,
        });
      }
    }

    if (validationErrorObject.message.length > 0) {
      throw new ValidationException(
        validationErrorObject.message,
        validationErrorObject.details
      );
    }
    return next();
  };
};

export default validationMiddleware;
