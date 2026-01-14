import { Router } from 'express';
import { withdrawalController } from '../controllers';
import { authenticate, authorize } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { UserRole } from '../types';
import { createWithdrawalSchema } from '../validations';

const router = Router();

// ============ INTERVIEWER WITHDRAWAL ROUTES ============

/**
 * @swagger
 * /withdrawals:
 *   post:
 *     tags: [Withdrawals]
 *     summary: Create a withdrawal request
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - method
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount in paise (min 100 = ₹1)
 *               method:
 *                 type: string
 *                 enum: [bank_transfer, upi]
 *               bankDetails:
 *                 type: object
 *                 properties:
 *                   accountHolderName:
 *                     type: string
 *                   accountNumber:
 *                     type: string
 *                   ifscCode:
 *                     type: string
 *                   bankName:
 *                     type: string
 *               upiId:
 *                 type: string
 */
router.post(
  '/',
  authenticate,
  authorize(UserRole.INTERVIEWER),
  validateBody(createWithdrawalSchema),
  withdrawalController.createWithdrawal
);

/**
 * @swagger
 * /withdrawals:
 *   get:
 *     tags: [Withdrawals]
 *     summary: Get my withdrawal history
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/',
  authenticate,
  authorize(UserRole.INTERVIEWER),
  withdrawalController.getMyWithdrawals
);

/**
 * @swagger
 * /withdrawals/stats:
 *   get:
 *     tags: [Withdrawals]
 *     summary: Get withdrawal statistics
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/stats',
  authenticate,
  authorize(UserRole.INTERVIEWER),
  withdrawalController.getWithdrawalStats
);

/**
 * @swagger
 * /withdrawals/{id}:
 *   get:
 *     tags: [Withdrawals]
 *     summary: Get withdrawal by ID
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/:id',
  authenticate,
  authorize(UserRole.INTERVIEWER),
  withdrawalController.getWithdrawalById
);

// ============ WEBHOOK ROUTE ============

/**
 * @swagger
 * /withdrawals/webhook/payout:
 *   post:
 *     tags: [Withdrawals]
 *     summary: Razorpay payout webhook
 */
router.post(
  '/webhook/payout',
  withdrawalController.handlePayoutWebhook
);

// ============ ADMIN ROUTES ============

/**
 * @swagger
 * /withdrawals/admin/all:
 *   get:
 *     tags: [Withdrawals]
 *     summary: Get all withdrawals (Admin only)
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/admin/all',
  authenticate,
  authorize(UserRole.ADMIN),
  withdrawalController.getAllWithdrawals
);

export default router;

