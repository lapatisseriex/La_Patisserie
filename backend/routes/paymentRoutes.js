import express from 'express';
import { 
  createOrder, 
  verifyPayment, 
  cancelOrder,
  handleWebhook, 
  getPaymentDetails,
  getAllOrders,
  getOrderDetails,
  getUserOrders,
  getUserPayments,
  listPayments,
  getPaymentById,
  createPaymentRecord,
  checkOrderStatus
} from '../controllers/paymentController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { backfillPaymentsFromOrders, updatePaymentStatus } from '../controllers/paymentController.js';

const router = express.Router();

// Create order (both Razorpay and COD)
router.post('/create-order', protect, createOrder);

// Verify Razorpay payment
router.post('/verify', verifyPayment);

// Cancel order (when payment popup is dismissed)
router.post('/cancel-order', protect, cancelOrder);

// Check order status by Razorpay order ID
router.get('/order-status/:razorpay_order_id', protect, checkOrderStatus);

// Razorpay webhook (no auth required)
router.post('/webhook', handleWebhook);

// Get payment details
router.get('/payment/:paymentId', protect, getPaymentDetails);

// Order management routes
router.get('/orders', protect, getAllOrders); // Admin: Get all orders
router.get('/orders/user', protect, getUserOrders); // User: Get user's orders
router.get('/orders/:orderNumber', protect, getOrderDetails); // Get specific order details

// User payments route  
router.get('/user/payments', protect, getUserPayments); // User: Get user's payments/transactions

// Admin Payment Management endpoints
router.get('/', protect, admin, listPayments); // GET /api/payments
router.get('/:id', protect, admin, getPaymentById); // GET /api/payments/:id
router.post('/', protect, createPaymentRecord); // POST /api/payments (allow authenticated create)

// Admin utility: backfill payments from orders
router.post('/backfill', protect, admin, backfillPaymentsFromOrders);
router.patch('/:id/status', protect, admin, updatePaymentStatus); // Admin: Update payment status

export default router;