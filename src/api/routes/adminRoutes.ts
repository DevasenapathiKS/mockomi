import { Router } from 'express';

import { authenticate } from '../../core/authMiddleware';
import { AdminController } from '../../modules/admin/controllers/AdminController';

const router = Router();
const controller = new AdminController();

router.get('/admin/dashboard', authenticate, controller.getDashboard);

export { router };

