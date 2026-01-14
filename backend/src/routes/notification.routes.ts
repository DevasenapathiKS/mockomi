import { Router } from 'express';
import { notificationController } from '../controllers';
import { authenticate } from '../middlewares/auth';

const router = Router();

/**
 * @swagger
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get notifications
 *     security: [{ bearerAuth: [] }]
 */
router.get('/', authenticate, notificationController.getNotifications);

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: Get unread notification count
 *     security: [{ bearerAuth: [] }]
 */
router.get('/unread-count', authenticate, notificationController.getUnreadCount);

/**
 * @swagger
 * /notifications/mark-all-read:
 *   post:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/mark-all-read', authenticate, notificationController.markAllAsRead);

/**
 * @swagger
 * /notifications/{id}/read:
 *   post:
 *     tags: [Notifications]
 *     summary: Mark notification as read
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/:id/read', authenticate, notificationController.markAsRead);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete notification
 *     security: [{ bearerAuth: [] }]
 */
router.delete('/:id', authenticate, notificationController.deleteNotification);

export default router;
