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
 * /applications/job/{jobId}:
 *   post:
 *     tags: [Applications]
 *     summary: Apply to a job
 *     security: [{ bearerAuth: [] }]
 */
router.post('/job/:jobId', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.JOB_SEEKER), (0, validate_1.validateBody)(validations_1.createApplicationSchema), controllers_1.applicationController.applyToJob);
/**
 * @swagger
 * /applications/my-applications:
 *   get:
 *     tags: [Applications]
 *     summary: Get my applications
 *     security: [{ bearerAuth: [] }]
 */
router.get('/my-applications', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.JOB_SEEKER), controllers_1.applicationController.getMyApplications);
/**
 * @swagger
 * /applications/{id}:
 *   get:
 *     tags: [Applications]
 *     summary: Get application by ID
 *     security: [{ bearerAuth: [] }]
 */
router.get('/:id', auth_1.authenticate, controllers_1.applicationController.getApplicationById);
/**
 * @swagger
 * /applications/{id}/status:
 *   patch:
 *     tags: [Applications]
 *     summary: Update application status (Employer only)
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/:id/status', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.EMPLOYER), (0, validate_1.validateBody)(validations_1.updateApplicationStatusSchema), controllers_1.applicationController.updateApplicationStatus);
/**
 * @swagger
 * /applications/{id}/withdraw:
 *   post:
 *     tags: [Applications]
 *     summary: Withdraw application
 *     security: [{ bearerAuth: [] }]
 */
router.post('/:id/withdraw', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.JOB_SEEKER), controllers_1.applicationController.withdrawApplication);
/**
 * @swagger
 * /applications/stats:
 *   get:
 *     tags: [Applications]
 *     summary: Get application statistics (Employer only)
 *     security: [{ bearerAuth: [] }]
 */
router.get('/stats/summary', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.EMPLOYER), controllers_1.applicationController.getApplicationStats);
exports.default = router;
//# sourceMappingURL=application.routes.js.map