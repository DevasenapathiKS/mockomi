import { Router } from 'express';

import { ProgressController } from '../controllers/ProgressController';
import { authenticate } from "../../core/authMiddleware";

const router = Router();
const controller = new ProgressController();

/**
 * @openapi
 * tags:
 *   - name: Progress
 *     description: Candidate progress APIs
 */

/**
 * @openapi
 * /api/progress/{candidateId}/{roleProfileId}:
 *   get:
 *     summary: Get candidate progress for a role profile
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: candidateId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: roleProfileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Candidate progress found
 *       404:
 *         description: Progress not found
 */

router.get('/:candidateId/:roleProfileId', authenticate, controller.getProgress);

export { router };

