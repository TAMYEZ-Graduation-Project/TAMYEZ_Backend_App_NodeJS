import type { Request, Response } from "express";
import StringConstants from "../constants/strings.constants.ts";

function successHandler<TBody = any>({
  req,
  res,
  statusCode = 200,
  message = StringConstants.DONE_MESSAGE,
  body,
}: {
  req: Request;
  res: Response;
  statusCode?: number;
  message?: string;
  body?: TBody;
}): Response | void {
  if (
    req.destroyed || // Node marks when the client/connection is gone
    (req as any).timedout || // set by connect-timeout; or your own flag if custom
    res.headersSent || // headers were already sent by someone else
    res.writableEnded // response stream already ended
  ) {
    return;
  }

  return res.status(statusCode).json({ success: true, message, body });
}

export default successHandler;
