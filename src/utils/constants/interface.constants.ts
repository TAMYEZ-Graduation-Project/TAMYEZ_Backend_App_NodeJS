import type { MailOptions } from "nodemailer/lib/json-transport/index.js";
import type { IssueObjectType } from "../types/issue_object.type.ts";
import type {
  ApplicationTypeEnum,
  ErrorCodesEnum,
  OptionIdsEnum,
  QuestionTypesEnum,
} from "./enum.constants.ts";
import type { JwtPayload } from "jsonwebtoken";
import type { Types } from "mongoose";
import type Stream from "node:stream";
import type {
  FindFunctionsReturnType,
  LeanType,
} from "../types/find_functions.type.ts";

export interface IAppError extends Error {
  statusCode?: number;
  code?: ErrorCodesEnum;
  details?: IssueObjectType[] | undefined;
}

export interface IExtendedMailOptions extends MailOptions {
  otpOrLink: string;
  to: string;
}

export interface INotificationParams {
  title: string;
  body: string;
  imageUrl?: string | undefined;
  careerId?: string | Types.ObjectId | undefined;
}

export interface ITokenPayload extends JwtPayload {
  id: Types.ObjectId;
  applicationType: ApplicationTypeEnum;
  jti: string;
}

export interface IMulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  stream?: Stream.Readable | undefined;
  size: number;
  /** `DiskStorage` only: Directory to which this file has been uploaded. */
  destination?: string | undefined;
  /** `DiskStorage` only: Name of this file within `destination`. */
  filename?: string | undefined;
  /** `DiskStorage` only: Full path to the uploaded file. */
  path?: string | undefined;
  /** `MemoryStorage` only: A Buffer containing the entire file. */
  buffer?: Buffer | undefined;
}

export interface IPaginationResult<
  TDocument,
  TLean extends LeanType = false,
> extends IPaginationMetaData {
  data?: FindFunctionsReturnType<TDocument, TLean>;
}

export interface IPaginationMetaData {
  totalCount?: number | undefined;
  totalPages?: number | undefined;
  currentPage?: number | undefined;
  size?: number | undefined;
}

export interface IAIModelGeneratedQuestionsRequest {
  title: string;
  aiPrompt: string;
}

export interface IAIModelGeneratedQuestionsResponse {
  questions: {
    type: QuestionTypesEnum;
    text: string;
    options?: { id: OptionIdsEnum; text: string }[] | undefined;
    correctAnswer?: OptionIdsEnum[] | undefined;
    explanation?: string | undefined;
  }[];
}

export interface IAIModelCheckWrittenQuestionsRequest extends IAIModelGeneratedQuestionsRequest {
  writtenAnswers: {
    questionId: string;
    text: string;
    userAnswer: string;
  }[];
}

export interface IAIModelCheckCareerAssessmentQuestionsRequest {
  careerList: { careerId: Types.ObjectId; title: string; summary: string }[];
  answers: {
    text: string;
    options?: { id: OptionIdsEnum; text: string }[] | undefined;
    userAnswer: string | OptionIdsEnum[];
  }[];
}

export interface IAIModelCheckCareerAssessmentQuestionsResponse {
  suggestedCareers: {
    title: string;
    confidence: number;
  }[];
}

export interface IAIModelCheckWrittenQuestionsResponse {
  questionId: string;
  isCorrect: boolean;
  correction?: string; // "This is the correction of user answer (5000)"
  explenation?: string; // "This is the explenation of the correction (1000)"
}
