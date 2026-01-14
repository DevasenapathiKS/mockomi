"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const auth_1 = require("../middlewares/auth");
const validate_1 = require("../middlewares/validate");
const types_1 = require("../types");
const validations_1 = require("../validations");
const router = (0, express_1.Router)();
// All routes require admin authentication
router.use(auth_1.authenticate);
router.use((0, auth_1.authorize)(types_1.UserRole.ADMIN));
/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Get dashboard stats
 *     security: [{ bearerAuth: [] }]
 */
router.get('/dashboard', controllers_1.adminController.getDashboard);
/**
 * @swagger
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Get all users
 *     security: [{ bearerAuth: [] }]
 */
router.get('/users', controllers_1.adminController.getAllUsers);
/**
 * @swagger
 * /admin/users/{id}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Update user status
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/users/:id/status', (0, validate_1.validateBody)(validations_1.updateUserStatusSchema), controllers_1.adminController.updateUserStatus);
/**
 * @swagger
 * /admin/interviewers/pending:
 *   get:
 *     tags: [Admin]
 *     summary: Get pending interviewers
 *     security: [{ bearerAuth: [] }]
 */
router.get('/interviewers/pending', controllers_1.adminController.getPendingInterviewers);
/**
 * @swagger
 * /admin/interviewers/{id}/approve:
 *   post:
 *     tags: [Admin]
 *     summary: Approve or reject interviewer
 *     security: [{ bearerAuth: [] }]
 */
router.post('/interviewers/:id/approve', (0, validate_1.validateBody)(validations_1.approveInterviewerSchema), controllers_1.adminController.approveInterviewer);
/**
 * @swagger
 * /admin/interviewers/top:
 *   get:
 *     tags: [Admin]
 *     summary: Get top interviewers
 *     security: [{ bearerAuth: [] }]
 */
router.get('/interviewers/top', controllers_1.adminController.getTopInterviewers);
/**
 * @swagger
 * /admin/payments:
 *   get:
 *     tags: [Admin]
 *     summary: Get all payments
 *     security: [{ bearerAuth: [] }]
 */
router.get('/payments', controllers_1.adminController.getAllPayments);
/**
 * @swagger
 * /admin/payments/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Get payment statistics
 *     security: [{ bearerAuth: [] }]
 */
router.get('/payments/stats', controllers_1.adminController.getPaymentStats);
/**
 * @swagger
 * /admin/payments/{id}/refund:
 *   post:
 *     tags: [Admin]
 *     summary: Initiate refund
 *     security: [{ bearerAuth: [] }]
 */
router.post('/payments/:id/refund', controllers_1.adminController.initiateRefund);
/**
 * @swagger
 * /admin/analytics/interviews:
 *   get:
 *     tags: [Admin]
 *     summary: Get interview analytics
 *     security: [{ bearerAuth: [] }]
 */
router.get('/analytics/interviews', controllers_1.adminController.getInterviewAnalytics);
/**
 * @swagger
 * /admin/analytics/revenue:
 *   get:
 *     tags: [Admin]
 *     summary: Get revenue analytics
 *     security: [{ bearerAuth: [] }]
 */
router.get('/analytics/revenue', controllers_1.adminController.getRevenueAnalytics);
/**
 * @swagger
 * /admin/health:
 *   get:
 *     tags: [Admin]
 *     summary: Get system health
 *     security: [{ bearerAuth: [] }]
 */
router.get('/health', controllers_1.adminController.getSystemHealth);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map