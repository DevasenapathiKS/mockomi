import api, { handleApiError } from './api';
import { PaginatedResponse, UserRole, PaymentStatus } from '@/types';

// UserStatus type for admin operations
type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';

export interface AdminDashboardStats {
  totalUsers: number;
  activeJobSeekers: number;
  activeEmployers: number;
  activeInterviewers: number;
  pendingInterviewers: number;
  totalInterviews: number;
  completedInterviews: number;
  totalJobs: number;
  activeJobs: number;
  totalRevenue: number;
  monthlyRevenue: number;
  userGrowth?: number;
  revenueGrowth?: number;
}

export interface AdminUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface AdminInterviewer {
  _id: string;
  userId: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  expertise: string[];
  experience: number;
  isApproved: boolean;
  rating: {
    average: number;
    count: number;
  };
  interviewsCompleted: number;
  earnings: number;
  createdAt: string;
}

export interface AdminPayment {
  _id: string;
  userId: string;
  interviewId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: string;
}

export interface AdminInterview {
  _id: string;
  jobSeekerId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  interviewerId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  status: string;
  requestedSkills: string[];
  scheduledAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface InterviewAnalytics {
  total: number;
  byStatus: Record<string, number>;
  byMonth: Array<{ month: string; count: number }>;
  completionRate: number;
  averageRating: number;
}

export interface RevenueAnalytics {
  total: number;
  thisMonth: number;
  lastMonth: number;
  byMonth: Array<{ month: string; amount: number }>;
  growth: number;
}

export interface SystemHealth {
  database: {
    status: 'healthy' | 'unhealthy';
    responseTime: number;
  };
  cache: {
    status: 'healthy' | 'unhealthy';
    responseTime: number;
  };
  uptime: number;
}

export interface AdminService {
  // Dashboard
  getDashboardStats: () => Promise<AdminDashboardStats>;
  
  // Users
  getAllUsers: (params?: {
    page?: number;
    limit?: number;
    role?: UserRole;
    status?: UserStatus;
    search?: string;
  }) => Promise<PaginatedResponse<AdminUser>>;
  updateUserStatus: (userId: string, status: UserStatus) => Promise<AdminUser>;
  
  // Interviewers
  getPendingInterviewers: (params?: {
    page?: number;
    limit?: number;
  }) => Promise<PaginatedResponse<AdminInterviewer>>;
  getTopInterviewers: (limit?: number) => Promise<AdminInterviewer[]>;
  approveInterviewer: (interviewerId: string, isApproved: boolean, rejectionReason?: string) => Promise<AdminInterviewer>;
  
  // Payments
  getAllPayments: (params?: {
    page?: number;
    limit?: number;
    status?: PaymentStatus;
  }) => Promise<PaginatedResponse<AdminPayment>>;
  getPaymentStats: () => Promise<any>;
  initiateRefund: (paymentId: string) => Promise<any>;
  
  // Interviews
  getAllInterviews: (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => Promise<PaginatedResponse<AdminInterview>>;
  
  // Analytics
  getInterviewAnalytics: (startDate?: string, endDate?: string) => Promise<InterviewAnalytics>;
  getRevenueAnalytics: (startDate?: string, endDate?: string) => Promise<RevenueAnalytics>;
  
  // System
  getSystemHealth: () => Promise<SystemHealth>;
}

export const adminService: AdminService = {
  // Dashboard
  getDashboardStats: async (): Promise<AdminDashboardStats> => {
    try {
      const response = await api.get<any>('/admin/dashboard');
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Users
  getAllUsers: async (params = {}): Promise<PaginatedResponse<AdminUser>> => {
    try {
      const { page = 1, limit = 20, role, status, search } = params;
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (role) queryParams.append('role', role);
      if (status) queryParams.append('status', status);
      if (search) queryParams.append('search', search);
      
      const response = await api.get<any>(`/admin/users?${queryParams.toString()}`);
      return {
        success: true,
        data: response.data.data,
        pagination: {
          page: response.data.page || page,
          limit: response.data.limit || limit,
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 1,
        },
      };
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  updateUserStatus: async (userId: string, status: UserStatus): Promise<AdminUser> => {
    try {
      const response = await api.patch<any>(`/admin/users/${userId}/status`, { status });
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Interviewers
  getPendingInterviewers: async (params = {}): Promise<PaginatedResponse<AdminInterviewer>> => {
    try {
      const { page = 1, limit = 20 } = params;
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      
      const response = await api.get<any>(`/admin/interviewers/pending?${queryParams.toString()}`);
      return {
        success: true,
        data: response.data.data,
        pagination: {
          page: response.data.page || page,
          limit: response.data.limit || limit,
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 1,
        },
      };
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  getTopInterviewers: async (limit = 10): Promise<AdminInterviewer[]> => {
    try {
      const response = await api.get<any>(`/admin/interviewers/top?limit=${limit}`);
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  approveInterviewer: async (
    interviewerId: string,
    isApproved: boolean,
    rejectionReason?: string
  ): Promise<AdminInterviewer> => {
    try {
      const response = await api.post<any>(`/admin/interviewers/${interviewerId}/approve`, {
        isApproved,
        rejectionReason,
      });
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Payments
  getAllPayments: async (params = {}): Promise<PaginatedResponse<AdminPayment>> => {
    try {
      const { page = 1, limit = 20, status } = params;
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (status) queryParams.append('status', status);
      
      const response = await api.get<any>(`/admin/payments?${queryParams.toString()}`);
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination || {
          page,
          limit,
          total: 0,
          totalPages: 1,
        },
      };
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  getPaymentStats: async (): Promise<any> => {
    try {
      const response = await api.get<any>('/admin/payments/stats');
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  initiateRefund: async (paymentId: string): Promise<any> => {
    try {
      const response = await api.post<any>(`/admin/payments/${paymentId}/refund`);
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Interviews (assuming this endpoint exists or needs to be created)
  getAllInterviews: async (params = {}): Promise<PaginatedResponse<AdminInterview>> => {
    try {
      const { page = 1, limit = 20, status } = params;
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (status) queryParams.append('status', status);
      
      // This endpoint might need to be created in the backend
      const response = await api.get<any>(`/admin/interviews?${queryParams.toString()}`);
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination || {
          page,
          limit,
          total: 0,
          totalPages: 1,
        },
      };
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Analytics
  getInterviewAnalytics: async (startDate?: string, endDate?: string): Promise<InterviewAnalytics> => {
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      
      const response = await api.get<any>(`/admin/analytics/interviews?${queryParams.toString()}`);
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  getRevenueAnalytics: async (startDate?: string, endDate?: string): Promise<RevenueAnalytics> => {
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      
      const response = await api.get<any>(`/admin/analytics/revenue?${queryParams.toString()}`);
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // System
  getSystemHealth: async (): Promise<SystemHealth> => {
    try {
      const response = await api.get<any>('/admin/health');
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },
};
