import type { IssueObjectType } from "../types/issue_object.type.ts";
import type { ErrorCodesEnum } from "./enum.constants.ts";

export interface IAppError extends Error {
  statusCode?: number;
  code?: ErrorCodesEnum;
  details?: IssueObjectType[] | undefined;
}
