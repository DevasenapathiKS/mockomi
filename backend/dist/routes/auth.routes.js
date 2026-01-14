"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const auth_1 = require("../middlewares/auth");
const validate_1 = require("../middlewares/validate");
const rateLimiter_1 = require("../middlewares/rateLimiter");
const validations_1 = require("../validations");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName, lastName, role]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               role: { type: string, enum: [job_seeker, employer, interviewer] }
 *               phone: { type: string }
 */
router.post('/register', rateLimiter_1.authLimiter, (0, validate_1.validateBody)(validations_1.registerSchema), controllers_1.authController.register);
/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 */
router.post('/login', rateLimiter_1.authLimiter, (0, validate_1.validateBody)(validations_1.loginSchema), controllers_1.authController.login);
/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 */
router.post('/refresh-token', (0, validate_1.validateBody)(validations_1.refreshTokenSchema), auth_1.verifyRefreshToken, controllers_1.authController.refreshToken);
/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user
 *     security: [{ bearerAuth: [] }]
 */
router.post('/logout', auth_1.authenticate, controllers_1.authController.logout);
/**
 * @swagger
 * /auth/logout-all:
 *   post:
 *     tags: [Auth]
 *     summary: Logout from all devices
 *     security: [{ bearerAuth: [] }]
 */
router.post('/logout-all', auth_1.authenticate, controllers_1.authController.logoutAll);
/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change password
 *     security: [{ bearerAuth: [] }]
 */
router.post('/change-password', auth_1.authenticate, (0, validate_1.validateBody)(validations_1.changePasswordSchema), controllers_1.authController.changePassword);
/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset
 */
router.post('/forgot-password', rateLimiter_1.authLimiter, (0, validate_1.validateBody)(validations_1.forgotPasswordSchema), controllers_1.authController.forgotPassword);
/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with token
 */
router.post('/reset-password', rateLimiter_1.authLimiter, (0, validate_1.validateBody)(validations_1.resetPasswordSchema), controllers_1.authController.resetPassword);
/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user
 *     security: [{ bearerAuth: [] }]
 */
router.get('/me', auth_1.authenticate, controllers_1.authController.getMe);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map