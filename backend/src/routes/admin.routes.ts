import { Router } from 'express';
import { adminController } from '../controllers';
import { authenticate, authorize } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { UserRole } from '../types';
import { approveInterviewerSchema, updateUserStatusSchema } from '../validations';

const router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Get dashboard stats
 *     security: [{ bearerAuth: [] }]
 */
router.get('/dashboard', adminController.getDashboard);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Get all users
 *     security: [{ bearerAuth: [] }]
 */
router.get('/users', adminController.getAllUsers);

/**
 * @swagger
 * /admin/users/{id}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Update user status
 *     security: [{ bearerAuth: [] }]
 */
router.patch(
  '/users/:id/status',
  validateBody(updateUserStatusSchema),
  adminController.updateUserStatus
);

/**
 * @swagger
 * /admin/interviewers/pending:
 *   get:
 *     tags: [Admin]
 *     summary: Get pending interviewers
 *     security: [{ bearerAuth: [] }]
 */
router.get('/interviewers/pending', adminController.getPendingInterviewers);

/**
 * @swagger
 * /admin/interviewers/{id}/approve:
 *   post:
 *     tags: [Admin]
 *     summary: Approve or reject interviewer
 *     security: [{ bearerAuth: [] }]
 */
router.post(
  '/interviewers/:id/approve',
  validateBody(approveInterviewerSchema),
  adminController.approveInterviewer
);

/**
 * @swagger
 * /admin/interviewers/top:
 *   get:
 *     tags: [Admin]
 *     summary: Get top interviewers
 *     security: [{ bearerAuth: [] }]
 */
router.get('/interviewers/top', adminController.getTopInterviewers);

/**
 * @swagger
 * /admin/payments:
 *   get:
 *     tags: [Admin]
 *     summary: Get all payments
 *     security: [{ bearerAuth: [] }]
 */
router.get('/payments', adminController.getAllPayments);

/**
 * @swagger
 * /admin/payments/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Get payment statistics
 *     security: [{ bearerAuth: [] }]
 */
router.get('/payments/stats', adminController.getPaymentStats);

/**
 * @swagger
 * /admin/payments/{id}/refund:
 *   post:
 *     tags: [Admin]
 *     summary: Initiate refund
 *     security: [{ bearerAuth: [] }]
 */
router.post('/payments/:id/refund', adminController.initiateRefund);

/**
 * @swagger
 * /admin/analytics/interviews:
 *   get:
 *     tags: [Admin]
 *     summary: Get interview analytics
 *     security: [{ bearerAuth: [] }]
 */
router.get('/analytics/interviews', adminController.getInterviewAnalytics);

/**
 * @swagger
 * /admin/analytics/revenue:
 *   get:
 *     tags: [Admin]
 *     summary: Get revenue analytics
 *     security: [{ bearerAuth: [] }]
 */
router.get('/analytics/revenue', adminController.getRevenueAnalytics);

/**
 * @swagger
 * /admin/health:
 *   get:
 *     tags: [Admin]
 *     summary: Get system health
 *     security: [{ bearerAuth: [] }]
 */
router.get('/health', adminController.getSystemHealth);

export default router;
