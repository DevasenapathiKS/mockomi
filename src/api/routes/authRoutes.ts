import { Router } from 'express';

import { AuthController } from '../../modules/auth/controllers/AuthController';
import { authenticate } from '../../core/authMiddleware';
import { AppError } from '../../core/error';
import { sendSuccess } from '../../core/response';
import { User } from '../../modules/auth/models/User';

const router = Router();
const controller = new AuthController();

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
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      next(new AppError('Unauthorized', 401));
      return;
    }

    const user = await User.findById(userId).select('email role');
    if (!user) {
      next(new AppError('User not found', 404));
      return;
    }

    return sendSuccess(res, {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });
  } catch (error: unknown) {
    next(error);
  }
});

export { router };

