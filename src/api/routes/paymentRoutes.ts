import { Router } from 'express';

import { authenticate } from '../../core/authMiddleware';
import { PaymentController } from '../../modules/payment/controllers/PaymentController';

const router = Router();
const controller = new PaymentController();

router.post('/payments/create-order', authenticate, controller.createOrder);
router.post('/payments/verify', authenticate, controller.verify);
router.post('/payments/webhook', controller.webhook);

export { router };

