"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const auth_1 = require("../middlewares/auth");
const validate_1 = require("../middlewares/validate");
const types_1 = require("../types");
const validations_1 = require("../validations");
const router = (0, express_1.Router)();
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
router.get('/', auth_1.optionalAuth, controllers_1.jobController.searchJobs);
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
router.get('/:id', auth_1.optionalAuth, controllers_1.jobController.getJobById);
/**
 * @swagger
 * /jobs:
 *   post:
 *     tags: [Jobs]
 *     summary: Create a new job
 *     security: [{ bearerAuth: [] }]
 */
router.post('/', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.EMPLOYER), (0, validate_1.validateBody)(validations_1.createJobSchema), controllers_1.jobController.createJob);
/**
 * @swagger
 * /jobs/{id}:
 *   put:
 *     tags: [Jobs]
 *     summary: Update a job
 *     security: [{ bearerAuth: [] }]
 */
router.put('/:id', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.EMPLOYER), (0, validate_1.validateBody)(validations_1.updateJobSchema), controllers_1.jobController.updateJob);
/**
 * @swagger
 * /jobs/{id}:
 *   delete:
 *     tags: [Jobs]
 *     summary: Delete a job
 *     security: [{ bearerAuth: [] }]
 */
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.EMPLOYER), controllers_1.jobController.deleteJob);
/**
 * @swagger
 * /jobs/{id}/publish:
 *   post:
 *     tags: [Jobs]
 *     summary: Publish a job
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/:id/publish', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.EMPLOYER), controllers_1.jobController.publishJob);
/**
 * @swagger
 * /jobs/{id}/close:
 *   post:
 *     tags: [Jobs]
 *     summary: Close a job
 *     security: [{ bearerAuth: [] }]
 */
router.post('/:id/close', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.EMPLOYER), controllers_1.jobController.closeJob);
/**
 * @swagger
 * /jobs/{id}/applications:
 *   get:
 *     tags: [Jobs]
 *     summary: Get applications for a job
 *     security: [{ bearerAuth: [] }]
 */
router.get('/:id/applications', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.EMPLOYER), controllers_1.jobController.getJobApplications);
/**
 * @swagger
 * /jobs/employer/my-jobs:
 *   get:
 *     tags: [Jobs]
 *     summary: Get employer's jobs
 *     security: [{ bearerAuth: [] }]
 */
router.get('/employer/my-jobs', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.EMPLOYER), controllers_1.jobController.getEmployerJobs);
exports.default = router;
//# sourceMappingURL=job.routes.js.map