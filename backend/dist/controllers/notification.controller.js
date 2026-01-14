"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnreadCount = exports.deleteNotification = exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
const services_1 = require("../services");
const errorHandler_1 = require("../middlewares/errorHandler");
exports.getNotifications = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, unreadOnly } = req.query;
    const result = await services_1.notificationService.getUserNotifications(req.user.id, { page: Number(page) || 1, limit: Number(limit) || 20 }, unreadOnly === 'true');
    res.status(200).json({
        success: true,
        data: result.notifications,
        pagination: result.pagination,
        unreadCount: result.unreadCount,
    });
});
exports.markAsRead = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const notification = await services_1.notificationService.markAsRead(req.params.id, req.user.id);
    res.status(200).json({
        success: true,
        data: notification,
    });
});
exports.markAllAsRead = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await services_1.notificationService.markAllAsRead(req.user.id);
    res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
    });
});
exports.deleteNotification = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await services_1.notificationService.deleteNotification(req.params.id, req.user.id);
    res.status(200).json({
        success: true,
        message: 'Notification deleted',
    });
});
exports.getUnreadCount = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const count = await services_1.notificationService.getUnreadCount(req.user.id);
    res.status(200).json({
        success: true,
        data: { count },
    });
});
//# sourceMappingURL=notification.controller.js.map