import express from 'express';
import {
  sendStatusUpdate,
  sendPasswordReset,
  sendSignupOtp,
  sendNewsletter,
  sendOrderPlacedEmail,
  sendOrderDispatchedEmail
} from '../controllers/emailDispatchController.js';

const router = express.Router();

// Intentionally public for delegation from trusted backend (ensure network-level restrictions if needed)
router.post('/status-update', sendStatusUpdate);
router.post('/password-reset', sendPasswordReset);
router.post('/signup-otp', sendSignupOtp);
router.post('/newsletter/send', sendNewsletter);
router.post('/order-placed', sendOrderPlacedEmail);
router.post('/order-dispatched', sendOrderDispatchedEmail);

export default router;
