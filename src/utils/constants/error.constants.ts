import { ErrorCodesEnum } from "./enum.constants.ts";

export const expressRateLimitError = {
  code: ErrorCodesEnum.TOO_MANY_RQUESTS,
  message: "Too many update roadmap step requests, please try after a while ⌛️.",
};
