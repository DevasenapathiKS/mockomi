"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiLimiter = exports.interviewLimiter = exports.authLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
/**
 * Strict limiter for authentication routes
 * Protects against brute force attacks
 */
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 attempts per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many authentication attempts. Please try again later.",
    },
});
/**
 * Moderate limiter for interview endpoints
 */
exports.interviewLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100, // 100 interview requests per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many interview requests. Slow down.",
    },
});
/**
 * General API limiter
 */
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
});
