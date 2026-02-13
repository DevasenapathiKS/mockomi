import { Router } from 'express';

import { InterviewController } from '../controllers/InterviewController';
import { authenticate } from "../../core/authMiddleware";

import { validate } from "../../core/validate";
import {
  startInterviewSchema,
  completeInterviewSchema
} from "../../modules/interview/validation/interviewSchemas";

const router = Router();
const controller = new InterviewController();

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


router.post('/', authenticate, validate(startInterviewSchema), controller.startInterview);
router.get('/', authenticate, controller.getList);
router.get('/history', authenticate, controller.getHistory);
router.post('/:id/complete', authenticate, validate(completeInterviewSchema), controller.completeInterview);
router.get('/:id', authenticate, controller.getInterview);

export { router };
