import { INotificationDocument } from '../models/Notification';
import { PaginationQuery, PaginationInfo } from '../types';
interface CreateNotificationData {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: object;
}
declare class NotificationService {
    createNotification(data: CreateNotificationData): Promise<INotificationDocument>;
    createBulkNotifications(userIds: string[], notificationData: Omit<CreateNotificationData, 'userId'>): Promise<void>;
    getUserNotifications(userId: string, pagination?: PaginationQuery, unreadOnly?: boolean): Promise<{
        notifications: INotificationDocument[];
        pagination: PaginationInfo;
        unreadCount: number;
    }>;
    markAsRead(notificationId: string, userId: string): Promise<INotificationDocument>;
    markAllAsRead(userId: string): Promise<void>;
    deleteNotification(notificationId: string, userId: string): Promise<void>;
    getUnreadCount(userId: string): Promise<number>;
}
declare const _default: NotificationService;
export default _default;
//# sourceMappingURL=notification.service.d.ts.map