import Coupon from '../models/Coupon';
import CouponUsage from '../models/CouponUsage';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

interface ValidateCouponResult {
  valid: boolean;
  remainingUses: number;
  message: string;
  coupon?: any;
}

interface ApplyCouponResult {
  success: boolean;
  message: string;
  usageCount: number;
  remainingUses: number;
}

class CouponService {
  /**
   * Validate a coupon for a user
   */
  async validateCoupon(couponCode: string, userId: string): Promise<ValidateCouponResult> {
    const code = couponCode.toUpperCase().trim();

    // Find coupon
    const coupon = await Coupon.findOne({ code, isActive: true });
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
    const userUsage = await CouponUsage.findOne({
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
  async applyCoupon(couponCode: string, userId: string): Promise<ApplyCouponResult> {
    const code = couponCode.toUpperCase().trim();

    // Re-validate coupon (security: never trust frontend)
    const validation = await this.validateCoupon(code, userId);
    if (!validation.valid) {
      throw new AppError(validation.message, 400);
    }

    const coupon = await Coupon.findOne({ code, isActive: true });
    if (!coupon) {
      throw new AppError('Coupon not found', 404);
    }

    // Use transaction-like approach with findOneAndUpdate for atomicity
    const userUsage = await CouponUsage.findOneAndUpdate(
      { userId, couponId: coupon._id },
      {
        $inc: { usageCount: 1 },
        $set: { lastUsedAt: new Date() },
        $setOnInsert: { userId, couponId: coupon._id },
      },
      { upsert: true, new: true }
    );

    // Increment global usage count
    await Coupon.findByIdAndUpdate(coupon._id, {
      $inc: { totalUsed: 1 },
    });

    const remainingUses = Math.max(0, coupon.perUserLimit - userUsage.usageCount);

    logger.info(`Coupon ${code} applied by user ${userId}. Usage: ${userUsage.usageCount}/${coupon.perUserLimit}`);

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
  async getUserCouponUsage(userId: string, couponCode: string): Promise<{
    usageCount: number;
    remainingUses: number;
    coupon?: any;
  }> {
    const code = couponCode.toUpperCase().trim();
    const coupon = await Coupon.findOne({ code, isActive: true });

    if (!coupon) {
      return {
        usageCount: 0,
        remainingUses: 0,
      };
    }

    const userUsage = await CouponUsage.findOne({
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
  async createCoupon(data: {
    code: string;
    description: string;
    perUserLimit: number;
    globalLimit?: number;
    expiresAt?: Date;
  }): Promise<any> {
    const code = data.code.toUpperCase().trim();

    // Check if coupon already exists
    const existing = await Coupon.findOne({ code });
    if (existing) {
      throw new AppError('Coupon code already exists', 409);
    }

    const coupon = await Coupon.create({
      code,
      description: data.description,
      perUserLimit: data.perUserLimit,
      globalLimit: data.globalLimit,
      expiresAt: data.expiresAt,
      isActive: true,
      totalUsed: 0,
    });

    logger.info(`Coupon created: ${code}`);
    return coupon;
  }

  /**
   * Admin: Get all coupons
   */
  async getAllCoupons(): Promise<any[]> {
    return Coupon.find().sort({ createdAt: -1 });
  }

  /**
   * Admin: Update coupon
   */
  async updateCoupon(couponId: string, updates: {
    description?: string;
    perUserLimit?: number;
    globalLimit?: number;
    isActive?: boolean;
    expiresAt?: Date;
  }): Promise<any> {
    const coupon = await Coupon.findByIdAndUpdate(
      couponId,
      { $set: updates },
      { new: true }
    );

    if (!coupon) {
      throw new AppError('Coupon not found', 404);
    }

    return coupon;
  }
}

export default new CouponService();
