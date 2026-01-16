"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Coupon_1 = __importDefault(require("../models/Coupon"));
const CouponUsage_1 = __importDefault(require("../models/CouponUsage"));
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
class CouponService {
    /**
     * Validate a coupon for a user
     */
    async validateCoupon(couponCode, userId) {
        const code = couponCode.toUpperCase().trim();
        // Find coupon
        const coupon = await Coupon_1.default.findOne({ code, isActive: true });
        if (!coupon) {
            return {
                valid: false,
                remainingUses: 0,
                message: 'Invalid or inactive coupon code',
            };
        }
        // Check expiry
        if (coupon.expiresAt && new Date() > coupon.expiresAt) {
            return {
                valid: false,
                remainingUses: 0,
                message: 'This coupon has expired',
            };
        }
        // Check global limit (if set)
        if (coupon.globalLimit && coupon.totalUsed >= coupon.globalLimit) {
            return {
                valid: false,
                remainingUses: 0,
                message: 'This coupon has reached its global usage limit',
            };
        }
        // Get user's usage
        const userUsage = await CouponUsage_1.default.findOne({
            userId,
            couponId: coupon._id,
        });
        const userUsageCount = userUsage?.usageCount || 0;
        const remainingUses = Math.max(0, coupon.perUserLimit - userUsageCount);
        if (remainingUses <= 0) {
            return {
                valid: false,
                remainingUses: 0,
                message: `You have reached the usage limit for this coupon (${coupon.perUserLimit} uses)`,
            };
        }
        return {
            valid: true,
            remainingUses,
            message: `Coupon applied successfully. ${remainingUses} use${remainingUses !== 1 ? 's' : ''} remaining.`,
            coupon: {
                _id: coupon._id,
                code: coupon.code,
                description: coupon.description,
                perUserLimit: coupon.perUserLimit,
            },
        };
    }
    /**
     * Apply a coupon (increment usage)
     * This should be called atomically during interview creation
     */
    async applyCoupon(couponCode, userId) {
        const code = couponCode.toUpperCase().trim();
        // Re-validate coupon (security: never trust frontend)
        const validation = await this.validateCoupon(code, userId);
        if (!validation.valid) {
            throw new errors_1.AppError(validation.message, 400);
        }
        const coupon = await Coupon_1.default.findOne({ code, isActive: true });
        if (!coupon) {
            throw new errors_1.AppError('Coupon not found', 404);
        }
        // Use transaction-like approach with findOneAndUpdate for atomicity
        const userUsage = await CouponUsage_1.default.findOneAndUpdate({ userId, couponId: coupon._id }, {
            $inc: { usageCount: 1 },
            $set: { lastUsedAt: new Date() },
            $setOnInsert: { userId, couponId: coupon._id },
        }, { upsert: true, new: true });
        // Increment global usage count
        await Coupon_1.default.findByIdAndUpdate(coupon._id, {
            $inc: { totalUsed: 1 },
        });
        const remainingUses = Math.max(0, coupon.perUserLimit - userUsage.usageCount);
        logger_1.default.info(`Coupon ${code} applied by user ${userId}. Usage: ${userUsage.usageCount}/${coupon.perUserLimit}`);
        return {
            success: true,
            message: 'Coupon applied successfully',
            usageCount: userUsage.usageCount,
            remainingUses,
        };
    }
    /**
     * Get user's coupon usage stats
     */
    async getUserCouponUsage(userId, couponCode) {
        const code = couponCode.toUpperCase().trim();
        const coupon = await Coupon_1.default.findOne({ code, isActive: true });
        if (!coupon) {
            return {
                usageCount: 0,
                remainingUses: 0,
            };
        }
        const userUsage = await CouponUsage_1.default.findOne({
            userId,
            couponId: coupon._id,
        });
        const usageCount = userUsage?.usageCount || 0;
        const remainingUses = Math.max(0, coupon.perUserLimit - usageCount);
        return {
            usageCount,
            remainingUses,
            coupon: {
                _id: coupon._id,
                code: coupon.code,
                description: coupon.description,
                perUserLimit: coupon.perUserLimit,
            },
        };
    }
    /**
     * Admin: Create a new coupon
     */
    async createCoupon(data) {
        const code = data.code.toUpperCase().trim();
        // Check if coupon already exists
        const existing = await Coupon_1.default.findOne({ code });
        if (existing) {
            throw new errors_1.AppError('Coupon code already exists', 409);
        }
        const coupon = await Coupon_1.default.create({
            code,
            description: data.description,
            perUserLimit: data.perUserLimit,
            globalLimit: data.globalLimit,
            expiresAt: data.expiresAt,
            isActive: true,
            totalUsed: 0,
        });
        logger_1.default.info(`Coupon created: ${code}`);
        return coupon;
    }
    /**
     * Admin: Get all coupons
     */
    async getAllCoupons() {
        return Coupon_1.default.find().sort({ createdAt: -1 });
    }
    /**
     * Admin: Update coupon
     */
    async updateCoupon(couponId, updates) {
        const coupon = await Coupon_1.default.findByIdAndUpdate(couponId, { $set: updates }, { new: true });
        if (!coupon) {
            throw new errors_1.AppError('Coupon not found', 404);
        }
        return coupon;
    }
}
exports.default = new CouponService();
//# sourceMappingURL=coupon.service.js.map