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

  res.status(200).json({
    success: result.valid,
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
  const { code, description, perUserLimit, globalLimit, expiresAt } = req.body;

  if (!code || !description || !perUserLimit) {
    return res.status(400).json({
      success: false,
      message: 'Code, description, and perUserLimit are required',
    });
  }

  const coupon = await couponService.createCoupon({
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
  const updates = req.body;

  const coupon = await couponService.updateCoupon(id, updates);

  res.status(200).json({
    success: true,
    message: 'Coupon updated successfully',
    data: coupon,
  });
});
