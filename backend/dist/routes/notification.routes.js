"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get notifications
 *     security: [{ bearerAuth: [] }]
 */
router.get('/', auth_1.authenticate, controllers_1.notificationController.getNotifications);
/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: Get unread notification count
 *     security: [{ bearerAuth: [] }]
 */
router.get('/unread-count', auth_1.authenticate, controllers_1.notificationController.getUnreadCount);
/**
 * @swagger
 * /notifications/mark-all-read:
 *   post:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/mark-all-read', auth_1.authenticate, controllers_1.notificationController.markAllAsRead);
/**
 * @swagger
 * /notifications/{id}/read:
 *   post:
 *     tags: [Notifications]
 *     summary: Mark notification as read
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/:id/read', auth_1.authenticate, controllers_1.notificationController.markAsRead);
/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete notification
 *     security: [{ bearerAuth: [] }]
 */
router.delete('/:id', auth_1.authenticate, controllers_1.notificationController.deleteNotification);
exports.default = router;
//# sourceMappingURL=notification.routes.js.map