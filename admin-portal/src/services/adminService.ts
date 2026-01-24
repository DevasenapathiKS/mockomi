import api, { handleApiError } from './api';
import {
  AdminDashboardStats,
  AdminUser,
  AdminInterviewer,
  AdminPayment,
  Coupon,
  PaginatedResponse,
  UserRole,
  UserStatus,
  PaymentStatus,
  SystemHealth,
} from '@/types';

export interface PaymentStats {
  total: number;
  completed: number;
  pending: number;
  failed: number;
  refunded: number;
  totalRevenue: number;
  successfulPayments: number;
  pendingPayments: number;
  refundedPayments: number;
  completedPayments: number;
  failedPayments: number;
}

export interface CreateCouponData {
  code: string;
  description: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  perUserLimit: number;
  globalLimit?: number;
  expiresAt?: string;
}

export const adminService = {
  getDashboardStats: async (): Promise<AdminDashboardStats> => {
    try {
      const response = await api.get<{ success: boolean; data: AdminDashboardStats }>(
        '/admin/dashboard'
      );
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  getAllUsers: async (
    role?: UserRole,
    status?: UserStatus,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<AdminUser>> => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (role) params.append('role', role);
      if (status) params.append('status', status);

      const response = await api.get<{
        success: boolean;
        data: AdminUser[];
        total: number;
        totalPages: number;
      }>(`/admin/users?${params.toString()}`);
      return {
        data: response.data.data,
        total: response.data.total,
        totalPages: response.data.totalPages,
        page,
        limit,
      };
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  updateUserStatus: async (
    userId: string,
    status: UserStatus
  ): Promise<AdminUser> => {
    try {
      const response = await api.patch<{ success: boolean; data: AdminUser }>(
        `/admin/users/${userId}/status`,
        { status }
      );
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  getPendingInterviewers: async (
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<AdminInterviewer>> => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      const response = await api.get<{
        success: boolean;
        data: any[];
        total: number;
        totalPages: number;
      }>(`/admin/interviewers/pending?${params.toString()}`);
      // Transform userId to user to match the AdminInterviewer interface
      const transformedData = response.data.data.map((item: any) => ({
        ...item,
        user: item.user || item.userId, // Handle both cases
      }));
      return {
        data: transformedData,
        total: response.data.total,
        totalPages: response.data.totalPages,
        page,
        limit,
      };
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  approveInterviewer: async (
    interviewerId: string,
    isApproved: boolean,
    rejectionReason?: string
  ): Promise<AdminInterviewer> => {
    try {
      const response = await api.post<{ success: boolean; data: AdminInterviewer }>(
        `/admin/interviewers/${interviewerId}/approve`,
        { isApproved, rejectionReason }
      );
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  getTopInterviewers: async (): Promise<AdminInterviewer[]> => {
    try {
      const response = await api.get<{ success: boolean; data: any[] }>(
        '/admin/interviewers/top'
      );
      // Transform userId to user to match the AdminInterviewer interface
      return response.data.data.map((item: any) => ({
        ...item,
        user: item.user || item.userId, // Handle both cases
      }));
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  getAllPayments: async (
    status?: PaymentStatus,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<AdminPayment>> => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (status) params.append('status', status);

      const response = await api.get<{
        success: boolean;
        data: AdminPayment[];
        pagination: { total: number; totalPages: number };
      }>(`/admin/payments?${params.toString()}`);
      return {
        data: response.data.data,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages,
        page,
        limit,
      };
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  getPaymentStats: async (): Promise<PaymentStats> => {
    try {
      const response = await api.get<{ success: boolean; data: PaymentStats }>(
        '/admin/payments/stats'
      );
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  initiateRefund: async (paymentId: string): Promise<void> => {
    try {
      await api.post(`/admin/payments/${paymentId}/refund`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  getAllCoupons: async (): Promise<Coupon[]> => {
    try {
      const response = await api.get<{ success: boolean; data: Coupon[] }>('/coupons');
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  createCoupon: async (data: CreateCouponData): Promise<Coupon> => {
    try {
      const response = await api.post<{ success: boolean; data: Coupon }>('/coupons', data);
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  updateCoupon: async (couponId: string, data: Partial<CreateCouponData>): Promise<Coupon> => {
    try {
      const response = await api.put<{ success: boolean; data: Coupon }>(
        `/coupons/${couponId}`,
        data
      );
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  getSystemHealth: async (): Promise<SystemHealth> => {
    try {
      const response = await api.get<{ success: boolean; data: SystemHealth }>(
        '/admin/health'
      );
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};
