import api, { handleApiError } from './api';
import { User, AuthResponse, ApiResponse } from '@/types';

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'job_seeker' | 'employer' | 'interviewer';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const authService = {
  // Register new user
  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Login user
  login: async (data: LoginData): Promise<AuthResponse> => {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await api.get<ApiResponse<User>>('/auth/me');
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Refresh token
  refreshToken: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    try {
      const response = await api.post<ApiResponse<{ tokens: { accessToken: string; refreshToken: string } }>>(
        '/auth/refresh-token',
        { refreshToken }
      );
      return response.data.data!.tokens;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors
      console.error('Logout error:', error);
    }
  },

  // Logout from all devices
  logoutAll: async (): Promise<void> => {
    try {
      await api.post('/auth/logout-all');
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Change password
  changePassword: async (data: ChangePasswordData): Promise<void> => {
    try {
      await api.post('/auth/change-password', data);
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Forgot password
  forgotPassword: async (email: string): Promise<void> => {
    try {
      await api.post('/auth/forgot-password', { email });
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Reset password
  resetPassword: async (token: string, password: string): Promise<void> => {
    try {
      await api.post('/auth/reset-password', { token, password });
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },
};
