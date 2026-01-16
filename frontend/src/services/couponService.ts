import api, { handleApiError } from './api';
import { ApiResponse } from '@/types';

export interface CouponValidationResult {
  valid: boolean;
  remainingUses: number;
  message: string;
  coupon?: {
    _id: string;
    code: string;
    description: string;
    perUserLimit: number;
  };
}

export interface CouponUsage {
  usageCount: number;
  remainingUses: number;
  coupon?: {
    _id: string;
    code: string;
    description: string;
    perUserLimit: number;
  };
}

export const couponService = {
  // Validate a coupon code
  validateCoupon: async (couponCode: string): Promise<CouponValidationResult> => {
    try {
      const response = await api.post<ApiResponse<CouponValidationResult>>('/coupons/validate', {
        couponCode,
      });
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Get user's coupon usage stats
  getCouponUsage: async (couponCode: string): Promise<CouponUsage> => {
    try {
      const response = await api.get<ApiResponse<CouponUsage>>(
        `/coupons/usage?couponCode=${encodeURIComponent(couponCode)}`
      );
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },
};
