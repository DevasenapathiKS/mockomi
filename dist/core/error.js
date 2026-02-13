"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode, errorCode) {
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
exports.AppError = AppError;
