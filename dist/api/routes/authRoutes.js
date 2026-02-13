"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const AuthController_1 = require("../../modules/auth/controllers/AuthController");
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
