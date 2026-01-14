import { Router } from 'express';
import authRoutes from './auth.routes';
import jobRoutes from './job.routes';
import applicationRoutes from './application.routes';
import interviewRoutes from './interview.routes';
import profileRoutes from './profile.routes';
import paymentRoutes from './payment.routes';
import notificationRoutes from './notification.routes';
import adminRoutes from './admin.routes';
import withdrawalRoutes from './withdrawal.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);
router.use('/interviews', interviewRoutes);
router.use('/profile', profileRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/withdrawals', withdrawalRoutes);

export default router;
