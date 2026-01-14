import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import config from '../config';

interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  stack?: string;
  errors?: object[];
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal server error';
  let error = err.message;

  // Handle AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    error = err.message;
  }

  // Handle Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    const mongooseErr = err as any;
    error = Object.values(mongooseErr.errors)
      .map((e: any) => e.message)
      .join(', ');
  }

  // Handle Mongoose duplicate key error
  if ((err as any).code === 11000) {
    statusCode = 409;
    message = 'Duplicate key error';
    const field = Object.keys((err as any).keyValue)[0];
    error = `${field} already exists`;
  }

  // Handle Mongoose cast error
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    error = 'The provided ID is not valid';
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    error = 'The provided token is invalid';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    error = 'Your session has expired. Please log in again.';
  }

  // Handle multer errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    message = 'File upload error';
    error = err.message;
  }

  // Log error
  if (statusCode >= 500) {
    logger.error(`${statusCode} - ${message} - ${error}`, {
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      user: (req as any).user?.id,
    });
  } else {
    logger.warn(`${statusCode} - ${message} - ${error}`, {
      url: req.originalUrl,
      method: req.method,
    });
  }

  const response: ErrorResponse = {
    success: false,
    message,
    error,
  };

  // Include stack trace in development
  if (config.env === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new AppError(
    `Cannot ${req.method} ${req.originalUrl}`,
    404
  );
  next(error);
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
