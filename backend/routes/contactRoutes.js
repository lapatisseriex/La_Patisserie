import express from 'express';
import {
  submitContact,
  getContacts,
  getContact,
  updateContactStatus,
  replyToContact,
  deleteContact,
  bulkUpdateContacts,
  getContactStats,
  getContactsByUser
} from '../controllers/contactController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limit for contact form submissions
const contactSubmissionLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Max 3 submissions per 15 minutes per IP
  message: {
    success: false,
    message: 'Too many contact form submissions. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post('/', contactSubmissionLimit, submitContact);

// Admin routes - require authentication and admin role
router.use(protect, admin);

router.get('/', getContacts);
router.get('/stats', getContactStats);
router.get('/user/:email', getContactsByUser);
router.get('/:id', getContact);
router.put('/:id/status', updateContactStatus);
router.post('/:id/reply', replyToContact);
router.delete('/:id', deleteContact);
router.post('/bulk-update', bulkUpdateContacts);

export default router;