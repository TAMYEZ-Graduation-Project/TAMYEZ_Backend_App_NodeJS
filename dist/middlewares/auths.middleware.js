import TokenSecurityUtil from "../utils/security/token.security.js";
import { RolesEnum, TokenTypesEnum, } from "../utils/constants/enum.constants.js";
import { z } from "zod";
import AppRegex from "../utils/constants/regex.constants.js";
import { ForbiddenException, ValidationException, } from "../utils/exceptions/custom.exceptions.js";
import StringConstants from "../utils/constants/strings.constants.js";
class Auths {
    static authenticationMiddleware = ({ tokenType = TokenTypesEnum.accessToken, } = {}) => {
        return async (req, res, next) => {
            const result = await z
                .object({
                authorization: z
                    .string({
                    error: StringConstants.PATH_REQUIRED_MESSAGE("Authorization"),
                })
                    .regex(AppRegex.bearerWithTokenRegex, {
                    error: StringConstants.INVALID_VALIDATION_BEARER_TOKEN_MESSAGE,
                }),
            })
                .safeParseAsync(req.headers);
            if (!result.success) {
                throw new ValidationException(result.error.issues[0]?.message ?? "", result.error.issues.map((issue) => {
                    return {
                        key: "headers",
                        path: issue.path.join("."),
                        message: issue.message,
                    };
                }));
            }
            const { user, payload } = await TokenSecurityUtil.decode({
                authorization: req.headers.authorization,
                tokenType,
            });
            req.user = user;
            req.tokenPayload = payload;
            return next();
        };
    };
    static authorizationMiddleware = ({ accessRoles, }) => {
        return async (req, res, next) => {
            if (!accessRoles.includes(req.user?.role ?? "")) {
                throw new ForbiddenException(StringConstants.NOT_AUTHORIZED_ACCOUNT_MESSAGE);
            }
            return next();
        };
    };
    static combined = ({ tokenType = TokenTypesEnum.accessToken, accessRoles, }) => {
        return [
            this.authenticationMiddleware({ tokenType }),
            this.authorizationMiddleware({ accessRoles }),
        ];
    };
}
export default Auths;
