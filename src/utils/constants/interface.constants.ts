import type { MailOptions } from "nodemailer/lib/json-transport/index.js";
import type { IssueObjectType } from "../types/issue_object.type.ts";
import type { ErrorCodesEnum } from "./enum.constants.ts";

export interface IAppError extends Error {
  statusCode?: number;
  code?: ErrorCodesEnum;
  details?: IssueObjectType[] | undefined;
}

export interface IExtendedMailOptions extends MailOptions {
  otpOrLink: string;
  to: string;
  subject: string;
}
