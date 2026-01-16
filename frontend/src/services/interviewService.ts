import api, { handleApiError } from './api';
import { Interview, InterviewType, InterviewerProfile, ApiResponse, PaginatedResponse, Payment, PaymentEligibility } from '@/types';

export interface ScheduleInterviewData {
  interviewerId: string;
  scheduledAt: string;
  duration: number;
  type: InterviewType;
  topics?: string[];
  notes?: string;
}

// New interface for creating interview requests (job seeker selects skills only)
export interface CreateInterviewRequestData {
  requestedSkills: string[];
  preferredDuration?: number;
  notes?: string;
  paymentId?: string;
  couponCode?: string;
}

// New interface for claiming an interview (interviewer sets schedule)
export interface ClaimInterviewData {
  scheduledAt: string;
  duration?: number;
}

export interface InterviewFeedbackData {
  overallRating: number;
  technicalSkills?: number;
  communicationSkills?: number;
  problemSolving?: number;
  strengths?: string;
  areasOfImprovement?: string;
  recommendation?: string;
}

export const interviewService = {
  // Get available interviewers
  getInterviewers: async (
    type?: InterviewType,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<InterviewerProfile & { user: { firstName: string; lastName: string; avatar?: string } }>> => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (type) params.append('type', type);

      const response = await api.get<PaginatedResponse<InterviewerProfile & { user: { firstName: string; lastName: string; avatar?: string } }>>(
        `/interviews/interviewers?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Check if payment is required
  checkPaymentRequirement: async (): Promise<PaymentEligibility> => {
    try {
      const response = await api.get<ApiResponse<PaymentEligibility>>('/interviews/payment-check');
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Schedule interview
  scheduleInterview: async (data: ScheduleInterviewData): Promise<Interview> => {
    try {
      const response = await api.post<ApiResponse<Interview>>('/interviews', data);
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Get my interviews
  getMyInterviews: async (
    status?: string,
    page = 10,
    limit = 100
  ): Promise<PaginatedResponse<Interview>> => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (status) params.append('status', status);

      const response = await api.get<PaginatedResponse<Interview>>(
        `/interviews/my-interviews?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Get interview details
  getInterview: async (id: string): Promise<Interview> => {
    try {
      const response = await api.get<ApiResponse<Interview>>(`/interviews/${id}`);
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Start interview (interviewer only)
  startInterview: async (id: string): Promise<Interview> => {
    try {
      const response = await api.post<ApiResponse<Interview>>(`/interviews/${id}/start`);
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Complete interview (interviewer only)
  completeInterview: async (id: string): Promise<Interview> => {
    try {
      const response = await api.post<ApiResponse<Interview>>(`/interviews/${id}/complete`);
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Cancel interview
  cancelInterview: async (id: string, reason?: string): Promise<Interview> => {
    try {
      const response = await api.post<ApiResponse<Interview>>(`/interviews/${id}/cancel`, { reason });
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Submit feedback (interviewer only)
  submitFeedback: async (id: string, feedback: InterviewFeedbackData): Promise<Interview> => {
    try {
      const response = await api.post<ApiResponse<Interview>>(`/interviews/${id}/feedback`, feedback);
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Upload recording (interviewer only)
  uploadRecording: async (id: string, file: File): Promise<Interview> => {
    try {
      const formData = new FormData();
      formData.append('recording', file);

      const response = await api.post<ApiResponse<Interview>>(`/interviews/${id}/recording`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Get recording URL
  getRecordingUrl: async (id: string): Promise<string> => {
    try {
      const response = await api.get<ApiResponse<{ url: string }>>(`/interviews/${id}/recording-url`);
      return response.data.data!.url;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Create payment order
  createPaymentOrder: async (interviewId: string): Promise<{
    orderId: string;
    amount: number;
    currency: string;
  }> => {
    try {
      const response = await api.post<ApiResponse<{ orderId: string; amount: number; currency: string }>>(
        '/interviews/payment/create-order',
        { interviewId }
      );
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Verify payment
  verifyPayment: async (data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Promise<Payment> => {
    try {
      const response = await api.post<ApiResponse<Payment>>('/interviews/payment/verify', data);
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Get interviewer earnings
  getInterviewerEarnings: async (params: { period?: string }): Promise<{
    earnings: Array<{
      id: string;
      interviewId: string;
      candidateName: string;
      date: string;
      duration: number;
      amount: number;
      status: 'pending' | 'paid' | 'processing';
      type: string;
    }>;
    stats: {
      totalEarnings: number;
      pendingAmount: number;
      paidAmount: number;
      totalInterviews: number;
    };
  }> => {
    try {
      const queryParams = new URLSearchParams();
      if (params.period) queryParams.append('period', params.period);

      const response = await api.get(`/interviews/earnings?${queryParams.toString()}`);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // ==================== NEW INTERVIEW REQUEST/CLAIM FLOW ====================

  // Create interview request (job seeker selects skills only)
  createInterviewRequest: async (data: CreateInterviewRequestData): Promise<Interview> => {
    try {
      const response = await api.post<ApiResponse<Interview>>('/interviews/request', data);
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Get my interview requests (job seeker - pending/expired)
  getMyInterviewRequests: async (
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<Interview>> => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      const response = await api.get<PaginatedResponse<Interview>>(
        `/interviews/my-requests?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Get available interview requests (interviewer - matching expertise)
  getAvailableRequests: async (
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<Interview>> => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      const response = await api.get<PaginatedResponse<Interview>>(
        `/interviews/available-requests?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Claim an interview request (interviewer sets schedule)
  claimInterview: async (id: string, data: ClaimInterviewData): Promise<Interview> => {
    try {
      const response = await api.post<ApiResponse<Interview>>(`/interviews/${id}/claim`, data);
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },
};
