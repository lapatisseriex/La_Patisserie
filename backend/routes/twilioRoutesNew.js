import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { sendOtp, verifyOtp } from '../controllers/twilioController.js';

const router = express.Router();

// Send OTP to provided phone number (requires authenticated user)
router.post('/send-otp', protect, sendOtp);

// Verify OTP for provided phone number (requires authenticated user)
router.post('/verify-otp', protect, verifyOtp);

export default router;