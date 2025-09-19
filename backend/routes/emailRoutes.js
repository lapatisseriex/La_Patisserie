import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  sendEmailVerification,
  verifyEmail,
  resendEmailVerification,
  getVerificationStatus
} from '../controllers/emailController.js';

const router = express.Router();

// Email verification routes
router.post('/send-verification', protect, sendEmailVerification);
router.post('/verify', protect, verifyEmail);
router.post('/resend-verification', protect, resendEmailVerification);
router.get('/verification-status', protect, getVerificationStatus);

export default router;