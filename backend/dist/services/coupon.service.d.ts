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
declare class CouponService {
    /**
     * Validate a coupon for a user
     */
    validateCoupon(couponCode: string, userId: string): Promise<ValidateCouponResult>;
    /**
     * Apply a coupon (increment usage)
     * This should be called atomically during interview creation
     */
    applyCoupon(couponCode: string, userId: string): Promise<ApplyCouponResult>;
    /**
     * Get user's coupon usage stats
     */
    getUserCouponUsage(userId: string, couponCode: string): Promise<{
        usageCount: number;
        remainingUses: number;
        coupon?: any;
    }>;
    /**
     * Admin: Create a new coupon
     */
    createCoupon(data: {
        code: string;
        description: string;
        perUserLimit: number;
        globalLimit?: number;
        expiresAt?: Date;
    }): Promise<any>;
    /**
     * Admin: Get all coupons
     */
    getAllCoupons(): Promise<any[]>;
    /**
     * Admin: Update coupon
     */
    updateCoupon(couponId: string, updates: {
        description?: string;
        perUserLimit?: number;
        globalLimit?: number;
        isActive?: boolean;
        expiresAt?: Date;
    }): Promise<any>;
}
declare const _default: CouponService;
export default _default;
//# sourceMappingURL=coupon.service.d.ts.map