import type { NextFunction, Request, Response } from "express";
import TokenSecurityUtil from "../utils/security/token.security.ts";
import {
  ApplicationTypeEnum,
  RolesEnum,
  TokenTypesEnum,
} from "../utils/constants/enum.constants.js";
import { z } from "zod";
import AppRegex from "../utils/constants/regex.constants.ts";
import {
  ForbiddenException,
  ValidationException,
} from "../utils/exceptions/custom.exceptions.ts";
import StringConstants from "../utils/constants/strings.constants.ts";

class Auths {
  static authenticationMiddleware = ({
    tokenType = TokenTypesEnum.accessToken,
    isOptional = false,
  }: { tokenType?: TokenTypesEnum; isOptional?: boolean } = {}) => {
    return async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      if (isOptional && !req.headers.authorization) return next();
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
        throw new ValidationException(
          result.error.issues[0]?.message ?? "",
          result.error.issues.map((issue) => {
            return {
              key: "headers",
              path: issue.path.join("."),
              message: issue.message,
            };
          }),
        );
      }

      const { user, payload } = await TokenSecurityUtil.decode({
        authorization: req.headers.authorization!,
        tokenType,
      });
      req.user = user;
      req.tokenPayload = payload;
      return next();
    };
  };

  static authorizationMiddleware = ({
    accessRoles,
  }: {
    accessRoles: RolesEnum[];
  }) => {
    return async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      if (!accessRoles.includes(req.user?.role ?? ("" as RolesEnum))) {
        throw new ForbiddenException(
          StringConstants.NOT_AUTHORIZED_ACCOUNT_MESSAGE,
        );
      }
      return next();
    };
  };

  static gatewayMiddleware = ({
    applicationType,
  }: {
    applicationType: ApplicationTypeEnum;
  }) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (req.tokenPayload?.applicationType !== applicationType) {
        throw new ForbiddenException(
          StringConstants.INVALID_LOGIN_GATEWAY_MESSAGE,
        );
      }

      return next();
    };
  };

  static combined = ({
    tokenType = TokenTypesEnum.accessToken,
    accessRoles,
  }: {
    tokenType?: TokenTypesEnum;
    accessRoles: RolesEnum[];
  }) => {
    return [
      this.authenticationMiddleware({ tokenType }),
      this.authorizationMiddleware({ accessRoles }),
    ];
  };

  static combinedWithGateway = ({
    tokenType = TokenTypesEnum.accessToken,
    accessRoles,
    applicationType,
  }: {
    tokenType?: TokenTypesEnum;
    accessRoles: RolesEnum[];
    applicationType: ApplicationTypeEnum;
  }) => {
    return [
      this.authenticationMiddleware({ tokenType }),
      this.authorizationMiddleware({ accessRoles }),
      this.gatewayMiddleware({ applicationType }),
    ];
  };

  static authenticationWithGateway = ({
    tokenType = TokenTypesEnum.accessToken,
    applicationType,
  }: {
    tokenType?: TokenTypesEnum;
    applicationType: ApplicationTypeEnum;
  }) => {
    return [
      this.authenticationMiddleware({ tokenType }),
      this.gatewayMiddleware({ applicationType }),
    ];
  };
}

export default Auths;
