"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const auth_1 = require("../middlewares/auth");
const validate_1 = require("../middlewares/validate");
const upload_1 = require("../middlewares/upload");
const rateLimiter_1 = require("../middlewares/rateLimiter");
const types_1 = require("../types");
const validations_1 = require("../validations");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /interviews/interviewers:
 *   get:
 *     tags: [Interviews]
 *     summary: Get available interviewers
 *     security: [{ bearerAuth: [] }]
 */
router.get('/interviewers', auth_1.authenticate, controllers_1.interviewController.getAvailableInterviewers);
/**
 * @swagger
 * /interviews/payment-check:
 *   get:
 *     tags: [Interviews]
 *     summary: Check if payment is required
 *     security: [{ bearerAuth: [] }]
 */
router.get('/payment-check', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.JOB_SEEKER), controllers_1.interviewController.checkPaymentRequired);
/**
 * @swagger
 * /interviews:
 *   post:
 *     tags: [Interviews]
 *     summary: Schedule a mock interview
 *     security: [{ bearerAuth: [] }]
 */
router.post('/', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.JOB_SEEKER), (0, validate_1.validateBody)(validations_1.scheduleInterviewSchema), controllers_1.interviewController.scheduleInterview);
/**
 * @swagger
 * /interviews/my-interviews:
 *   get:
 *     tags: [Interviews]
 *     summary: Get my interviews
 *     security: [{ bearerAuth: [] }]
 */
router.get('/my-interviews', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.JOB_SEEKER, types_1.UserRole.INTERVIEWER), controllers_1.interviewController.getMyInterviews);
/**
 * @swagger
 * /interviews/earnings:
 *   get:
 *     tags: [Interviews]
 *     summary: Get interviewer earnings
 *     security: [{ bearerAuth: [] }]
 */
router.get('/earnings', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.INTERVIEWER), auth_1.requireInterviewerApproval, controllers_1.interviewController.getInterviewerEarnings);
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
router.post('/request', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.JOB_SEEKER), controllers_1.interviewController.createInterviewRequest);
/**
 * @swagger
 * /interviews/my-requests:
 *   get:
 *     tags: [Interviews]
 *     summary: Get my interview requests (Job Seeker only - pending/expired)
 *     security: [{ bearerAuth: [] }]
 */
router.get('/my-requests', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.JOB_SEEKER), controllers_1.interviewController.getMyInterviewRequests);
/**
 * @swagger
 * /interviews/available-requests:
 *   get:
 *     tags: [Interviews]
 *     summary: Get available interview requests matching expertise (Interviewer only)
 *     security: [{ bearerAuth: [] }]
 */
router.get('/available-requests', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.INTERVIEWER), auth_1.requireInterviewerApproval, controllers_1.interviewController.getAvailableInterviewRequests);
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
router.post('/:id/claim', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.INTERVIEWER), auth_1.requireInterviewerApproval, controllers_1.interviewController.claimInterviewRequest);
// ==================== END NEW INTERVIEW REQUEST/CLAIM FLOW ====================
/**
 * @swagger
 * /interviews/{id}:
 *   get:
 *     tags: [Interviews]
 *     summary: Get interview by ID
 *     security: [{ bearerAuth: [] }]
 */
router.get('/:id', auth_1.authenticate, controllers_1.interviewController.getInterviewById);
/**
 * @swagger
 * /interviews/{id}/start:
 *   post:
 *     tags: [Interviews]
 *     summary: Start an interview (Interviewer only)
 *     security: [{ bearerAuth: [] }]
 */
router.post('/:id/start', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.INTERVIEWER), auth_1.requireInterviewerApproval, controllers_1.interviewController.startInterview);
/**
 * @swagger
 * /interviews/{id}/complete:
 *   post:
 *     tags: [Interviews]
 *     summary: Complete an interview (Interviewer only)
 *     security: [{ bearerAuth: [] }]
 */
router.post('/:id/complete', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.INTERVIEWER), auth_1.requireInterviewerApproval, controllers_1.interviewController.completeInterview);
/**
 * @swagger
 * /interviews/{id}/cancel:
 *   post:
 *     tags: [Interviews]
 *     summary: Cancel an interview
 *     security: [{ bearerAuth: [] }]
 */
router.post('/:id/cancel', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.JOB_SEEKER, types_1.UserRole.INTERVIEWER), controllers_1.interviewController.cancelInterview);
/**
 * @swagger
 * /interviews/{id}/feedback:
 *   post:
 *     tags: [Interviews]
 *     summary: Submit feedback (Interviewer only)
 *     security: [{ bearerAuth: [] }]
 */
router.post('/:id/feedback', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.INTERVIEWER), auth_1.requireInterviewerApproval, (0, validate_1.validateBody)(validations_1.interviewFeedbackSchema), controllers_1.interviewController.submitFeedback);
/**
 * @swagger
 * /interviews/{id}/recording:
 *   post:
 *     tags: [Interviews]
 *     summary: Upload interview recording (Interviewer only)
 *     security: [{ bearerAuth: [] }]
 */
router.post('/:id/recording', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.INTERVIEWER), auth_1.requireInterviewerApproval, upload_1.uploadVideo.single('video'), controllers_1.interviewController.uploadRecording);
/**
 * @swagger
 * /interviews/{id}/recording-url:
 *   get:
 *     tags: [Interviews]
 *     summary: Get signed URL for recording
 *     security: [{ bearerAuth: [] }]
 */
router.get('/:id/recording-url', auth_1.authenticate, controllers_1.interviewController.getRecordingUrl);
/**
 * @swagger
 * /interviews/payment/create-order:
 *   post:
 *     tags: [Interviews]
 *     summary: Create payment order for interview
 *     security: [{ bearerAuth: [] }]
 */
router.post('/payment/create-order', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.JOB_SEEKER), rateLimiter_1.paymentLimiter, controllers_1.interviewController.createPaymentOrder);
/**
 * @swagger
 * /interviews/payment/verify:
 *   post:
 *     tags: [Interviews]
 *     summary: Verify payment
 *     security: [{ bearerAuth: [] }]
 */
router.post('/payment/verify', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.JOB_SEEKER), (0, validate_1.validateBody)(validations_1.verifyPaymentSchema), controllers_1.interviewController.verifyPayment);
exports.default = router;
//# sourceMappingURL=interview.routes.js.map