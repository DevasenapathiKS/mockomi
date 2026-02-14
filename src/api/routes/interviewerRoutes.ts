import { Router } from 'express';

import { authenticate } from '../../core/authMiddleware';
import { InterviewerController } from '../../modules/interviewer/controllers/InterviewerController';

const router = Router();
const controller = new InterviewerController();

// Public discovery (no auth)
router.get('/interviewers', controller.getPublicList);

router.get('/interviewer/profile', authenticate, controller.getMyProfile);
router.post('/interviewer/apply', authenticate, controller.apply);
router.patch('/interviewer/:userId/verify', authenticate, controller.verify);

export { router };

