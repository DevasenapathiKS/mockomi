import { Response } from 'express';
import { notificationService } from '../services';
import { AuthRequest } from '../types';
import { asyncHandler } from '../middlewares/errorHandler';

export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, unreadOnly } = req.query as any;

  const result = await notificationService.getUserNotifications(
    req.user!.id,
    { page: Number(page) || 1, limit: Number(limit) || 20 },
    unreadOnly === 'true'
  );

  res.status(200).json({
    success: true,
    data: result.notifications,
    pagination: result.pagination,
    unreadCount: result.unreadCount,
  });
});

export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const notification = await notificationService.markAsRead(
    req.params.id,
    req.user!.id
  );

  res.status(200).json({
    success: true,
    data: notification,
  });
});

export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  await notificationService.markAllAsRead(req.user!.id);

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
  });
});

export const deleteNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
  await notificationService.deleteNotification(req.params.id, req.user!.id);

  res.status(200).json({
    success: true,
    message: 'Notification deleted',
  });
});

export const getUnreadCount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const count = await notificationService.getUnreadCount(req.user!.id);

  res.status(200).json({
    success: true,
    data: { count },
  });
});
