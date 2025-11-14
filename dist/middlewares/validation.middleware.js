import { ValidationException } from "../utils/exceptions/custom.exceptions.js";
import StringConstants from "../utils/constants/strings.constants.js";
const validationMiddleware = ({ schema }) => {
    return async (req, res, next) => {
        let validationErrorObject = {
            message: "",
            details: [],
        };
        for (const key of Object.keys(schema)) {
            if (!schema[key])
                continue;
            const result = await schema[key].safeParseAsync(req[key], {
                error: (issue) => {
                    if (issue.code === "invalid_type")
                        return StringConstants.REQUEST_KEY_REQUIRED_MESSAGE(key);
                    return undefined;
                },
            });
            if (!result.success) {
                validationErrorObject.details.push(...result.error.issues.map((issue) => {
                    validationErrorObject.message =
                        validationErrorObject.message.concat(!validationErrorObject.message.length
                            ? issue.message
                            : `.\n${issue.message}`);
                    return {
                        key,
                        path: issue.path.join(","),
                        message: issue.message,
                    };
                }));
            }
            else {
                if (!req.validationResult) {
                    req.validationResult = {};
                }
                Object.assign(req.validationResult, {
                    [key]: result.data,
                });
            }
        }
        if (validationErrorObject.message.length > 0) {
            throw new ValidationException(validationErrorObject.message, validationErrorObject.details);
        }
        return next();
    };
};
export default validationMiddleware;
