import { Router } from 'express';

import { authenticate } from '../../core/authMiddleware';
import { AvailabilityController } from '../../modules/availability/controllers/AvailabilityController';

const router = Router();
const controller = new AvailabilityController();

router.post('/availability', authenticate, controller.createSlot);
router.get('/interviewer/slots', authenticate, controller.getMySlots);

// Public interviewer slot discovery
router.get('/interviewers/:id/slots', controller.getPublicSlots);

export { router };

