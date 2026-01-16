import { Response } from 'express';
/**
 * Validate a coupon code
 */
export declare const validateCoupon: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get user's coupon usage stats
 */
export declare const getCouponUsage: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Admin: Create a new coupon
 */
export declare const createCoupon: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Admin: Get all coupons
 */
export declare const getAllCoupons: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Admin: Update coupon
 */
export declare const updateCoupon: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=coupon.controller.d.ts.map