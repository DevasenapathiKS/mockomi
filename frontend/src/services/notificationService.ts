import api, { handleApiError } from './api';
import { Notification, ApiResponse, PaginatedResponse } from '@/types';

export const notificationService = {
  // Get notifications
  getNotifications: async (page = 1, limit = 20): Promise<PaginatedResponse<Notification>> => {
    try {
      const response = await api.get<PaginatedResponse<Notification>>(
        `/notifications?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Get unread count
  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
      return response.data.data!.count;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Mark notification as read
  markAsRead: async (id: string): Promise<void> => {
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Mark all as read
  markAllAsRead: async (): Promise<void> => {
    try {
      await api.patch('/notifications/mark-all-read');
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Delete notification
  deleteNotification: async (id: string): Promise<void> => {
    try {
      await api.delete(`/notifications/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },
};
