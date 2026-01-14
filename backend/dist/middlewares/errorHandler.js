"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.notFoundHandler = exports.errorHandler = void 0;
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
const config_1 = __importDefault(require("../config"));
const errorHandler = (err, req, res, next) => {
    let statusCode = 500;
    let message = 'Internal server error';
    let error = err.message;
    // Handle AppError
    if (err instanceof errors_1.AppError) {
        statusCode = err.statusCode;
        message = err.message;
        error = err.message;
    }
    // Handle Mongoose validation error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation error';
        const mongooseErr = err;
        error = Object.values(mongooseErr.errors)
            .map((e) => e.message)
            .join(', ');
    }
    // Handle Mongoose duplicate key error
    if (err.code === 11000) {
        statusCode = 409;
        message = 'Duplicate key error';
        const field = Object.keys(err.keyValue)[0];
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
        logger_1.default.error(`${statusCode} - ${message} - ${error}`, {
            stack: err.stack,
            url: req.originalUrl,
            method: req.method,
            body: req.body,
            user: req.user?.id,
        });
    }
    else {
        logger_1.default.warn(`${statusCode} - ${message} - ${error}`, {
            url: req.originalUrl,
            method: req.method,
        });
    }
    const response = {
        success: false,
        message,
        error,
    };
    // Include stack trace in development
    if (config_1.default.env === 'development') {
        response.stack = err.stack;
    }
    res.status(statusCode).json(response);
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res, next) => {
    const error = new errors_1.AppError(`Cannot ${req.method} ${req.originalUrl}`, 404);
    next(error);
};
exports.notFoundHandler = notFoundHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=errorHandler.js.map