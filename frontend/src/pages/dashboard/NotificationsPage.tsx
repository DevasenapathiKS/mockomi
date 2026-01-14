import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BellIcon,
  CheckCircleIcon,
  BriefcaseIcon,
  VideoCameraIcon,
  CurrencyRupeeIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { notificationService } from '@/services/notificationService';
import { useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';
import { NotificationType } from '@/types';
import { DashboardLayout } from '@/components/layout';
import { Card, Button, Spinner, EmptyState } from '@/components/ui';

const NotificationsPage: React.FC = () => {
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications(),
  });

  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.APPLICATION_RECEIVED:
      case NotificationType.APPLICATION_STATUS:
        return BriefcaseIcon;
      case NotificationType.INTERVIEW_SCHEDULED:
      case NotificationType.INTERVIEW_REMINDER:
      case NotificationType.INTERVIEW_COMPLETED:
        return VideoCameraIcon;
      case NotificationType.PAYMENT_SUCCESS:
      case NotificationType.PAYMENT_FAILED:
        return CurrencyRupeeIcon;
      case NotificationType.PROFILE_UPDATE:
        return UserIcon;
      default:
        return BellIcon;
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case NotificationType.APPLICATION_STATUS:
      case NotificationType.INTERVIEW_COMPLETED:
      case NotificationType.PAYMENT_SUCCESS:
        return 'bg-green-100 text-green-600';
      case NotificationType.APPLICATION_RECEIVED:
      case NotificationType.INTERVIEW_SCHEDULED:
        return 'bg-blue-100 text-blue-600';
      case NotificationType.INTERVIEW_REMINDER:
        return 'bg-yellow-100 text-yellow-600';
      case NotificationType.PAYMENT_FAILED:
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const unreadCount = notifications?.data?.filter((n: any) => !n.isRead).length || 0;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-1">
              {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={() => markAllAsRead.mutate()}
              isLoading={markAllAsRead.isPending}
            >
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        {notifications?.data && notifications.data.length > 0 ? (
          <div className="space-y-3">
            {notifications.data.map((notification: any, index: number) => {
              const Icon = getNotificationIcon(notification.type);
              const colorClass = getNotificationColor(notification.type);

              return (
                <motion.div
                  key={notification._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsRead.mutate(notification._id);
                      }
                    }}
                  >
                    <Card
                      className={`
                        transition-all hover:shadow-md
                        ${!notification.isRead ? 'border-l-4 border-l-primary-500 bg-primary-50/30' : ''}
                      `}
                    >
                      <div className="flex gap-4">
                        <div className={`p-3 rounded-full ${colorClass}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className={`font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <div className="h-2 w-2 bg-primary-500 rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<BellIcon className="h-12 w-12" />}
            title="No notifications"
            description="You're all caught up! Check back later for updates."
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;
