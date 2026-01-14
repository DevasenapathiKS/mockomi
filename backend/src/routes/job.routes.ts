import { Router } from 'express';
import { jobController } from '../controllers';
import { authenticate, authorize, optionalAuth } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { UserRole } from '../types';
import { createJobSchema, updateJobSchema } from '../validations';

const router = Router();

/**
 * @swagger
 * /jobs:
 *   get:
 *     tags: [Jobs]
 *     summary: Search and list jobs
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: skills
 *         schema: { type: string }
 *         description: Comma-separated skills
 *       - in: query
 *         name: experienceLevel
 *         schema: { type: string }
 *       - in: query
 *         name: employmentType
 *         schema: { type: string }
 *       - in: query
 *         name: location
 *         schema: { type: string }
 *       - in: query
 *         name: isRemote
 *         schema: { type: boolean }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 */
router.get('/', optionalAuth, jobController.searchJobs);

/**
 * @swagger
 * /jobs/{id}:
 *   get:
 *     tags: [Jobs]
 *     summary: Get job by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 */
router.get('/:id', optionalAuth, jobController.getJobById);

/**
 * @swagger
 * /jobs:
 *   post:
 *     tags: [Jobs]
 *     summary: Create a new job
 *     security: [{ bearerAuth: [] }]
 */
router.post(
  '/',
  authenticate,
  authorize(UserRole.EMPLOYER),
  validateBody(createJobSchema),
  jobController.createJob
);

/**
 * @swagger
 * /jobs/{id}:
 *   put:
 *     tags: [Jobs]
 *     summary: Update a job
 *     security: [{ bearerAuth: [] }]
 */
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.EMPLOYER),
  validateBody(updateJobSchema),
  jobController.updateJob
);

/**
 * @swagger
 * /jobs/{id}:
 *   delete:
 *     tags: [Jobs]
 *     summary: Delete a job
 *     security: [{ bearerAuth: [] }]
 */
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.EMPLOYER),
  jobController.deleteJob
);

/**
 * @swagger
 * /jobs/{id}/publish:
 *   post:
 *     tags: [Jobs]
 *     summary: Publish a job
 *     security: [{ bearerAuth: [] }]
 */
router.patch(
  '/:id/publish',
  authenticate,
  authorize(UserRole.EMPLOYER),
  jobController.publishJob
);

/**
 * @swagger
 * /jobs/{id}/close:
 *   post:
 *     tags: [Jobs]
 *     summary: Close a job
 *     security: [{ bearerAuth: [] }]
 */
router.post(
  '/:id/close',
  authenticate,
  authorize(UserRole.EMPLOYER),
  jobController.closeJob
);

/**
 * @swagger
 * /jobs/{id}/applications:
 *   get:
 *     tags: [Jobs]
 *     summary: Get applications for a job
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/:id/applications',
  authenticate,
  authorize(UserRole.EMPLOYER),
  jobController.getJobApplications
);

/**
 * @swagger
 * /jobs/employer/my-jobs:
 *   get:
 *     tags: [Jobs]
 *     summary: Get employer's jobs
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/employer/my-jobs',
  authenticate,
  authorize(UserRole.EMPLOYER),
  jobController.getEmployerJobs
);

export default router;
