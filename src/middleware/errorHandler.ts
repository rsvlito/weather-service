"use strict";

import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction): void {
  const status = Number(err.statusCode || 500);

  req.log?.error(
    { status, msg: err.message, upstreamStatus: err.upstreamStatus },
    "request_error"
  );

  if (status >= 500) {
    res.status(status).json({ error: "Internal error" });
    return;
  }
  res.status(status).json({ error: err.publicMessage || "Request failed" });
}
