import express from 'express';
import { 
  verifyToken, 
  sendPasswordResetOTP, 
  verifyPasswordResetOTP, 
  resetPassword 
} from '../controllers/authController.js';

const router = express.Router();

// Verify Firebase ID token route
router.post('/verify', verifyToken);

// Password reset routes
router.post('/forgot-password', sendPasswordResetOTP);
router.post('/verify-reset-otp', verifyPasswordResetOTP);
router.post('/reset-password', resetPassword);

export default router;
