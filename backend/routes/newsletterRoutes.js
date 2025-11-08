import express from 'express';
const router = express.Router();
import {
  subscribe,
  unsubscribe,
  getAllSubscribers,
  addSubscriberManually,
  updateSubscriber,
  deleteSubscriber,
  getNewsletterStats,
  getNewsletterStatusByEmail
} from '../controllers/newsletterController.js';
import { sendCustomNewsletter } from '../utils/newsletterEmailService.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Public routes
router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);

// Admin routes - Protected
router.get('/admin/subscribers', protect, admin, getAllSubscribers);
router.get('/admin/stats', protect, admin, getNewsletterStats);
router.get('/admin/user/:email', protect, admin, getNewsletterStatusByEmail);
router.post('/admin/add', protect, admin, addSubscriberManually);
router.put('/admin/:id', protect, admin, updateSubscriber);
router.delete('/admin/:id', protect, admin, deleteSubscriber);

// Send custom newsletter (Admin only)
router.post('/admin/send', protect, admin, asyncHandler(async (req, res) => {
  const { subject, title, body, ctaText, ctaLink } = req.body;

  if (!subject || !body) {
    return res.status(400).json({
      success: false,
      message: 'Subject and body are required'
    });
  }

  const newsletterContent = {
    subject,
    title,
    body,
    ctaText,
    ctaLink
  };

  const result = await sendCustomNewsletter(newsletterContent);

  if (result.success) {
    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        sent: result.sent,
        failed: result.failed,
        totalSubscribers: result.totalSubscribers
      }
    });
  } else {
    res.status(500).json({
      success: false,
      message: result.message,
      error: result.error
    });
  }
}));

export default router;
