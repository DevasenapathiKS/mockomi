import { Router } from 'express';

import { authenticate } from '../../core/authMiddleware';
import { BookingController } from '../../modules/booking/controllers/BookingController';

const router = Router();
const controller = new BookingController();

router.post('/bookings', authenticate, controller.book);

export { router };

