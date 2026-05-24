import type { NextFunction, Request, Response } from "express";
import type { IAppError } from "../constants/interface.constants.ts";
import { ErrorCodesEnum } from "../constants/enum.constants.ts";
import StringConstants from "../constants/strings.constants.ts";

const globalErrorHandler = async (
  error: IAppError,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  console.log({ error });

  if (
    (req as any).timedout || // set by connect-timeout; or your own flag if custom
    res.headersSent || // headers were already sent by someone else
    res.writableEnded // response stream already ended
  ) {
    return; 
  }

  return res.status(error.statusCode || 500).json({
    success: false,
    error: {
      code: error.code || ErrorCodesEnum.SERVER_ERROR,
      message: error.message || StringConstants.SOMETHING_WRONG_MESSAGE,
      details: error.details,
      cause: error.cause,
    },
  });
};

export default globalErrorHandler;
