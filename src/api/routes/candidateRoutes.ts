import { Router } from 'express';

import { authenticate } from '../../core/authMiddleware';
import { CandidateDashboardController } from '../../modules/candidate/controllers/CandidateDashboardController';

const router = Router();
const controller = new CandidateDashboardController();

/**
 * @openapi
 * tags:
 *   - name: Candidate
 *     description: Candidate-facing APIs
 */

/**
 * @openapi
 * /api/candidate/dashboard:
 *   get:
 *     summary: Get consolidated candidate dashboard
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/candidate/dashboard', authenticate, controller.getDashboard);

export { router };

