import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import type { ITokenPayload } from "../constants/interface.constants.ts";
import {
  ApplicationTypeEnum,
  LogoutFlagsEnum,
  RolesEnum,
  SignatureLevelsEnum,
  TokenTypesEnum,
} from "../constants/enum.constants.js";
import EnvFields from "../constants/env_fields.constants.ts";
import type { HIUserType } from "../../db/interfaces/user.interface.ts";
import IdSecurityUtil from "./id.security.ts";
import {
  BadRequestException,
  ServerException,
  UnauthorizedException,
} from "../exceptions/custom.exceptions.ts";
import {
  RevokedTokenRepository,
  UserRepository,
} from "../../db/repositories/index.ts";
import { RevokedTokenModel, UserModel } from "../../db/models/index.ts";
import StringConstants from "../constants/strings.constants.ts";
import type { Types } from "mongoose";

class TokenSecurityUtil {
  private static _userRepository = new UserRepository(UserModel);
  private static _revokedTokenRepository = new RevokedTokenRepository(
    RevokedTokenModel,
  );

  static generateToken = ({
    payload,
    secretKey,
    options = {
      expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
    },
  }: {
    payload: ITokenPayload;
    secretKey: string;
    options?: SignOptions;
  }): string => {
    return jwt.sign(payload, secretKey, options);
  };

  static verifyToken = ({
    token,
    secretKey,
  }: {
    token: string;
    secretKey: string;
  }): ITokenPayload => {
    try {
      return jwt.verify(token, secretKey) as ITokenPayload;
    } catch (e: any) {
      throw new BadRequestException(e.message || "Invalid token ❌");
    }
  };

  static getSignatureLevel = ({
    role,
  }: {
    role: RolesEnum;
  }): SignatureLevelsEnum => {
    switch (role) {
      case RolesEnum.user:
        return SignatureLevelsEnum.BearerUser;

      case RolesEnum.admin:
        return SignatureLevelsEnum.BearerSystem;

      case RolesEnum.superAdmin:
        return SignatureLevelsEnum.BearerSuperSystem;
    }
  };

  static getSignatures = ({
    signatureLevel,
    userRole,
  }: {
    signatureLevel?: SignatureLevelsEnum;
    userRole?: RolesEnum;
  }): { accessSignature: string } => {
    if ((!signatureLevel && !userRole) || (signatureLevel && userRole)) {
      throw new ServerException(
        "Either signatureLever or userRole should be only provided ⚠️",
      );
    }

    if (
      signatureLevel == SignatureLevelsEnum.BearerUser ||
      userRole == RolesEnum.user
    ) {
      return {
        accessSignature: process.env[EnvFields.ACCESS_BUSER_TOKEN_SIGNATURE]!,
      };
    } else if (
      signatureLevel == SignatureLevelsEnum.BearerSystem ||
      userRole == RolesEnum.admin
    ) {
      return {
        accessSignature: process.env[EnvFields.ACCESS_BSYSTEM_TOKEN_SIGNATURE]!,
      };
    } else if (
      signatureLevel == SignatureLevelsEnum.BearerSuperSystem ||
      userRole == RolesEnum.superAdmin
    ) {
      return {
        accessSignature:
          process.env[EnvFields.ACCESS_BSUPERSYSTEM_TOKEN_SIGNATURE]!,
      };
    }
    throw new ServerException("No matching signature is a available ❌");
  };

  static getTokensBasedOnRole = ({
    user,
    applicationType,
  }: {
    user: HIUserType;
    applicationType: ApplicationTypeEnum;
  }): { accessToken: string } => {
    const signatures = this.getSignatures({
      signatureLevel: this.getSignatureLevel({ role: user.role }),
    });
    const jti: string = IdSecurityUtil.generateAlphaNumericId(); // jti = jwtId
    return {
      accessToken: this.generateToken({
        payload: { id: user.id, jti, applicationType },
        secretKey: signatures.accessSignature,
      }),
    };
  };

  static decode = async ({
    authorization,
    tokenType = TokenTypesEnum.accessToken,
  }: {
    authorization: string;
    tokenType?: TokenTypesEnum;
  }): Promise<{ user: HIUserType; payload: ITokenPayload }> => {
    const [bearer, token] = authorization.split(" ");
    if (!bearer || !token) {
      throw new UnauthorizedException(
        StringConstants.MISSING_TOKEN_PARTS_MESSAGE,
      );
    }

    if (
      !Object.values(SignatureLevelsEnum).includes(
        bearer as SignatureLevelsEnum,
      )
    ) {
      throw new BadRequestException(StringConstants.INVALID_BEARER_KEY_MESSAGE);
    }

    const signatures = this.getSignatures({
      signatureLevel: bearer as SignatureLevelsEnum,
    });

    const payload = this.verifyToken({
      token,
      secretKey:
        tokenType === TokenTypesEnum.accessToken
          ? signatures.accessSignature
          : "",
    });
    if (!payload.id || !payload.iat || !payload.jti) {
      throw new BadRequestException(
        StringConstants.INVALID_TOKEN_PAYLOAD_MESSAGE,
      );
    }

    if (
      await this._revokedTokenRepository.findOne({
        filter: { jti: payload.jti! },
      })
    ) {
      throw new BadRequestException(StringConstants.TOKEN_REVOKED_MESSAGE);
    }

    const user = await this._userRepository.findOne({
      filter: { _id: payload.id, freezed: { $exists: false } },
    });
    if (!user?.confirmedAt) {
      throw new BadRequestException(
        StringConstants.INVALID_USER_ACCOUNT_MESSAGE,
      );
    }

    if ((user?.changeCredentialsTime?.getTime() || 0) > payload.iat * 1000) {
      throw new BadRequestException(StringConstants.TOKEN_REVOKED_MESSAGE);
    }

    return {
      user,
      payload,
    };
  };

  static revoke = async ({
    flag = LogoutFlagsEnum.one,
    userId,
    tokenPayload,
  }: {
    flag?: LogoutFlagsEnum;
    userId: Types.ObjectId;
    tokenPayload: JwtPayload;
  }): Promise<number> => {
    let statusCode = 200;
    switch (flag) {
      case LogoutFlagsEnum.all:
        await this._userRepository
          .updateOne({
            filter: { _id: userId, __v: undefined },
            update: {
              changeCredentialsTime: Date.now(),
            },
          })
          .catch((err) => {
            throw new ServerException(
              StringConstants.FAILED_REVOKE_TOKEN_MESSAGE,
            );
          });
        break;
      case LogoutFlagsEnum.one:
        await this._revokedTokenRepository
          .create({
            data: [
              {
                jti: tokenPayload.jti!,
                expiresAt: new Date(
                  (tokenPayload.iat! +
                    Number(process.env[EnvFields.ACCESS_TOKEN_EXPIRES_IN])) *
                    1000,
                ),
                userId,
              },
            ],
          })
          .catch((err) => {
            throw new ServerException(
              StringConstants.FAILED_REVOKE_TOKEN_MESSAGE,
            );
          });
        statusCode = 201;
        break;

      default:
        break;
    }
    return statusCode;
  };

  static getTokenExpiresAt = ({
    userRole,
    token,
    tokenType = TokenTypesEnum.accessToken,
  }: {
    userRole: RolesEnum;
    token: string;
    tokenType?: TokenTypesEnum;
  }): number => {
    const signatures = this.getSignatures({
      userRole,
    });

    const payload = this.verifyToken({
      token,
      secretKey:
        tokenType === TokenTypesEnum.accessToken
          ? signatures.accessSignature
          : "",
    });
    if (!payload.id || !payload.iat || !payload.jti || !payload.exp) {
      throw new BadRequestException(
        StringConstants.INVALID_TOKEN_PAYLOAD_MESSAGE,
      );
    }

    return payload.exp;
  };
}

export default TokenSecurityUtil;
