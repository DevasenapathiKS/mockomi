"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const auth_1 = require("../middlewares/auth");
const types_1 = require("../types");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /coupons/validate:
 *   post:
 *     tags: [Coupons]
 *     summary: Validate a coupon code
 *     security: [{ bearerAuth: [] }]
 */
router.post('/validate', auth_1.authenticate, controllers_1.couponController.validateCoupon);
/**
 * @swagger
 * /coupons/usage:
 *   get:
 *     tags: [Coupons]
 *     summary: Get user's coupon usage stats
 *     security: [{ bearerAuth: [] }]
 */
router.get('/usage', auth_1.authenticate, controllers_1.couponController.getCouponUsage);
// ============ ADMIN ROUTES ============
/**
 * @swagger
 * /coupons:
 *   post:
 *     tags: [Coupons]
 *     summary: Create a new coupon (Admin only)
 *     security: [{ bearerAuth: [] }]
 */
router.post('/', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN), controllers_1.couponController.createCoupon);
/**
 * @swagger
 * /coupons:
 *   get:
 *     tags: [Coupons]
 *     summary: Get all coupons (Admin only)
 *     security: [{ bearerAuth: [] }]
 */
router.get('/', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN), controllers_1.couponController.getAllCoupons);
/**
 * @swagger
 * /coupons/{id}:
 *   put:
 *     tags: [Coupons]
 *     summary: Update a coupon (Admin only)
 *     security: [{ bearerAuth: [] }]
 */
router.put('/:id', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN), controllers_1.couponController.updateCoupon);
exports.default = router;
//# sourceMappingURL=coupon.routes.js.map