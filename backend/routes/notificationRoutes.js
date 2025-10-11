import express from 'express';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get user notifications
router.get('/', protect, getUserNotifications);

// Mark notification as read
router.patch('/:id/read', protect, markNotificationAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', protect, markAllNotificationsAsRead);

// Delete notification
router.delete('/:id', protect, deleteNotification);

export default router;