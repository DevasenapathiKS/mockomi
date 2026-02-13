import type { NextFunction, Request, Response } from 'express';
import { AppError } from './error';
import { sendError } from './response';
import { logger } from './logger';

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): Response {
  // If headers are already sent, delegate to the default Express error handler.
  if (res.headersSent) {
    next(err);
    return res;
  }

  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err instanceof Error ? err.message : 'Unknown error';
  const stack = err instanceof Error ? err.stack : undefined;

  logger.error({
    message,
    stack,
    statusCode,
  });

  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.errorCode);
  }

  return sendError(res, 'Internal Server Error', 500);
}

