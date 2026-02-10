"use strict";

import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";

export interface ValidationSchemas {
  query?: ZodSchema;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query);
        req.query = parsed;
      }
      next();
    } catch (e: any) {
      e.statusCode = 400;
      e.publicMessage = "Invalid request parameters";
      next(e);
    }
  };
}
