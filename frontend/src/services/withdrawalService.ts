import api, { handleApiError } from './api';
import { Withdrawal, WithdrawalStats, WithdrawalMethod, PaginatedResponse, ApiResponse } from '@/types';

export interface CreateWithdrawalData {
  amount: number; // in paise
  method: WithdrawalMethod;
  bankDetails?: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  upiId?: string;
}

export const withdrawalService = {
  // Create withdrawal request
  createWithdrawal: async (data: CreateWithdrawalData): Promise<Withdrawal> => {
    try {
      const response = await api.post<ApiResponse<Withdrawal>>('/withdrawals', data);
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Get my withdrawals
  getMyWithdrawals: async (
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<Withdrawal>> => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      const response = await api.get<PaginatedResponse<Withdrawal>>(
        `/withdrawals?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Get withdrawal stats
  getWithdrawalStats: async (): Promise<WithdrawalStats> => {
    try {
      const response = await api.get<ApiResponse<WithdrawalStats>>('/withdrawals/stats');
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Get withdrawal by ID
  getWithdrawalById: async (id: string): Promise<Withdrawal> => {
    try {
      const response = await api.get<ApiResponse<Withdrawal>>(`/withdrawals/${id}`);
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },
};

