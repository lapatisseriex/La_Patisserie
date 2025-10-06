import Razorpay from 'razorpay';
import crypto from 'crypto';
import { asyncHandler } from '../utils/asyncHandler.js';
import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import { sendOrderStatusNotification, sendOrderConfirmationEmail } from '../utils/orderEmailService.js';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay Order
export const createOrder = asyncHandler(async (req, res) => {
  try {
    const { 
      amount, 
      currency = 'INR', 
      receipt, 
      paymentMethod,
      cartItems,
      userDetails,
      deliveryLocation,
      orderSummary 
    } = req.body;

    console.log('Creating order with amount:', amount, 'Payment method:', paymentMethod);
    console.log('User from request:', { uid: req.user?.uid, _id: req.user?._id });
    console.log('Cart items received:', JSON.stringify(cartItems, null, 2));

    let razorpayOrder = null;
    let orderNumber = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Create Razorpay order only for online payments
    if (paymentMethod === 'razorpay') {
      const options = {
        amount: amount, // amount in paise
        currency: currency,
        receipt: receipt || orderNumber,
        payment_capture: 1, // Auto capture payment
      };

      razorpayOrder = await razorpay.orders.create(options);
      console.log('Razorpay order created:', razorpayOrder.id);
    }

    // Get user MongoDB _id from request (set by authMiddleware)
    const userId = req.user?._id;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User not found in request' 
      });
    }

    // Create order in database
    const order = new Order({
      orderNumber,
      userId,
      razorpayOrderId: razorpayOrder?.id || null,
      amount: amount / 100, // Convert back to rupees for storage
      currency,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'created',
      orderStatus: 'placed',
      cartItems,
      userDetails,
      deliveryLocation,
      orderSummary: {
        cartTotal: orderSummary.cartTotal,
        discountedTotal: orderSummary.discountedTotal,
        deliveryCharge: orderSummary.deliveryCharge,
        taxAmount: orderSummary.taxAmount,
        couponDiscount: orderSummary.couponDiscount || 0,
        grandTotal: orderSummary.grandTotal
      },
      estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000) // 45 minutes from now
    });

    await order.save();
    console.log('Order saved to database:', order._id);

    // Send order confirmation email
    try {
      // Get user email from the user record
      const user = await User.findById(userId).select('email name');
      if (user && user.email) {
        console.log('Sending order confirmation email to:', user.email);
        const emailResult = await sendOrderConfirmationEmail(order, user.email);
        if (emailResult.success) {
          console.log('Order confirmation email sent successfully:', emailResult.messageId);
        } else {
          console.error('Failed to send order confirmation email:', emailResult.error);
        }
      } else {
        console.log('User email not found, skipping confirmation email');
      }
    } catch (emailError) {
      console.error('Error sending order confirmation email:', emailError.message);
      // Don't fail the order creation if email fails
    }

    // Return response
    const response = {
      success: true,
      orderNumber,
      amount: razorpayOrder?.amount || amount,
      currency: razorpayOrder?.currency || currency,
    };

    if (razorpayOrder) {
      response.orderId = razorpayOrder.id;
      response.key = process.env.RAZORPAY_KEY_ID;
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create order',
      error: error.message 
    });
  }
});

// Verify Razorpay Payment
export const verifyPayment = asyncHandler(async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = req.body;

    console.log('Verifying payment:', { razorpay_order_id, razorpay_payment_id });

    // Create signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    // Verify signature
    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Update order status in database
      const order = await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { 
          paymentStatus: 'paid',
          razorpayPaymentId: razorpay_payment_id,
          orderStatus: 'confirmed'
        },
        { new: true }
      );

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        });
      }
      
      console.log('Payment verified successfully for order:', order.orderNumber);
      
      res.json({
        success: true,
        message: 'Payment verified successfully',
        orderNumber: order.orderNumber,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      });
    } else {
      console.log('Payment verification failed - Invalid signature');
      res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Payment verification failed',
      error: error.message 
    });
  }
});

// Razorpay Webhook Handler
export const handleWebhook = asyncHandler(async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookBody = JSON.stringify(req.body);

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(webhookBody)
      .digest('hex');

    if (webhookSignature !== expectedSignature) {
      console.log('Invalid webhook signature');
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const event = req.body;
    console.log('Webhook event received:', event.event);

    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        // Payment was successful
        const capturedPayment = event.payload.payment.entity;
        console.log('Payment captured:', capturedPayment.id);
        
        await Order.findOneAndUpdate(
          { razorpayOrderId: capturedPayment.order_id },
          { 
            paymentStatus: 'paid',
            razorpayPaymentId: capturedPayment.id,
            orderStatus: 'confirmed'
          }
        );
        break;

      case 'payment.failed':
        // Payment failed
        const failedPayment = event.payload.payment.entity;
        console.log('Payment failed:', failedPayment.id);
        
        await Order.findOneAndUpdate(
          { razorpayOrderId: failedPayment.order_id },
          { 
            paymentStatus: 'failed'
          }
        );
        break;

      default:
        console.log('Unhandled webhook event:', event.event);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Webhook processing failed',
      error: error.message 
    });
  }
});

// Get Payment Details
export const getPaymentDetails = asyncHandler(async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await razorpay.payments.fetch(paymentId);
    
    res.json({
      success: true,
      payment
    });
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch payment details',
      error: error.message 
    });
  }
});

// Get All Orders (Admin)
export const getAllOrders = asyncHandler(async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      paymentMethod, 
      paymentStatus,
      search 
    } = req.query;

    let filter = {};
    
    if (status) filter.orderStatus = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'userDetails.name': { $regex: search, $options: 'i' } },
        { 'userDetails.email': { $regex: search, $options: 'i' } },
        { 'userDetails.phone': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const orders = await Order.find(filter)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch orders',
      error: error.message 
    });
  }
});

// Get Order Details
export const getOrderDetails = asyncHandler(async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const order = await Order.findOne({ orderNumber })
      .populate('userId', 'name email phone city pincode country');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch order details',
      error: error.message 
    });
  }
});

// Update Order Status
export const updateOrderStatus = asyncHandler(async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { orderStatus, notes } = req.body;

    const validStatuses = ['placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    const updateData = { orderStatus };
    if (notes) updateData.notes = notes;
    if (orderStatus === 'delivered') updateData.actualDeliveryTime = new Date();

    // Find the order first to get user details
    const existingOrder = await Order.findOne({ orderNumber }).populate('userId', 'email name');
    
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update the order
    const order = await Order.findOneAndUpdate(
      { orderNumber },
      updateData,
      { new: true }
    ).populate('userId', 'email name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Send email notification if status changed and user has email
    let emailResult = null;
    if (existingOrder.orderStatus !== orderStatus && order.userId?.email) {
      console.log(`Order status changed from ${existingOrder.orderStatus} to ${orderStatus}, sending email notification`);
      
      try {
        emailResult = await sendOrderStatusNotification(
          order,
          orderStatus,
          order.userId.email
        );
        
        if (emailResult.success) {
          console.log('Email notification sent successfully:', emailResult.messageId);
        } else {
          console.error('Failed to send email notification:', emailResult.error);
        }
      } catch (emailError) {
        console.error('Error sending email notification:', emailError.message);
        // Don't fail the order update if email fails
      }
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order,
      emailNotification: emailResult ? {
        sent: emailResult.success,
        messageId: emailResult.messageId,
        error: emailResult.error
      } : null
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update order status',
      error: error.message 
    });
  }
});

// Get User Orders
export const getUserOrders = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id; // Use MongoDB ObjectId instead of Firebase UID
    const { page = 1, limit = 10 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    console.log('Fetching orders for user:', userId);

    const skip = (page - 1) * limit;
    
    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments({ userId });

    res.json({
      success: true,
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch orders',
      error: error.message 
    });
  }
});