import { Router } from 'express';
import { getHealth, getHealthLiveness, getHealthReadiness } from '../controllers/health.controller';

const router = Router();

router.get('/health', getHealth);
router.get('/health/live', getHealthLiveness);
router.get('/health/ready', getHealthReadiness);

export default router;
