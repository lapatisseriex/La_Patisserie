import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { sendEmailOtp, verifyEmailOtp } from '../controllers/emailController.js';

const router = express.Router();

// Send OTP to provided email (requires authenticated user)
router.post('/send-otp', protect, sendEmailOtp);

// Verify OTP for provided email (requires authenticated user)
router.post('/verify-otp', protect, verifyEmailOtp);

export default router;
