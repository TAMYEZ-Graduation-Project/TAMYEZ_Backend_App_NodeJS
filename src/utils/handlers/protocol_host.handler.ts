import type { Request, Response, NextFunction } from "express";

const protocolAndHostHanlder = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (process.env.PROTOCOL != req.protocol) {
    process.env.PROTOCOL = req.protocol;
  }

  if (process.env.HOST != req.host) {
    process.env.HOST = req.host;
  }

  next();
};

export default protocolAndHostHanlder;
