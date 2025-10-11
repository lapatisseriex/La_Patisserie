import express from 'express';
import { 
  createOrder, 
  verifyPayment, 
  handleWebhook, 
  getPaymentDetails,
  getAllOrders,
  getOrderDetails,
  getUserOrders,
  listPayments,
  getPaymentById,
  createPaymentRecord
} from '../controllers/paymentController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { backfillPaymentsFromOrders, updatePaymentStatus } from '../controllers/paymentController.js';

const router = express.Router();

// Create order (both Razorpay and COD)
router.post('/create-order', protect, createOrder);

// Verify Razorpay payment
router.post('/verify', verifyPayment);

// Razorpay webhook (no auth required)
router.post('/webhook', handleWebhook);

// Get payment details
router.get('/payment/:paymentId', protect, getPaymentDetails);

// Order management routes
router.get('/orders', protect, getAllOrders); // Admin: Get all orders
router.get('/orders/user', protect, getUserOrders); // User: Get user's orders
router.get('/orders/:orderNumber', protect, getOrderDetails); // Get specific order details

// Admin Payment Management endpoints
router.get('/', protect, admin, listPayments); // GET /api/payments
router.get('/:id', protect, admin, getPaymentById); // GET /api/payments/:id
router.post('/', protect, createPaymentRecord); // POST /api/payments (allow authenticated create)

// Admin utility: backfill payments from orders
router.post('/backfill', protect, admin, backfillPaymentsFromOrders);
router.patch('/:id/status', protect, admin, updatePaymentStatus); // Admin: Update payment status

export default router;