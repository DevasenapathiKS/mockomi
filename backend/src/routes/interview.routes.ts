import { Router } from 'express';
import { interviewController } from '../controllers';
import { authenticate, authorize, requireInterviewerApproval } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { uploadVideo } from '../middlewares/upload';
import { paymentLimiter } from '../middlewares/rateLimiter';
import { UserRole } from '../types';
import { scheduleInterviewSchema, interviewFeedbackSchema, verifyPaymentSchema } from '../validations';

const router = Router();

/**
 * @swagger
 * /interviews/interviewers:
 *   get:
 *     tags: [Interviews]
 *     summary: Get available interviewers
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/interviewers',
  authenticate,
  interviewController.getAvailableInterviewers
);

/**
 * @swagger
 * /interviews/payment-check:
 *   get:
 *     tags: [Interviews]
 *     summary: Check if payment is required
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/payment-check',
  authenticate,
  authorize(UserRole.JOB_SEEKER),
  interviewController.checkPaymentRequired
);

/**
 * @swagger
 * /interviews:
 *   post:
 *     tags: [Interviews]
 *     summary: Schedule a mock interview
 *     security: [{ bearerAuth: [] }]
 */
router.post(
  '/',
  authenticate,
  authorize(UserRole.JOB_SEEKER),
  validateBody(scheduleInterviewSchema),
  interviewController.scheduleInterview
);

/**
 * @swagger
 * /interviews/my-interviews:
 *   get:
 *     tags: [Interviews]
 *     summary: Get my interviews
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/my-interviews',
  authenticate,
  authorize(UserRole.JOB_SEEKER, UserRole.INTERVIEWER),
  interviewController.getMyInterviews
);

/**
 * @swagger
 * /interviews/earnings:
 *   get:
 *     tags: [Interviews]
 *     summary: Get interviewer earnings
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/earnings',
  authenticate,
  authorize(UserRole.INTERVIEWER),
  requireInterviewerApproval,
  interviewController.getInterviewerEarnings
);

// ==================== NEW INTERVIEW REQUEST/CLAIM FLOW ====================

/**
 * @swagger
 * /interviews/request:
 *   post:
 *     tags: [Interviews]
 *     summary: Create an interview request (Job Seeker only - selects skills only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - requestedSkills
 *             properties:
 *               requestedSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *               preferredDuration:
 *                 type: number
 *               notes:
 *                 type: string
 */
router.post(
  '/request',
  authenticate,
  authorize(UserRole.JOB_SEEKER),
  interviewController.createInterviewRequest
);

/**
 * @swagger
 * /interviews/my-requests:
 *   get:
 *     tags: [Interviews]
 *     summary: Get my interview requests (Job Seeker only - pending/expired)
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/my-requests',
  authenticate,
  authorize(UserRole.JOB_SEEKER),
  interviewController.getMyInterviewRequests
);

/**
 * @swagger
 * /interviews/available-requests:
 *   get:
 *     tags: [Interviews]
 *     summary: Get available interview requests matching expertise (Interviewer only)
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/available-requests',
  authenticate,
  authorize(UserRole.INTERVIEWER),
  requireInterviewerApproval,
  interviewController.getAvailableInterviewRequests
);

/**
 * @swagger
 * /interviews/{id}/claim:
 *   post:
 *     tags: [Interviews]
 *     summary: Claim an interview request and set schedule (Interviewer only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - scheduledAt
 *             properties:
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *               duration:
 *                 type: number
 */
router.post(
  '/:id/claim',
  authenticate,
  authorize(UserRole.INTERVIEWER),
  requireInterviewerApproval,
  interviewController.claimInterviewRequest
);

// ==================== END NEW INTERVIEW REQUEST/CLAIM FLOW ====================

/**
 * @swagger
 * /interviews/{id}:
 *   get:
 *     tags: [Interviews]
 *     summary: Get interview by ID
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/:id',
  authenticate,
  interviewController.getInterviewById
);

/**
 * @swagger
 * /interviews/{id}/start:
 *   post:
 *     tags: [Interviews]
 *     summary: Start an interview (Interviewer only)
 *     security: [{ bearerAuth: [] }]
 */
router.post(
  '/:id/start',
  authenticate,
  authorize(UserRole.INTERVIEWER),
  requireInterviewerApproval,
  interviewController.startInterview
);

/**
 * @swagger
 * /interviews/{id}/complete:
 *   post:
 *     tags: [Interviews]
 *     summary: Complete an interview (Interviewer only)
 *     security: [{ bearerAuth: [] }]
 */
router.post(
  '/:id/complete',
  authenticate,
  authorize(UserRole.INTERVIEWER),
  requireInterviewerApproval,
  interviewController.completeInterview
);

/**
 * @swagger
 * /interviews/{id}/cancel:
 *   post:
 *     tags: [Interviews]
 *     summary: Cancel an interview
 *     security: [{ bearerAuth: [] }]
 */
router.post(
  '/:id/cancel',
  authenticate,
  authorize(UserRole.JOB_SEEKER, UserRole.INTERVIEWER),
  interviewController.cancelInterview
);

/**
 * @swagger
 * /interviews/{id}/feedback:
 *   post:
 *     tags: [Interviews]
 *     summary: Submit feedback (Interviewer only)
 *     security: [{ bearerAuth: [] }]
 */
router.post(
  '/:id/feedback',
  authenticate,
  authorize(UserRole.INTERVIEWER),
  requireInterviewerApproval,
  validateBody(interviewFeedbackSchema),
  interviewController.submitFeedback
);

/**
 * @swagger
 * /interviews/{id}/recording:
 *   post:
 *     tags: [Interviews]
 *     summary: Upload interview recording (Interviewer only)
 *     security: [{ bearerAuth: [] }]
 */
router.post(
  '/:id/recording',
  authenticate,
  authorize(UserRole.INTERVIEWER),
  requireInterviewerApproval,
  uploadVideo.single('video'),
  interviewController.uploadRecording
);

/**
 * @swagger
 * /interviews/{id}/recording-url:
 *   get:
 *     tags: [Interviews]
 *     summary: Get signed URL for recording
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/:id/recording-url',
  authenticate,
  interviewController.getRecordingUrl
);

/**
 * @swagger
 * /interviews/payment/create-order:
 *   post:
 *     tags: [Interviews]
 *     summary: Create payment order for interview
 *     security: [{ bearerAuth: [] }]
 */
router.post(
  '/payment/create-order',
  authenticate,
  authorize(UserRole.JOB_SEEKER),
  paymentLimiter,
  interviewController.createPaymentOrder
);

/**
 * @swagger
 * /interviews/payment/verify:
 *   post:
 *     tags: [Interviews]
 *     summary: Verify payment
 *     security: [{ bearerAuth: [] }]
 */
router.post(
  '/payment/verify',
  authenticate,
  authorize(UserRole.JOB_SEEKER),
  validateBody(verifyPaymentSchema),
  interviewController.verifyPayment
);

export default router;
