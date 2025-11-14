import type { MailOptions } from "nodemailer/lib/json-transport/index.js";
import type { IssueObjectType } from "../types/issue_object.type.ts";
import type { ErrorCodesEnum } from "./enum.constants.ts";
import type { JwtPayload } from "jsonwebtoken";
import type { Types } from "mongoose";

export interface IAppError extends Error {
  statusCode?: number;
  code?: ErrorCodesEnum;
  details?: IssueObjectType[] | undefined;
}

export interface IExtendedMailOptions extends MailOptions {
  otpOrLink: string;
  to: string;
}

export interface ITokenPayload extends JwtPayload {
  id: Types.ObjectId;
  jti: string;
}
