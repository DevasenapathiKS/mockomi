import api, { handleApiError } from './api';
import { ApiResponse, Payment } from '@/types';

interface CreatePaymentOrderPayload {
  amount: number;
  interviewId?: string;
  notes?: Record<string, unknown>;
}

interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  paymentId: string;
}

export const paymentService = {
  createOrder: async (payload: CreatePaymentOrderPayload): Promise<RazorpayOrderResponse> => {
    try {
      const response = await api.post<ApiResponse<RazorpayOrderResponse>>('/payments/create-order', payload);
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  verifyPayment: async (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<Payment> => {
    try {
      const response = await api.post<ApiResponse<Payment>>('/payments/verify', data);
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },
};

