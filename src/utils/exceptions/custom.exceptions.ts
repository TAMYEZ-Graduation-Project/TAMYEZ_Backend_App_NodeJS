import { ErrorCodesEnum } from "../constants/enum.constants.js";
import type { IAppError } from "../constants/interface.constants.ts";
import type { IssueObjectType } from "../types/issue_object.type.ts";

export class ApplicationException implements IAppError {
  public name: string;
  constructor(
    public code: ErrorCodesEnum,
    public statusCode: number,
    public message: string,
    public details?: IssueObjectType[],
    public cause?: unknown
  ) {
    this.name = this.constructor.name;
  }
}

export class ServerException extends ApplicationException {
  constructor(message: string, details?: IssueObjectType[], cause?: unknown) {
    super(ErrorCodesEnum.SERVER_ERROR, 500, message, details, cause);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestException extends ApplicationException {
  constructor(message: string, details?: IssueObjectType[], cause?: unknown) {
    super(ErrorCodesEnum.INVALID_INPUT, 400, message, details, cause);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationException extends ApplicationException {
  constructor(message: string, details?: IssueObjectType[], cause?: unknown) {
    super(ErrorCodesEnum.VALIDATION_ERROR, 422, message, details, cause);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
export class NotFoundException extends ApplicationException {
  constructor(message: string, details?: IssueObjectType[], cause?: unknown) {
    super(ErrorCodesEnum.RESOURCE_NOT_FOUND, 404, message, details, cause);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
export class ConflictException extends ApplicationException {
  constructor(message: string, details?: IssueObjectType[], cause?: unknown) {
    super(ErrorCodesEnum.CONFLICT_ERROR, 409, message, details, cause);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class UnauthorizedException extends ApplicationException {
  constructor(message: string, details?: IssueObjectType[], cause?: unknown) {
    super(ErrorCodesEnum.UNAUTHORIZED, 401, message, details, cause);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ForbiddenException extends ApplicationException {
  constructor(message: string, details?: IssueObjectType[], cause?: unknown) {
    super(ErrorCodesEnum.FORBIDDEN, 403, message, details, cause);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class TooManyRequestsException extends ApplicationException {
  constructor(message: string, details?: IssueObjectType[], cause?: unknown) {
    super(ErrorCodesEnum.TOO_MANY_RQUESTS, 429, message, details, cause);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
