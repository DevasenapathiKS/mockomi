export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode?: string;

  constructor(message: string, statusCode: number, errorCode?: string) {
    super(message);

    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;

    // Required when targeting ES5/using transpilation to preserve instanceof checks.
    Object.setPrototypeOf(this, new.target.prototype);

    // Preserve a useful stack trace (V8 environments).
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

