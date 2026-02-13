import { Router } from 'express';

import { authenticate } from '../../core/authMiddleware';
import { SessionController } from '../../modules/session/controllers/SessionController';

const router = Router();
const controller = new SessionController();

router.post('/sessions/:id/start', authenticate, controller.start);
router.post('/sessions/:id/submit-score', authenticate, controller.submitScore);
router.post('/sessions/:id/reschedule', authenticate, controller.reschedule);
router.post('/sessions/:id/rate', authenticate, controller.rate);
router.post('/sessions/:id/join-token', authenticate, controller.joinToken);

export { router };

