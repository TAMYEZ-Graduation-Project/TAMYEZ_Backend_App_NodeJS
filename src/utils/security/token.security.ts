import jwt, { type SignOptions } from "jsonwebtoken";
import type { ITokenPayload } from "../constants/interface.constants.ts";
import {
  RolesEnum,
  SignatureLevelsEnum,
  TokenTypesEnum,
} from "../constants/enum.constants.js";
import EnvFields from "../constants/env_fields.constants.ts";
import type { HIUserType } from "../../db/interfaces/user.interface.ts";
import IdSecurityUtil from "./id.security.ts";
import {
  BadRequestException,
  UnauthorizedException,
} from "../exceptions/custom.exceptions.ts";
import UserRepository from "../../db/repositories/user.respository.ts";
import UserModel from "../../db/models/user.model.ts";
import StringConstants from "../constants/strings.constants.ts";

class TokenSecurityUtil {
  private static _userRepository = new UserRepository(UserModel);

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
    return jwt.verify(token, secretKey) as ITokenPayload;
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
  }: {
    signatureLevel: SignatureLevelsEnum;
  }): { accessSignature: string } => {
    switch (signatureLevel) {
      case SignatureLevelsEnum.BearerUser:
        return {
          accessSignature: process.env[EnvFields.ACCESS_BUSER_TOKEN_SIGNATURE]!,
        };

      case SignatureLevelsEnum.BearerSystem:
        return {
          accessSignature:
            process.env[EnvFields.ACCESS_BSYSTEM_TOKEN_SIGNATURE]!,
        };

      case SignatureLevelsEnum.BearerSuperSystem:
        return {
          accessSignature:
            process.env[EnvFields.ACCESS_BSUPERSYSTEM_TOKEN_SIGNATURE]!,
        };
    }
  };

  static getTokensBasedOnRole = ({
    user,
  }: {
    user: HIUserType;
  }): { accessToken: string } => {
    const signatures = this.getSignatures({
      signatureLevel: this.getSignatureLevel({ role: user.role }),
    });
    const jti: string = IdSecurityUtil.generateAlphaNumericId(); // jti = jwtId
    return {
      accessToken: this.generateToken({
        payload: { id: user.id, jti },
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
        StringConstants.MISSING_TOKEN_PARTS_MESSAGE
      );
    }

    if (
      !Object.values(SignatureLevelsEnum).includes(
        bearer as SignatureLevelsEnum
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
        StringConstants.INVALID_TOKEN_PAYLOAD_MESSAGE
      );
    }

    if (
      // await this._revokedTokenRepository.findOne({
      //   filter: { jti: payload.jti! },
      // })
      false
    ) {
      throw new BadRequestException(StringConstants.TOKEN_REVOKED_MESSAGE);
    }

    const user = await this._userRepository.findOne({
      filter: { _id: payload.id, freezed: { $exists: false } },
    });
    if (!user?.confirmedAt) {
      throw new BadRequestException(StringConstants.INVALID_USER_ACCOUNT_MESSAGE);
    }

    if ((user?.changeCredentialsTime?.getTime() || 0) > payload.iat * 1000) {
      throw new BadRequestException(StringConstants.TOKEN_REVOKED_MESSAGE);
    }

    return {
      user,
      payload,
    };
  };
}

export default TokenSecurityUtil;
