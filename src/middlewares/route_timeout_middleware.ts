import type { NextFunction, Request, Response } from "express";

function routeTimeoutMiddleware(ms: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    req.timedout = false;
    const timer = setTimeout(() => {
      req.timedout = true;
      if (!res.headersSent) {
        res.status(503).json({ error: "Request timed out ⏰❌" });
      }
    }, ms);

    // Clear the timer if we finish or close
    res.on("finish", () => clearTimeout(timer));
    res.on("close", () => clearTimeout(timer));
    next();
  };
}

export default routeTimeoutMiddleware;
