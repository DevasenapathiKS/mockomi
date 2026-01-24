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
    // Always return success: true, validation result is in data.valid
    res.status(200).json({
        success: true,
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
    const { code, description, discountType, discountValue, perUserLimit, globalLimit, expiresAt } = req.body;
    if (!code || !description || !discountType || discountValue === undefined || !perUserLimit) {
        return res.status(400).json({
            success: false,
            message: 'Code, description, discountType, discountValue, and perUserLimit are required',
        });
    }
    // Validate discount value based on type
    if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
        return res.status(400).json({
            success: false,
            message: 'Percentage discount must be between 0 and 100',
        });
    }
    if (discountType === 'flat' && discountValue < 0) {
        return res.status(400).json({
            success: false,
            message: 'Flat discount must be greater than or equal to 0',
        });
    }
    const coupon = await services_1.couponService.createCoupon({
        code,
        description,
        discountType,
        discountValue,
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
    const { code, description, discountType, discountValue, perUserLimit, globalLimit, expiresAt, isActive } = req.body;
    // Validate discount value if provided
    if (discountType && discountValue !== undefined) {
        if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
            return res.status(400).json({
                success: false,
                message: 'Percentage discount must be between 0 and 100',
            });
        }
        if (discountType === 'flat' && discountValue < 0) {
            return res.status(400).json({
                success: false,
                message: 'Flat discount must be greater than or equal to 0',
            });
        }
    }
    const updates = {};
    if (description !== undefined)
        updates.description = description;
    if (discountType !== undefined)
        updates.discountType = discountType;
    if (discountValue !== undefined)
        updates.discountValue = discountValue;
    if (perUserLimit !== undefined)
        updates.perUserLimit = perUserLimit;
    if (globalLimit !== undefined)
        updates.globalLimit = globalLimit;
    if (isActive !== undefined)
        updates.isActive = isActive;
    if (expiresAt !== undefined)
        updates.expiresAt = expiresAt ? new Date(expiresAt) : undefined;
    const coupon = await services_1.couponService.updateCoupon(id, updates);
    res.status(200).json({
        success: true,
        message: 'Coupon updated successfully',
        data: coupon,
    });
});
//# sourceMappingURL=coupon.controller.js.map