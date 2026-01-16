import { Router } from 'express';
import { couponController } from '../controllers';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../types';

const router = Router();

/**
 * @swagger
 * /coupons/validate:
 *   post:
 *     tags: [Coupons]
 *     summary: Validate a coupon code
 *     security: [{ bearerAuth: [] }]
 */
router.post(
  '/validate',
  authenticate,
  couponController.validateCoupon
);

/**
 * @swagger
 * /coupons/usage:
 *   get:
 *     tags: [Coupons]
 *     summary: Get user's coupon usage stats
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/usage',
  authenticate,
  couponController.getCouponUsage
);

// ============ ADMIN ROUTES ============

/**
 * @swagger
 * /coupons:
 *   post:
 *     tags: [Coupons]
 *     summary: Create a new coupon (Admin only)
 *     security: [{ bearerAuth: [] }]
 */
router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  couponController.createCoupon
);

/**
 * @swagger
 * /coupons:
 *   get:
 *     tags: [Coupons]
 *     summary: Get all coupons (Admin only)
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  couponController.getAllCoupons
);

/**
 * @swagger
 * /coupons/{id}:
 *   put:
 *     tags: [Coupons]
 *     summary: Update a coupon (Admin only)
 *     security: [{ bearerAuth: [] }]
 */
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  couponController.updateCoupon
);

export default router;
