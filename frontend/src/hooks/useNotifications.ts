import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notificationService';

export const useNotifications = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['notifications', page, limit],
    queryFn: () => notificationService.getNotifications(page, limit),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['unread-count'],
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 30000,
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });
};
