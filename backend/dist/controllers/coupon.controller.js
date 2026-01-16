"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCoupon = exports.getAllCoupons = exports.createCoupon = exports.getCouponUsage = exports.validateCoupon = void 0;
const services_1 = require("../services");
const errorHandler_1 = require("../middlewares/errorHandler");
/**
 * Validate a coupon code
 */
exports.validateCoupon = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { couponCode } = req.body;
    if (!couponCode || typeof couponCode !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'Coupon code is required',
        });
    }
    const result = await services_1.couponService.validateCoupon(couponCode, req.user.id);
    res.status(200).json({
        success: result.valid,
        data: result,
    });
});
/**
 * Get user's coupon usage stats
 */
exports.getCouponUsage = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { couponCode } = req.query;
    if (!couponCode || typeof couponCode !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'Coupon code is required',
        });
    }
    const usage = await services_1.couponService.getUserCouponUsage(req.user.id, couponCode);
    res.status(200).json({
        success: true,
        data: usage,
    });
});
/**
 * Admin: Create a new coupon
 */
exports.createCoupon = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { code, description, perUserLimit, globalLimit, expiresAt } = req.body;
    if (!code || !description || !perUserLimit) {
        return res.status(400).json({
            success: false,
            message: 'Code, description, and perUserLimit are required',
        });
    }
    const coupon = await services_1.couponService.createCoupon({
        code,
        description,
        perUserLimit,
        globalLimit,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });
    res.status(201).json({
        success: true,
        message: 'Coupon created successfully',
        data: coupon,
    });
});
/**
 * Admin: Get all coupons
 */
exports.getAllCoupons = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const coupons = await services_1.couponService.getAllCoupons();
    res.status(200).json({
        success: true,
        data: coupons,
    });
});
/**
 * Admin: Update coupon
 */
exports.updateCoupon = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const coupon = await services_1.couponService.updateCoupon(id, updates);
    res.status(200).json({
        success: true,
        message: 'Coupon updated successfully',
        data: coupon,
    });
});
//# sourceMappingURL=coupon.controller.js.map