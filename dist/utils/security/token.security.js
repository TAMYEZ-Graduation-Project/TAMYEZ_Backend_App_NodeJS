import jwt, {} from "jsonwebtoken";
import { ApplicationTypeEnum, LogoutFlagsEnum, RolesEnum, SignatureLevelsEnum, TokenTypesEnum, } from "../constants/enum.constants.js";
import EnvFields from "../constants/env_fields.constants.js";
import IdSecurityUtil from "./id.security.js";
import { BadRequestException, ServerException, UnauthorizedException, } from "../exceptions/custom.exceptions.js";
import { RevokedTokenRepository, UserRepository, } from "../../db/repositories/index.js";
import { RevokedTokenModel, UserModel } from "../../db/models/index.js";
import StringConstants from "../constants/strings.constants.js";
class TokenSecurityUtil {
    static _userRepository = new UserRepository(UserModel);
    static _revokedTokenRepository = new RevokedTokenRepository(RevokedTokenModel);
    static generateToken = ({ payload, secretKey, options = {
        expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
    }, }) => {
        return jwt.sign(payload, secretKey, options);
    };
    static verifyToken = ({ token, secretKey, }) => {
        try {
            return jwt.verify(token, secretKey);
        }
        catch (e) {
            throw new BadRequestException(e.message || "Invalid token ❌");
        }
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
    static getSignatures = ({ signatureLevel, userRole, }) => {
        if ((!signatureLevel && !userRole) || (signatureLevel && userRole)) {
            throw new ServerException("Either signatureLever or userRole should be only provided ⚠️");
        }
        if (signatureLevel == SignatureLevelsEnum.BearerUser ||
            userRole == RolesEnum.user) {
            return {
                accessSignature: process.env[EnvFields.ACCESS_BUSER_TOKEN_SIGNATURE],
            };
        }
        else if (signatureLevel == SignatureLevelsEnum.BearerSystem ||
            userRole == RolesEnum.admin) {
            return {
                accessSignature: process.env[EnvFields.ACCESS_BSYSTEM_TOKEN_SIGNATURE],
            };
        }
        else if (signatureLevel == SignatureLevelsEnum.BearerSuperSystem ||
            userRole == RolesEnum.superAdmin) {
            return {
                accessSignature: process.env[EnvFields.ACCESS_BSUPERSYSTEM_TOKEN_SIGNATURE],
            };
        }
        throw new ServerException("No matching signature is a available ❌");
    };
    static getTokensBasedOnRole = ({ user, applicationType, }) => {
        const signatures = this.getSignatures({
            signatureLevel: this.getSignatureLevel({ role: user.role }),
        });
        const jti = IdSecurityUtil.generateAlphaNumericId();
        return {
            accessToken: this.generateToken({
                payload: { id: user.id, jti, applicationType },
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
        if (!payload.id ||
            !payload.iat ||
            !payload.jti ||
            !payload.applicationType) {
            throw new BadRequestException(StringConstants.INVALID_TOKEN_PAYLOAD_MESSAGE);
        }
        if (await this._revokedTokenRepository.findOne({
            filter: { jti: payload.jti },
        })) {
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
    static revoke = async ({ flag = LogoutFlagsEnum.one, userId, tokenPayload, }) => {
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
                    throw new ServerException(StringConstants.FAILED_REVOKE_TOKEN_MESSAGE);
                });
                break;
            case LogoutFlagsEnum.one:
                await this._revokedTokenRepository
                    .create({
                    data: [
                        {
                            jti: tokenPayload.jti,
                            expiresAt: new Date((tokenPayload.iat +
                                Number(process.env[EnvFields.ACCESS_TOKEN_EXPIRES_IN])) *
                                1000),
                            userId,
                        },
                    ],
                })
                    .catch((err) => {
                    throw new ServerException(StringConstants.FAILED_REVOKE_TOKEN_MESSAGE);
                });
                statusCode = 201;
                break;
            default:
                break;
        }
        return statusCode;
    };
    static getTokenExpiresAt = ({ userRole, token, tokenType = TokenTypesEnum.accessToken, }) => {
        const signatures = this.getSignatures({
            userRole,
        });
        const payload = this.verifyToken({
            token,
            secretKey: tokenType === TokenTypesEnum.accessToken
                ? signatures.accessSignature
                : "",
        });
        if (!payload.id || !payload.iat || !payload.jti || !payload.exp) {
            throw new BadRequestException(StringConstants.INVALID_TOKEN_PAYLOAD_MESSAGE);
        }
        return payload.exp;
    };
}
export default TokenSecurityUtil;
