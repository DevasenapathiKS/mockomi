import type { Response } from 'express';

export type SuccessResponse<T> = {
  success: true;
  data: T;
};

export type ErrorResponse = {
  success: false;
  message: string;
  errorCode?: string;
};

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
): Response<SuccessResponse<T>> {
  return res.status(statusCode).json({ success: true, data });
}

export function sendError(
  res: Response,
  message: string,
  statusCode: number = 500,
  errorCode?: string,
): Response<ErrorResponse> {
  const payload: ErrorResponse = errorCode
    ? { success: false, message, errorCode }
    : { success: false, message };

  return res.status(statusCode).json(payload);
}

