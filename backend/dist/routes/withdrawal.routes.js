"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const auth_1 = require("../middlewares/auth");
const validate_1 = require("../middlewares/validate");
const types_1 = require("../types");
const validations_1 = require("../validations");
const router = (0, express_1.Router)();
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
router.post('/', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.INTERVIEWER), (0, validate_1.validateBody)(validations_1.createWithdrawalSchema), controllers_1.withdrawalController.createWithdrawal);
/**
 * @swagger
 * /withdrawals:
 *   get:
 *     tags: [Withdrawals]
 *     summary: Get my withdrawal history
 *     security: [{ bearerAuth: [] }]
 */
router.get('/', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.INTERVIEWER), controllers_1.withdrawalController.getMyWithdrawals);
/**
 * @swagger
 * /withdrawals/stats:
 *   get:
 *     tags: [Withdrawals]
 *     summary: Get withdrawal statistics
 *     security: [{ bearerAuth: [] }]
 */
router.get('/stats', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.INTERVIEWER), controllers_1.withdrawalController.getWithdrawalStats);
/**
 * @swagger
 * /withdrawals/{id}:
 *   get:
 *     tags: [Withdrawals]
 *     summary: Get withdrawal by ID
 *     security: [{ bearerAuth: [] }]
 */
router.get('/:id', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.INTERVIEWER), controllers_1.withdrawalController.getWithdrawalById);
// ============ WEBHOOK ROUTE ============
/**
 * @swagger
 * /withdrawals/webhook/payout:
 *   post:
 *     tags: [Withdrawals]
 *     summary: Razorpay payout webhook
 */
router.post('/webhook/payout', controllers_1.withdrawalController.handlePayoutWebhook);
// ============ ADMIN ROUTES ============
/**
 * @swagger
 * /withdrawals/admin/all:
 *   get:
 *     tags: [Withdrawals]
 *     summary: Get all withdrawals (Admin only)
 *     security: [{ bearerAuth: [] }]
 */
router.get('/admin/all', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN), controllers_1.withdrawalController.getAllWithdrawals);
/**
 * @swagger
 * /withdrawals/admin/:id/approve:
 *   post:
 *     tags: [Withdrawals]
 *     summary: Approve withdrawal (Admin only) – credits amount to bank account
 *     security: [{ bearerAuth: [] }]
 */
router.post('/admin/:id/approve', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN), controllers_1.withdrawalController.approveWithdrawal);
/**
 * @swagger
 * /withdrawals/admin/:id/reject:
 *   post:
 *     tags: [Withdrawals]
 *     summary: Reject withdrawal request (Admin only)
 *     security: [{ bearerAuth: [] }]
 */
router.post('/admin/:id/reject', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN), controllers_1.withdrawalController.rejectWithdrawal);
exports.default = router;
//# sourceMappingURL=withdrawal.routes.js.map