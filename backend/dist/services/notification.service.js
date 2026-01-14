"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
class NotificationService {
    async createNotification(data) {
        const notification = await models_1.Notification.create(data);
        logger_1.default.debug(`Notification created for user: ${data.userId}`);
        return notification;
    }
    async createBulkNotifications(userIds, notificationData) {
        const notifications = userIds.map((userId) => ({
            userId,
            ...notificationData,
        }));
        await models_1.Notification.insertMany(notifications);
        logger_1.default.debug(`Bulk notifications created for ${userIds.length} users`);
    }
    async getUserNotifications(userId, pagination = {}, unreadOnly = false) {
        const { page = 1, limit = 20, sort = 'createdAt', order = 'desc' } = pagination;
        const query = { userId };
        if (unreadOnly) {
            query.isRead = false;
        }
        const total = await models_1.Notification.countDocuments(query);
        const totalPages = Math.ceil(total / limit);
        const unreadCount = await models_1.Notification.countDocuments({ userId, isRead: false });
        const notifications = await models_1.Notification.find(query)
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
    async markAsRead(notificationId, userId) {
        const notification = await models_1.Notification.findOne({ _id: notificationId, userId });
        if (!notification) {
            throw new errors_1.AppError('Notification not found', 404);
        }
        notification.isRead = true;
        await notification.save();
        return notification;
    }
    async markAllAsRead(userId) {
        await models_1.Notification.updateMany({ userId, isRead: false }, { isRead: true });
    }
    async deleteNotification(notificationId, userId) {
        const result = await models_1.Notification.deleteOne({ _id: notificationId, userId });
        if (result.deletedCount === 0) {
            throw new errors_1.AppError('Notification not found', 404);
        }
    }
    async getUnreadCount(userId) {
        return models_1.Notification.countDocuments({ userId, isRead: false });
    }
}
exports.default = new NotificationService();
//# sourceMappingURL=notification.service.js.map