import jwt, {} from "jsonwebtoken";
import { RolesEnum, SignatureLevelsEnum, TokenTypesEnum, } from "../constants/enum.constants.js";
import EnvFields from "../constants/env_fields.constants.js";
import IdSecurityUtil from "./id.security.js";
import { BadRequestException, UnauthorizedException, } from "../exceptions/custom.exceptions.js";
import UserRepository from "../../db/repositories/user.respository.js";
import UserModel from "../../db/models/user.model.js";
import StringConstants from "../constants/strings.constants.js";
class TokenSecurityUtil {
    static _userRepository = new UserRepository(UserModel);
    static generateToken = ({ payload, secretKey, options = {
        expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
    }, }) => {
        return jwt.sign(payload, secretKey, options);
    };
    static verifyToken = ({ token, secretKey, }) => {
        return jwt.verify(token, secretKey);
    };
    static getSignatureLevel = ({ role, }) => {
        switch (role) {
            case RolesEnum.user:
                return SignatureLevelsEnum.BearerUser;
            case RolesEnum.admin:
                return SignatureLevelsEnum.BearerSystem;
            case RolesEnum.superAdmin:
                return SignatureLevelsEnum.BearerSuperSystem;
        }
    };
    static getSignatures = ({ signatureLevel, }) => {
        switch (signatureLevel) {
            case SignatureLevelsEnum.BearerUser:
                return {
                    accessSignature: process.env[EnvFields.ACCESS_BUSER_TOKEN_SIGNATURE],
                };
            case SignatureLevelsEnum.BearerSystem:
                return {
                    accessSignature: process.env[EnvFields.ACCESS_BSYSTEM_TOKEN_SIGNATURE],
                };
            case SignatureLevelsEnum.BearerSuperSystem:
                return {
                    accessSignature: process.env[EnvFields.ACCESS_BSUPERSYSTEM_TOKEN_SIGNATURE],
                };
        }
    };
    static getTokensBasedOnRole = ({ user, }) => {
        const signatures = this.getSignatures({
            signatureLevel: this.getSignatureLevel({ role: user.role }),
        });
        const jti = IdSecurityUtil.generateAlphaNumericId();
        return {
            accessToken: this.generateToken({
                payload: { id: user.id, jti },
                secretKey: signatures.accessSignature,
            }),
        };
    };
    static decode = async ({ authorization, tokenType = TokenTypesEnum.accessToken, }) => {
        const [bearer, token] = authorization.split(" ");
        if (!bearer || !token) {
            throw new UnauthorizedException(StringConstants.MISSING_TOKEN_PARTS_MESSAGE);
        }
        if (!Object.values(SignatureLevelsEnum).includes(bearer)) {
            throw new BadRequestException(StringConstants.INVALID_BEARER_KEY_MESSAGE);
        }
        const signatures = this.getSignatures({
            signatureLevel: bearer,
        });
        const payload = this.verifyToken({
            token,
            secretKey: tokenType === TokenTypesEnum.accessToken
                ? signatures.accessSignature
                : "",
        });
        if (!payload.id || !payload.iat || !payload.jti) {
            throw new BadRequestException(StringConstants.INVALID_TOKEN_PAYLOAD_MESSAGE);
        }
        if (false) {
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
