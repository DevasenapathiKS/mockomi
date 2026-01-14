import { Router } from 'express';
import { authController } from '../controllers';
import { authenticate, verifyRefreshToken } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { authLimiter } from '../middlewares/rateLimiter';
import { registerSchema, loginSchema, refreshTokenSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from '../validations';

const router = Router();

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
router.post(
  '/register',
  authLimiter,
  validateBody(registerSchema),
  authController.register
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 */
router.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  authController.login
);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 */
router.post(
  '/refresh-token',
  validateBody(refreshTokenSchema),
  verifyRefreshToken,
  authController.refreshToken
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user
 *     security: [{ bearerAuth: [] }]
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @swagger
 * /auth/logout-all:
 *   post:
 *     tags: [Auth]
 *     summary: Logout from all devices
 *     security: [{ bearerAuth: [] }]
 */
router.post('/logout-all', authenticate, authController.logoutAll);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change password
 *     security: [{ bearerAuth: [] }]
 */
router.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  authController.changePassword
);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset
 */
router.post(
  '/forgot-password',
  authLimiter,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with token
 */
router.post(
  '/reset-password',
  authLimiter,
  validateBody(resetPasswordSchema),
  authController.resetPassword
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user
 *     security: [{ bearerAuth: [] }]
 */
router.get('/me', authenticate, authController.getMe);

export default router;
