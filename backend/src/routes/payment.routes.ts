import { Router } from 'express';
import { paymentController } from '../controllers';
import { authenticate } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { paymentLimiter } from '../middlewares/rateLimiter';
import { createPaymentOrderSchema, verifyPaymentSchema } from '../validations';

const router = Router();

/**
 * @swagger
 * /payments/create-order:
 *   post:
 *     tags: [Payments]
 *     summary: Create a payment order
 *     security: [{ bearerAuth: [] }]
 */
router.post(
  '/create-order',
  authenticate,
  paymentLimiter,
  validateBody(createPaymentOrderSchema),
  paymentController.createOrder
);

/**
 * @swagger
 * /payments/verify:
 *   post:
 *     tags: [Payments]
 *     summary: Verify payment
 *     security: [{ bearerAuth: [] }]
 */
router.post(
  '/verify',
  authenticate,
  validateBody(verifyPaymentSchema),
  paymentController.verifyPayment
);

/**
 * @swagger
 * /payments/webhook:
 *   post:
 *     tags: [Payments]
 *     summary: Razorpay webhook handler
 */
router.post('/webhook', paymentController.handleWebhook);

/**
 * @swagger
 * /payments/my-payments:
 *   get:
 *     tags: [Payments]
 *     summary: Get my payments
 *     security: [{ bearerAuth: [] }]
 */
router.get('/my-payments', authenticate, paymentController.getMyPayments);

/**
 * @swagger
 * /payments/{id}:
 *   get:
 *     tags: [Payments]
 *     summary: Get payment by ID
 *     security: [{ bearerAuth: [] }]
 */
router.get('/:id', authenticate, paymentController.getPaymentById);

export default router;
