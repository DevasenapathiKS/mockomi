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
      const response = await api.post<ApiResponse<{ user: User; accessToken: string }>>('/auth/login', data);
      // RefreshToken is now in httpOnly cookie, not in response
      return {
        user: response.data.data!.user,
        accessToken: response.data.data!.accessToken,
        refreshToken: '', // Not needed, handled by cookie
      };
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

  // Refresh token (refreshToken is in httpOnly cookie)
  refreshToken: async (): Promise<{ accessToken: string }> => {
    try {
      const response = await api.post<ApiResponse<{ accessToken: string }>>(
        '/auth/refresh-token',
        {} // No body needed, token is in cookie
      );
      return { accessToken: response.data.data!.accessToken };
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

  // OAuth Methods
  // Initiate Google OAuth
  initiateGoogleAuth: (isLinking = false): Window | null => {
    const backendUrl = import.meta.env.VITE_API_URL || 'https://mockomi.com';
    const url = `${backendUrl}/api/v1/oauth/google${isLinking ? '?link=true' : ''}`;
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    return window.open(
      url,
      'Google Login',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  },

  // Initiate GitHub OAuth
  initiateGithubAuth: (isLinking = false): Window | null => {
    const backendUrl = import.meta.env.VITE_API_URL || 'https://mockomi.com';
    const url = `${backendUrl}/api/v1/oauth/github${isLinking ? '?link=true' : ''}`;
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    return window.open(
      url,
      'GitHub Login',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  },

  // Initiate LinkedIn OAuth
  initiateLinkedInAuth: (isLinking = false): Window | null => {
    const backendUrl = import.meta.env.VITE_API_URL || 'https://mockomi.com';
    const url = `${backendUrl}/api/v1/oauth/linkedin${isLinking ? '?link=true' : ''}`;
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    return window.open(
      url,
      'LinkedIn Login',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  },

  // Wait for OAuth response via postMessage
  waitForOAuthResponse: (): Promise<{ accessToken: string; refreshToken: string }> => {
    return new Promise((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        // Verify origin for security
        const backendUrl = import.meta.env.VITE_API_URL || 'https://mockomi.com';
        const expectedOrigin = new URL(backendUrl).origin;
        
        if (event.origin !== expectedOrigin) {
          return;
        }

        if (event.data.type === 'oauth-success') {
          window.removeEventListener('message', handleMessage);
          resolve({
            accessToken: event.data.accessToken,
            refreshToken: event.data.refreshToken,
          });
        } else if (event.data.type === 'oauth-error') {
          window.removeEventListener('message', handleMessage);
          reject(new Error(event.data.message || 'OAuth authentication failed'));
        }
      };

      window.addEventListener('message', handleMessage);

      // Timeout after 5 minutes
      setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        reject(new Error('OAuth authentication timeout'));
      }, 5 * 60 * 1000);
    });
  },

  // Get linked OAuth providers
  getLinkedProviders: async (): Promise<string[]> => {
    try {
      const response = await api.get<ApiResponse<{ providers: string[] }>>('/oauth/linked-providers');
      return response.data.data!.providers;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Unlink OAuth provider
  unlinkProvider: async (provider: string): Promise<void> => {
    try {
      await api.delete(`/oauth/unlink/${provider}`);
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },
};
