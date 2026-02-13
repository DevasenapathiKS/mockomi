"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
const error_1 = require("./error");
const response_1 = require("./response");
const logger_1 = require("./logger");
function errorMiddleware(err, _req, res, next) {
    // If headers are already sent, delegate to the default Express error handler.
    if (res.headersSent) {
        next(err);
        return res;
    }
    const statusCode = err instanceof error_1.AppError ? err.statusCode : 500;
    const message = err instanceof Error ? err.message : 'Unknown error';
    const stack = err instanceof Error ? err.stack : undefined;
    logger_1.logger.error({
        message,
        stack,
        statusCode,
    });
    if (err instanceof error_1.AppError) {
        return (0, response_1.sendError)(res, err.message, err.statusCode, err.errorCode);
    }
    return (0, response_1.sendError)(res, 'Internal Server Error', 500);
}
