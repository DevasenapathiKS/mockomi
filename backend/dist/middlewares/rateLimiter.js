"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentLimiter = exports.uploadLimiter = exports.passwordResetLimiter = exports.authLimiter = exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = __importDefault(require("../config"));
const isDev = config_1.default.env === 'development';
// General API rate limiter (more relaxed in development to avoid local 429s)
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: isDev ? 60 * 1000 : config_1.default.rateLimit.windowMs, // 1 min in dev, config in other envs
    max: isDev ? 1000 : config_1.default.rateLimit.max, // high threshold locally
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        error: 'Rate limit exceeded',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Stricter limiter for authentication endpoints
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 login requests per windowMs
    message: {
        success: false,
        message: 'Too many login attempts, please try again after 15 minutes.',
        error: 'Rate limit exceeded',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
});
// Limiter for password reset
exports.passwordResetLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 password reset requests per hour
    message: {
        success: false,
        message: 'Too many password reset attempts, please try again after 1 hour.',
        error: 'Rate limit exceeded',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Limiter for file uploads
exports.uploadLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // limit each IP to 20 file uploads per hour
    message: {
        success: false,
        message: 'Too many file upload attempts, please try again later.',
        error: 'Rate limit exceeded',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Limiter for payment endpoints
exports.paymentLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30, // limit each IP to 30 payment requests per hour
    message: {
        success: false,
        message: 'Too many payment attempts, please try again later.',
        error: 'Rate limit exceeded',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
//# sourceMappingURL=rateLimiter.js.map