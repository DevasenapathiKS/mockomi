import { Router } from 'express';
import authRoutes from './auth.routes';
import oauthRoutes from './oauth.routes';
import jobRoutes from './job.routes';
import applicationRoutes from './application.routes';
import interviewRoutes from './interview.routes';
import profileRoutes from './profile.routes';
import paymentRoutes from './payment.routes';
import notificationRoutes from './notification.routes';
import adminRoutes from './admin.routes';
import withdrawalRoutes from './withdrawal.routes';
import couponRoutes from './coupon.routes';
import healthRoutes from './health.routes';

const router = Router();

// Health check routes (before other routes for quick access)
router.use('/health', healthRoutes);

// Authentication routes
router.use('/auth', authRoutes); // Email/password authentication
router.use('/oauth', oauthRoutes); // OAuth social login (Google, GitHub, LinkedIn)

// API routes
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);
router.use('/interviews', interviewRoutes);
router.use('/profile', profileRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/withdrawals', withdrawalRoutes);
router.use('/coupons', couponRoutes);

export default router;
