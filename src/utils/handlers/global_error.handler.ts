import type { NextFunction, Request, Response } from "express";
import type { IAppError } from "../constants/interface.constants.ts";
import { ErrorCodesEnum } from "../constants/enum.constants.ts";
import StringConstants from "../constants/strings.constants.ts";

const globalErrorHandler = async (
  error: IAppError,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> => {
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
