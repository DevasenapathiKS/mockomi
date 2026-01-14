import rateLimit from 'express-rate-limit';
import config from '../config';

const isDev = config.env === 'development';

// General API rate limiter (more relaxed in development to avoid local 429s)
export const apiLimiter = rateLimit({
  windowMs: isDev ? 60 * 1000 : config.rateLimit.windowMs, // 1 min in dev, config in other envs
  max: isDev ? 1000 : config.rateLimit.max, // high threshold locally
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    error: 'Rate limit exceeded',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for authentication endpoints
export const authLimiter = rateLimit({
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
export const passwordResetLimiter = rateLimit({
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
export const uploadLimiter = rateLimit({
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
export const paymentLimiter = rateLimit({
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
