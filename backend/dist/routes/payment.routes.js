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
 * /payments/create-order:
 *   post:
 *     tags: [Payments]
 *     summary: Create a payment order
 *     security: [{ bearerAuth: [] }]
 */
router.post('/create-order', auth_1.authenticate, rateLimiter_1.paymentLimiter, (0, validate_1.validateBody)(validations_1.createPaymentOrderSchema), controllers_1.paymentController.createOrder);
/**
 * @swagger
 * /payments/verify:
 *   post:
 *     tags: [Payments]
 *     summary: Verify payment
 *     security: [{ bearerAuth: [] }]
 */
router.post('/verify', auth_1.authenticate, (0, validate_1.validateBody)(validations_1.verifyPaymentSchema), controllers_1.paymentController.verifyPayment);
/**
 * @swagger
 * /payments/webhook:
 *   post:
 *     tags: [Payments]
 *     summary: Razorpay webhook handler
 */
router.post('/webhook', controllers_1.paymentController.handleWebhook);
/**
 * @swagger
 * /payments/my-payments:
 *   get:
 *     tags: [Payments]
 *     summary: Get my payments
 *     security: [{ bearerAuth: [] }]
 */
router.get('/my-payments', auth_1.authenticate, controllers_1.paymentController.getMyPayments);
/**
 * @swagger
 * /payments/{id}:
 *   get:
 *     tags: [Payments]
 *     summary: Get payment by ID
 *     security: [{ bearerAuth: [] }]
 */
router.get('/:id', auth_1.authenticate, controllers_1.paymentController.getPaymentById);
exports.default = router;
//# sourceMappingURL=payment.routes.js.map