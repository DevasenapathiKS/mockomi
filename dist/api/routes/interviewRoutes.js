"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const InterviewController_1 = require("../controllers/InterviewController");
const authMiddleware_1 = require("../../core/authMiddleware");
const validate_1 = require("../../core/validate");
const interviewSchemas_1 = require("../../modules/interview/validation/interviewSchemas");
const router = (0, express_1.Router)();
exports.router = router;
const controller = new InterviewController_1.InterviewController();
/**
 * @openapi
 * tags:
 *   - name: Interviews
 *     description: Interview execution APIs
 */
/**
 * @openapi
 * /api/interviews:
 *   post:
 *     summary: Start a new interview session
 *     tags: [Interviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - candidateId
 *               - roleProfileId
 *               - level
 *             properties:
 *               candidateId:
 *                 type: string
 *               roleProfileId:
 *                 type: string
 *               level:
 *                 type: string
 *                 enum: [confidence, guided, simulation, stress]
 *     responses:
 *       200:
 *         description: Interview session started
 */
/**
 * @openapi
 * /api/interviews/history:
 *   get:
 *     summary: Get interview history (paginated)
 *     tags: [Interviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       200:
 *         description: Interview history
 *       401:
 *         description: Unauthorized
 */
/**
 * @openapi
 * /api/interviews/{id}/complete:
 *   post:
 *     summary: Complete an interview session
 *     tags: [Interviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sectionScores
 *             properties:
 *               sectionScores:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - sectionId
 *                     - rawScore
 *                   properties:
 *                     sectionId:
 *                       type: string
 *                     rawScore:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 10
 *     responses:
 *       200:
 *         description: Interview completed
 */
/**
 * @openapi
 * /api/interviews/{id}:
 *   get:
 *     summary: Get interview session details
 *     tags: [Interviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Interview session details
 */
router.post('/', authMiddleware_1.authenticate, (0, validate_1.validate)(interviewSchemas_1.startInterviewSchema), controller.startInterview);
router.get('/', authMiddleware_1.authenticate, controller.getList);
router.get('/history', authMiddleware_1.authenticate, controller.getHistory);
router.post('/:id/complete', authMiddleware_1.authenticate, (0, validate_1.validate)(interviewSchemas_1.completeInterviewSchema), controller.completeInterview);
router.get('/:id', authMiddleware_1.authenticate, controller.getInterview);
