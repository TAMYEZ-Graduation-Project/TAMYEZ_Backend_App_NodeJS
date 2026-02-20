import { ErrorCodesEnum } from "../constants/enum.constants.js";
export class ApplicationException {
    code;
    statusCode;
    message;
    details;
    cause;
    name;
    constructor(code, statusCode, message, details, cause) {
        this.code = code;
        this.statusCode = statusCode;
        this.message = message;
        this.details = details;
        this.cause = cause;
        this.name = this.constructor.name;
    }
}
export class ServerException extends ApplicationException {
    constructor(message, details, cause) {
        super(ErrorCodesEnum.SERVER_ERROR, 500, message, details, cause);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
export class BadRequestException extends ApplicationException {
    constructor(message, details, cause) {
        super(ErrorCodesEnum.INVALID_INPUT, 400, message, details, cause);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
export class ValidationException extends ApplicationException {
    constructor(message, details, cause) {
        super(ErrorCodesEnum.VALIDATION_ERROR, 422, message, details, cause);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
export class NotFoundException extends ApplicationException {
    constructor(message, details, cause) {
        super(ErrorCodesEnum.RESOURCE_NOT_FOUND, 404, message, details, cause);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
export class ConflictException extends ApplicationException {
    constructor(message, details, cause) {
        super(ErrorCodesEnum.CONFLICT_ERROR, 409, message, details, cause);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
export class UnauthorizedException extends ApplicationException {
    constructor(message, details, cause) {
        super(ErrorCodesEnum.UNAUTHORIZED, 401, message, details, cause);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
export class ForbiddenException extends ApplicationException {
    constructor(message, details, cause) {
        super(ErrorCodesEnum.FORBIDDEN, 403, message, details, cause);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
export class TooManyRequestsException extends ApplicationException {
    constructor(message, details, cause) {
        super(ErrorCodesEnum.TOO_MANY_RQUESTS, 429, message, details, cause);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
export class S3Exception extends ApplicationException {
    constructor(awsS3Error, message, details, cause) {
        super(awsS3Error?.Code || ErrorCodesEnum.ASSET_ERROR, awsS3Error?.$metadata?.httpStatusCode || 400, message +
            (awsS3Error?.message ? ` (Exact Error: ${awsS3Error.message})` : ""), details, cause);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
export class ContentTooLargeException extends ApplicationException {
    constructor(message, details, cause) {
        super(ErrorCodesEnum.CONTENT_TOO_LARGE, 413, message, details, cause);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
export class VersionConflictException extends ApplicationException {
    constructor(message, details, cause) {
        super(ErrorCodesEnum.VERSION_CONFLICT, 409, message, details, cause);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
