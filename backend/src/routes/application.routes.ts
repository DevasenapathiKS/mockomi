import { Router } from 'express';
import { applicationController } from '../controllers';
import { authenticate, authorize } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { UserRole } from '../types';
import { createApplicationSchema, updateApplicationStatusSchema } from '../validations';

const router = Router();

/**
 * @swagger
 * /applications/job/{jobId}:
 *   post:
 *     tags: [Applications]
 *     summary: Apply to a job
 *     security: [{ bearerAuth: [] }]
 */
router.post(
  '/job/:jobId',
  authenticate,
  authorize(UserRole.JOB_SEEKER),
  validateBody(createApplicationSchema),
  applicationController.applyToJob
);

/**
 * @swagger
 * /applications/my-applications:
 *   get:
 *     tags: [Applications]
 *     summary: Get my applications
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/my-applications',
  authenticate,
  authorize(UserRole.JOB_SEEKER),
  applicationController.getMyApplications
);

/**
 * @swagger
 * /applications/{id}:
 *   get:
 *     tags: [Applications]
 *     summary: Get application by ID
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/:id',
  authenticate,
  applicationController.getApplicationById
);

/**
 * @swagger
 * /applications/{id}/status:
 *   patch:
 *     tags: [Applications]
 *     summary: Update application status (Employer only)
 *     security: [{ bearerAuth: [] }]
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize(UserRole.EMPLOYER),
  validateBody(updateApplicationStatusSchema),
  applicationController.updateApplicationStatus
);

/**
 * @swagger
 * /applications/{id}/withdraw:
 *   post:
 *     tags: [Applications]
 *     summary: Withdraw application
 *     security: [{ bearerAuth: [] }]
 */
router.post(
  '/:id/withdraw',
  authenticate,
  authorize(UserRole.JOB_SEEKER),
  applicationController.withdrawApplication
);

/**
 * @swagger
 * /applications/stats:
 *   get:
 *     tags: [Applications]
 *     summary: Get application statistics (Employer only)
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/stats/summary',
  authenticate,
  authorize(UserRole.EMPLOYER),
  applicationController.getApplicationStats
);

export default router;
