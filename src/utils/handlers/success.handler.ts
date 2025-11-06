import type { Response } from "express";
import StringConstants from "../constants/strings.constants.ts";

function successHandler({
  res,
  statusCode = 200,
  message = StringConstants.DONE_MESSAGE,
  body,
}: {
  res: Response;
  statusCode?: number;
  message?: string;
  body?: Object;
}): Response {
  return res.status(statusCode).json({ success: true, message, body });
}

export default successHandler;
