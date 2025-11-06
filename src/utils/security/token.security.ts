import { sign, verify, type SignOptions } from "jsonwebtoken";
import type { ITokenPayload } from "../constants/interface.constants.ts";

class TokenSecurityUtil {
  static generateToken = ({
    payload,
    secretKey,
    options = {
      expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
    },
  }: {
    payload: ITokenPayload;
    secretKey: string;
    options: SignOptions;
  }): string => {
    return sign(payload, secretKey, options);
  };

  static verifyToken = ({
    token,
    secretKey,
  }: {
    token: string;
    secretKey: string;
  }): ITokenPayload => {
    return verify(token, secretKey) as ITokenPayload;
  };
}

export default TokenSecurityUtil;
