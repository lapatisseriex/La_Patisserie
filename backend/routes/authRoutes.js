import express from 'express';
import { 
  verifyToken, 
  requestPasswordResetOTP, 
  verifyPasswordResetOTP, 
  resetPassword,
  sendSignupOTP,
  verifySignupOTP
} from '../controllers/authController.js';

const router = express.Router();

// Verify Firebase ID token route
router.post('/verify', verifyToken);

// Password reset routes
router.post('/forgot-password', requestPasswordResetOTP);
router.post('/verify-reset-otp', verifyPasswordResetOTP);
router.post('/reset-password', resetPassword);

// Signup with OTP routes
router.post('/signup/send-otp', sendSignupOTP);
router.post('/signup/verify-otp', verifySignupOTP);

export default router;
