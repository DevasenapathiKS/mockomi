import rateLimit from "express-rate-limit";

/**
 * Strict limiter for authentication routes
 * Protects against brute force attacks
 */
export const authLimiter = rateLimit({
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
export const interviewLimiter = rateLimit({
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
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});

