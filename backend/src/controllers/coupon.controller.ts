import { Response } from 'express';
import { couponService } from '../services';
import { AuthRequest } from '../types';
import { asyncHandler } from '../middlewares/errorHandler';

/**
 * Validate a coupon code
 */
export const validateCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { couponCode } = req.body;

  if (!couponCode || typeof couponCode !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Coupon code is required',
    });
  }

  const result = await couponService.validateCoupon(couponCode, req.user!.id);

  // Always return success: true, validation result is in data.valid
  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Get user's coupon usage stats
 */
export const getCouponUsage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { couponCode } = req.query;

  if (!couponCode || typeof couponCode !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Coupon code is required',
    });
  }

  const usage = await couponService.getUserCouponUsage(req.user!.id, couponCode);

  res.status(200).json({
    success: true,
    data: usage,
  });
});

/**
 * Admin: Create a new coupon
 */
export const createCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
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

  const coupon = await couponService.createCoupon({
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
export const getAllCoupons = asyncHandler(async (req: AuthRequest, res: Response) => {
  const coupons = await couponService.getAllCoupons();

  res.status(200).json({
    success: true,
    data: coupons,
  });
});

/**
 * Admin: Update coupon
 */
export const updateCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
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

  const updates: any = {};
  if (description !== undefined) updates.description = description;
  if (discountType !== undefined) updates.discountType = discountType;
  if (discountValue !== undefined) updates.discountValue = discountValue;
  if (perUserLimit !== undefined) updates.perUserLimit = perUserLimit;
  if (globalLimit !== undefined) updates.globalLimit = globalLimit;
  if (isActive !== undefined) updates.isActive = isActive;
  if (expiresAt !== undefined) updates.expiresAt = expiresAt ? new Date(expiresAt) : undefined;

  const coupon = await couponService.updateCoupon(id, updates);

  res.status(200).json({
    success: true,
    message: 'Coupon updated successfully',
    data: coupon,
  });
});
