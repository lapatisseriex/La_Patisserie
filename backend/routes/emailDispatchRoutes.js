import express from 'express';
import {
  sendOrderConfirmation,
  sendAdminOrderPlaced,
  sendStatusUpdate,
  sendPasswordReset,
  sendSignupOtp,
  sendNewsletter
} from '../controllers/emailDispatchController.js';

const router = express.Router();

// Intentionally public for delegation from trusted backend (ensure network-level restrictions if needed)
router.post('/order-confirmation', sendOrderConfirmation);
router.post('/admin-order-placed', sendAdminOrderPlaced);
router.post('/status-update', sendStatusUpdate);
router.post('/password-reset', sendPasswordReset);
router.post('/signup-otp', sendSignupOtp);
router.post('/newsletter/send', sendNewsletter);

export default router;
