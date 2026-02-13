import type { RequestHandler } from 'express';
import { ZodError, type ZodTypeAny } from 'zod';

import { AppError } from './error';

export function validate<TSchema extends ZodTypeAny>(
  schema: TSchema,
): RequestHandler {
  return (req, _res, next) => {
    try {
      req.body = schema.parse(req.body) as unknown;
      next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        next(new AppError(error.message, 400));
        return;
      }
      next(error);
    }
  };
}

