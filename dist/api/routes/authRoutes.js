"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const AuthController_1 = require("../../modules/auth/controllers/AuthController");
const authMiddleware_1 = require("../../core/authMiddleware");
const error_1 = require("../../core/error");
const response_1 = require("../../core/response");
const User_1 = require("../../modules/auth/models/User");
const router = (0, express_1.Router)();
exports.router = router;
const controller = new AuthController_1.AuthController();
/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Authentication APIs
 */
/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User registered
 *       400:
 *         description: User already exists
 */
/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login and get a JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/register', controller.register);
router.post('/login', controller.login);
/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/me', authMiddleware_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            next(new error_1.AppError('Unauthorized', 401));
            return;
        }
        const user = await User_1.User.findById(userId).select('email role');
        if (!user) {
            next(new error_1.AppError('User not found', 404));
            return;
        }
        return (0, response_1.sendSuccess)(res, {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
        });
    }
    catch (error) {
        next(error);
    }
});
