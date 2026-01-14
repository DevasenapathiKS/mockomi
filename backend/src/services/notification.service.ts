import { Notification } from '../models';
import { INotificationDocument } from '../models/Notification';
import { PaginationQuery, PaginationInfo } from '../types';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

interface CreateNotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: object;
}

class NotificationService {
  async createNotification(data: CreateNotificationData): Promise<INotificationDocument> {
    const notification = await Notification.create(data);
    logger.debug(`Notification created for user: ${data.userId}`);
    return notification;
  }

  async createBulkNotifications(
    userIds: string[],
    notificationData: Omit<CreateNotificationData, 'userId'>
  ): Promise<void> {
    const notifications = userIds.map((userId) => ({
      userId,
      ...notificationData,
    }));

    await Notification.insertMany(notifications);
    logger.debug(`Bulk notifications created for ${userIds.length} users`);
  }

  async getUserNotifications(
    userId: string,
    pagination: PaginationQuery = {},
    unreadOnly: boolean = false
  ): Promise<{ notifications: INotificationDocument[]; pagination: PaginationInfo; unreadCount: number }> {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc' } = pagination;

    const query: any = { userId };
    if (unreadOnly) {
      query.isRead = false;
    }

    const total = await Notification.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    const notifications = await Notification.find(query)
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      unreadCount,
    };
  }

  async markAsRead(notificationId: string, userId: string): Promise<INotificationDocument> {
    const notification = await Notification.findOne({ _id: notificationId, userId });
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    notification.isRead = true;
    await notification.save();

    return notification;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const result = await Notification.deleteOne({ _id: notificationId, userId });
    if (result.deletedCount === 0) {
      throw new AppError('Notification not found', 404);
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({ userId, isRead: false });
  }
}

export default new NotificationService();
