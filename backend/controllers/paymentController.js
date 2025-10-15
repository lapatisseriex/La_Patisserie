import Razorpay from 'razorpay';
import crypto from 'crypto';
import { asyncHandler } from '../utils/asyncHandler.js';
import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import Location from '../models/locationModel.js';
import Hostel from '../models/hostelModel.js';
import DeliveryLocationMapping from '../models/deliveryLocationMappingModel.js';
import mongoose from 'mongoose';
import Payment from '../models/paymentModel.js';
import Notification from '../models/notificationModel.js';
import { sendOrderStatusNotification, sendOrderConfirmationEmail } from '../utils/orderEmailService.js';
import { createNotification } from './notificationController.js';

// Initialize Razorpay with validation
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error('❌ Razorpay configuration missing. Please check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.');
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Helper: safely build a case-insensitive regex from input
const ciExact = (text) => new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

// Helper: Resolve a Location document from an order's deliveryLocation value or userDetails
const resolveLocationInfo = async (deliveryLocation, userDetails) => {
  try {
    if (!deliveryLocation && !userDetails) return null;

    let locDoc = null;
    const raw = typeof deliveryLocation === 'string' ? deliveryLocation.trim() : '';

    // 1) If it's a valid ObjectId, try by _id first
    if (raw && mongoose.Types.ObjectId.isValid(raw)) {
      locDoc = await Location.findById(raw).select('city area pincode');
    }

    // 2) If not found, try to parse JSON string (in case a serialized object was stored)
    if (!locDoc && raw && (raw.startsWith('{') || raw.startsWith('['))) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (parsed._id && mongoose.Types.ObjectId.isValid(parsed._id)) {
            locDoc = await Location.findById(parsed._id).select('city area pincode');
          }
          if (!locDoc) {
            // Try match by pincode or area from parsed object
            if (parsed.pincode) {
              locDoc = await Location.findOne({ pincode: String(parsed.pincode) }).select('city area pincode');
            }
            if (!locDoc && parsed.area) {
              locDoc = await Location.findOne({ area: ciExact(String(parsed.area)) }).select('city area pincode');
            }
          }
        }
      } catch (_) {
        // ignore JSON parse errors
      }
    }

    // 3) If still not found, try to extract a 6-digit pincode from the string
    if (!locDoc && raw) {
      const pinMatch = raw.match(/\b(\d{6})\b/);
      if (pinMatch) {
        locDoc = await Location.findOne({ pincode: pinMatch[1] }).select('city area pincode');
      }
    }

    // 4) Try to parse common "Area, City - Pincode" pattern or "Area, City"
    if (!locDoc && raw) {
      // Split on '-' first to separate pincode segment if present, then on ',' for area/city
      const left = raw.split('-')[0].trim();
      const parts = left.split(',').map(s => s.trim()).filter(Boolean);
      const area = parts[0];
      const city = parts[1];
      if (area) {
        // Prefer exact area match
        locDoc = await Location.findOne({ area: ciExact(area) }).select('city area pincode');
      }
      if (!locDoc && city) {
        // Fallback: combine area+city search to narrow down
        locDoc = await Location.findOne({ city: ciExact(city), ...(area ? { area: ciExact(area) } : {}) }).select('city area pincode');
      }
    }

    // 5) Fallbacks using userDetails
    if (!locDoc && userDetails?.pincode) {
      locDoc = await Location.findOne({ pincode: String(userDetails.pincode) }).select('city area pincode');
    }
    if (!locDoc && userDetails?.city) {
      locDoc = await Location.findOne({ city: ciExact(String(userDetails.city)) }).select('city area pincode');
    }

    if (locDoc) {
      return { city: locDoc.city, area: locDoc.area, pincode: locDoc.pincode, locationId: locDoc._id };
    }

    // Last resort: surface whatever we can from userDetails or raw
    if (userDetails?.city || userDetails?.pincode) {
      return { city: userDetails.city || null, area: null, pincode: userDetails.pincode || null, locationId: null };
    }
    if (raw) {
      return { city: raw, area: null, pincode: null, locationId: null };
    }
    return null;
  } catch (e) {
    console.error('resolveLocationInfo error:', e.message);
    return null;
  }
};

// Helper function to restore product stock when orders are cancelled
const restoreProductStock = async (cartItems) => {
  try {
    console.log('🔄 Restoring product stock for', cartItems.length, 'items');
    
    const updatePromises = cartItems.map(async (item) => {
      try {
        const product = await Product.findById(item.productId);
        if (product) {
          const vi = Number.isInteger(item?.variantIndex) ? item.variantIndex : 0;
          const variant = Array.isArray(product.variants) && product.variants.length > vi ? product.variants[vi] : undefined;
          const variantTracks = Boolean(variant?.isStockActive);
          
          if (variantTracks) {
            const result = await Product.updateOne(
              { _id: item.productId },
              { $inc: { [`variants.${vi}.stock`]: item.quantity } }
            );
            
            if (result.modifiedCount > 0) {
              console.log(`✅ Stock restored: "${product.name}" variant ${vi} +${item.quantity}`);
            } else {
              console.warn(`⚠️ Could not restore stock for "${product.name}" variant ${vi}`);
            }
          } else {
            console.log(`ℹ️ Product "${product.name}" variant ${vi} does not track stock - no restoration needed`);
          }
        }
      } catch (error) {
        console.error(`❌ Error restoring stock for product ${item.productId}:`, error.message);
      }
    });

    await Promise.all(updatePromises);
    console.log('✅ Product stock restoration completed');
  } catch (error) {
    console.error('❌ Error restoring product stock:', error);
  }
};

// Helper function to decrement product stock after successful payment/order
const decrementProductStock = async (cartItems) => {
  try {
    console.log('🔻 Decrementing product stock for', cartItems.length, 'items');
    
    const updatePromises = cartItems.map(async (item) => {
      try {
        const product = await Product.findById(item.productId);
        if (product) {
          // Get variant index from item (from order schema) 
          const vi = Number.isInteger(item?.variantIndex) ? item.variantIndex : 0;
          const variant = Array.isArray(product.variants) && product.variants.length > vi ? product.variants[vi] : undefined;
          const variantTracks = Boolean(variant?.isStockActive);
          
          if (variantTracks) {
            const path = `variants.${vi}.stock`;
            const currentStock = variant.stock || 0;
            
            console.log(`📊 Stock check: Product "${product.name}" variant ${vi} - Current: ${currentStock}, Ordered: ${item.quantity}`);
            
            const result = await Product.updateOne(
              { 
                _id: item.productId, 
                [`variants.${vi}.stock`]: { $gte: item.quantity } 
              },
              { 
                $inc: { [`variants.${vi}.stock`]: -item.quantity } 
              }
            );
            
            if (result.modifiedCount > 0) {
              const newStock = currentStock - item.quantity;
              console.log(`✅ Stock decremented: "${product.name}" variant ${vi} | ${currentStock} → ${newStock} (sold: ${item.quantity})`);
            } else {
              console.warn(`⚠️ Stock decrement failed for "${product.name}" variant ${vi} - insufficient stock (need: ${item.quantity}, have: ${currentStock})`);
            }
          } else {
            console.log(`ℹ️ Product "${product.name}" variant ${vi} does not track stock - no decrement needed`);
          }
        } else {
          console.error(`❌ Product not found: ${item.productId}`);
        }
      } catch (error) {
        console.error(`❌ Error decrementing stock for product ${item.productId}:`, error.message);
      }
    });

    await Promise.all(updatePromises);
    console.log('✅ Product stock decrements completed');
  } catch (error) {
    console.error('❌ Error decrementing product stock:', error);
    // Don't throw error as this shouldn't break the order process
  }
};

// Helper function to update product order counts
const updateProductOrderCounts = async (cartItems) => {
  try {
    console.log('Updating product order counts for cart items:', cartItems);
    
    const updatePromises = cartItems.map(async (item) => {
      try {
        const product = await Product.findById(item.productId);
        if (product) {
          await product.incrementOrderCount(item.quantity);
          console.log(`Updated order count for product ${product.name} by ${item.quantity}`);
        }
      } catch (error) {
        console.error(`Error updating order count for product ${item.productId}:`, error.message);
      }
    });

    await Promise.all(updatePromises);
    console.log('Product order counts updated successfully');
  } catch (error) {
    console.error('Error updating product order counts:', error);
    // Don't throw error as this shouldn't break the order process
  }
};

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
      hostelName,
      orderSummary 
    } = req.body;

    console.log('Creating order with amount:', amount, 'Payment method:', paymentMethod);
    console.log('Hostel name received:', hostelName);
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

    // Try to find hostel ID based on hostelName or deliveryLocation
    let hostelId = null;
    if (hostelName) {
      try {
        // First try to find hostel by exact name match
        const hostel = await Hostel.findOne({ 
          name: { $regex: new RegExp(`^${hostelName.trim()}$`, 'i') },
          isActive: true 
        });
        
        if (hostel) {
          hostelId = hostel._id;
          console.log('Found hostel by name:', hostel.name, 'ID:', hostelId);
        } else {
          // Try to find using delivery location mapping
          const mapping = await DeliveryLocationMapping.findOne({
            $or: [
              { hostelName: { $regex: new RegExp(`^${hostelName.trim()}$`, 'i') } },
              { deliveryLocation: { $regex: new RegExp(`^${deliveryLocation.trim()}$`, 'i') } }
            ],
            isActive: true
          });
          
          if (mapping && mapping.hostelId) {
            hostelId = mapping.hostelId;
            console.log('Found hostel through mapping:', mapping.hostelName, 'ID:', hostelId);
          }
        }
      } catch (error) {
        console.log('Error finding hostel:', error.message);
        // Don't throw error as this shouldn't break the order process
      }
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
      hostelName,
      hostelId,
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
    console.log('Order hostelName stored:', order.hostelName);
    console.log('Starting notification creation for user:', userId, 'order:', orderNumber);

    // Create "Order Placed" notification for the user
    try {
      // Check if notification already exists for this order
      const existingNotification = await Notification.findOne({
        userId,
        orderNumber,
        type: 'order_placed'
      });

      if (!existingNotification) {
        await createNotification(
          userId,
          orderNumber,
          'order_placed',
          '**Order Placed** Successfully',
          `Your order **#${orderNumber}** has been placed successfully. Total amount: ₹${order.amount}`
        );

        // Emit real-time notification via WebSocket if user is connected
        const io = global.io;
        const connectedUsers = global.connectedUsers;
        if (io && connectedUsers && connectedUsers.has(userId.toString())) {
          const socketId = connectedUsers.get(userId.toString());
          io.to(socketId).emit('newNotification', {
            type: 'order_placed',
            title: '**Order Placed** Successfully',
            message: `Your order **#${orderNumber}** has been placed successfully. Total amount: ₹${order.amount}`,
            orderNumber
          });
          console.log('Order placed notification sent via WebSocket to user:', userId);
        } else {
          console.log('User not connected via WebSocket, notification saved to database only');
        }
      } else {
        console.log('Order placed notification already exists for order:', orderNumber);
      }
    } catch (notificationError) {
      console.error('Error creating order placed notification:', notificationError);
      // Don't fail the order creation if notification fails
    }

    // For COD orders, decrement stock immediately since payment is guaranteed
    if (paymentMethod === 'cod' && cartItems && cartItems.length > 0) {
      console.log('📦 COD Order - decrementing product stock immediately');
      await decrementProductStock(cartItems);
      // Update product order counts for COD orders as they're confirmed at placement
      await updateProductOrderCounts(cartItems);
    }

    // For COD orders, create a pending Payment record so admin can track it
    if (paymentMethod === 'cod') {
      try {
        await Payment.create({
          userId,
          email: userDetails?.email,
          orderId: orderNumber,
          amount: amount / 100,
          paymentMethod: 'cod',
          paymentStatus: 'pending',
          date: new Date(),
          seatCount: Array.isArray(cartItems) ? cartItems.reduce((a, c) => a + (c.quantity || 0), 0) : undefined,
          meta: { source: 'createOrder' }
        });
        console.log('Created pending payment record for COD order:', orderNumber);
      } catch (e) {
        console.error('Failed to create COD payment record:', e.message);
      }
    }

    // For COD, send order confirmation email asynchronously AFTER responding,
    // so the UI confirms immediately. For online payments, email is sent after verification.
    if (paymentMethod === 'cod') {
      setImmediate(async () => {
        try {
          const user = await User.findById(userId).select('email name');
          if (user && user.email) {
            console.log('Sending COD order confirmation email to:', user.email);
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
          console.error('Error sending order confirmation email (async):', emailError.message);
        }
      });
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

    // ✅ IDEMPOTENCY CHECK: Prevent duplicate payment processing
    // Check if this payment has already been processed
    const existingPayment = await Payment.findOne({
      gatewayPaymentId: razorpay_payment_id
    });

    if (existingPayment) {
      console.log('⚠️ Payment already processed:', razorpay_payment_id);
      const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
      return res.json({
        success: true,
        message: 'Payment already verified',
        orderNumber: order?.orderNumber,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      });
    }

    // Create signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    // Verify signature
    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // ✅ ATOMIC UPDATE: Use findOneAndUpdate with conditions to prevent race conditions
      const order = await Order.findOneAndUpdate(
        { 
          razorpayOrderId: razorpay_order_id,
          paymentStatus: { $in: ['created', 'pending'] } // Only update if not already paid
        },
        { 
          paymentStatus: 'paid',
          razorpayPaymentId: razorpay_payment_id,
          orderStatus: 'confirmed'
        },
        { new: true }
      );

      if (!order) {
        // Check if order exists but already paid
        const existingOrder = await Order.findOne({ razorpayOrderId: razorpay_order_id });
        if (existingOrder && existingOrder.paymentStatus === 'paid') {
          console.log('⚠️ Order already paid:', existingOrder.orderNumber);
          return res.json({
            success: true,
            message: 'Payment already verified',
            orderNumber: existingOrder.orderNumber,
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
          });
        }
        
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        });
      }
      
      console.log('Payment verified successfully for order:', order.orderNumber);

      // Persist payment record for admin reporting
      try {
        await Payment.create({
          userId: order.userId,
          email: order?.userDetails?.email,
          orderId: order.orderNumber,
          movieName: order?.orderSummary?.note || undefined,
          amount: order.amount,
          paymentMethod: 'razorpay',
          paymentStatus: 'success',
          date: new Date(),
          parkingType: order?.orderSummary?.parkingType,
          seatCount: Array.isArray(order?.cartItems) ? order.cartItems.reduce((a, c) => a + (c.quantity || 0), 0) : undefined,
          gatewayPaymentId: razorpay_payment_id,
          gatewayOrderId: razorpay_order_id,
          meta: { source: 'verifyPayment' }
        });
      } catch (persistErr) {
        console.error('Failed to persist payment record:', persistErr.message);
      }
      
      // IMPORTANT: Decrement actual stock now that payment is confirmed
      if (order.cartItems && order.cartItems.length > 0) {
        console.log('💳 Payment confirmed - decrementing product stock');
        await decrementProductStock(order.cartItems);
      }
      
      // Update product order counts after successful payment
      if (order.cartItems && order.cartItems.length > 0) {
        await updateProductOrderCounts(order.cartItems);
      }

      // Send order confirmation email asynchronously for online payments
      setImmediate(async () => {
        try {
          const user = await User.findById(order.userId).select('email name');
          if (user && user.email) {
            console.log('Sending online payment order confirmation email to:', user.email);
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
          console.error('Error sending order confirmation email (async):', emailError.message);
        }
      });
      
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

// Cancel Order (when Razorpay popup is dismissed/cancelled)
export const cancelOrder = asyncHandler(async (req, res) => {
  try {
    const { razorpay_order_id } = req.body;
    const userId = req.user?._id;

    console.log('Cancelling order for Razorpay Order ID:', razorpay_order_id);

    if (!razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: 'Razorpay order ID is required'
      });
    }

    // Find the order
    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });

    if (!order) {
      console.log('Order not found for cancellation:', razorpay_order_id);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify the order belongs to the requesting user
    if (order.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to cancel this order'
      });
    }

    // Only cancel orders that are in 'created' payment status (not paid/failed)
    if (order.paymentStatus !== 'created') {
      console.log('Order already processed, cannot cancel. Payment status:', order.paymentStatus);
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled',
        currentStatus: order.paymentStatus
      });
    }

    // Update order status to cancelled
    order.orderStatus = 'cancelled';
    order.paymentStatus = 'cancelled';
    await order.save();

    console.log('Order cancelled successfully:', order.orderNumber);

    // Delete the "Order Placed" notification if it exists
    try {
      await Notification.deleteMany({
        userId: order.userId,
        orderNumber: order.orderNumber,
        type: 'order_placed'
      });
      console.log('Order placed notification deleted for cancelled order');
    } catch (notifError) {
      console.error('Error deleting notification:', notifError.message);
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      orderNumber: order.orderNumber
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
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
        // Save payment record as success
        try {
          const linkedOrder = await Order.findOne({ razorpayOrderId: capturedPayment.order_id });
          await Payment.create({
            userId: linkedOrder?.userId,
            email: linkedOrder?.userDetails?.email,
            orderId: linkedOrder?.orderNumber || capturedPayment.order_id,
            amount: (capturedPayment.amount / 100),
            paymentMethod: 'razorpay',
            paymentStatus: 'success',
            date: new Date(capturedPayment.created_at ? capturedPayment.created_at * 1000 : Date.now()),
            gatewayPaymentId: capturedPayment.id,
            gatewayOrderId: capturedPayment.order_id,
            meta: { source: 'webhook', method: capturedPayment.method }
          });
        } catch (err) {
          console.error('Failed to save webhook payment:', err.message);
        }
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
        try {
          const linkedOrder = await Order.findOne({ razorpayOrderId: failedPayment.order_id });
          await Payment.create({
            userId: linkedOrder?.userId,
            email: linkedOrder?.userDetails?.email,
            orderId: linkedOrder?.orderNumber || failedPayment.order_id,
            amount: (failedPayment.amount / 100),
            paymentMethod: 'razorpay',
            paymentStatus: 'pending',
            date: new Date(failedPayment.created_at ? failedPayment.created_at * 1000 : Date.now()),
            gatewayPaymentId: failedPayment.id,
            gatewayOrderId: failedPayment.order_id,
            meta: { source: 'webhook', reason: failedPayment.error_reason }
          });
        } catch (err) {
          console.error('Failed to save failed payment:', err.message);
        }
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
      .populate({
        path: 'hostelId',
        populate: {
          path: 'locationId',
          model: 'Location'
        }
      })
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
      .populate('userId', 'name email phone city pincode country')
      .populate({
        path: 'hostelId',
        populate: {
          path: 'locationId',
          model: 'Location'
        }
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Populate product details for cart items
    const enrichedCartItems = await Promise.all(order.cartItems.map(async (item) => {
      try {
        const Product = (await import('../models/productModel.js')).default;
        const product = await Product.findById(item.productId).select('name images category description');
        
        return {
          ...item.toObject(),
          productImage: product?.images?.[0] || null,
          productCategory: product?.category || null,
          productDescription: product?.description || null
        };
      } catch (error) {
        console.error(`Error fetching product details for ${item.productId}:`, error);
        return {
          ...item.toObject(),
          productImage: null,
          productCategory: null,
          productDescription: null
        };
      }
    }));

    const enrichedOrder = {
      ...order.toObject(),
      cartItems: enrichedCartItems
    };

    res.json({
      success: true,
      order: enrichedOrder
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
    
    // Only show orders with specific statuses for users (exclude cancelled and payment pending)
    const orders = await Order.find({ 
      userId,
      orderStatus: { $in: ['placed', 'confirmed', 'ready', 'out_for_delivery', 'delivered'] },
      paymentStatus: { $ne: 'cancelled' }
    })
      .populate({
        path: 'hostelId',
        populate: {
          path: 'locationId',
          model: 'Location'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Populate product details for cart items
    const enrichedOrders = await Promise.all(orders.map(async (order) => {
      const enrichedCartItems = await Promise.all(order.cartItems.map(async (item) => {
        try {
          const Product = (await import('../models/productModel.js')).default;
          const product = await Product.findById(item.productId).select('name images category');
          
          return {
            ...item.toObject(),
            productImage: product?.images?.[0] || null,
            productCategory: product?.category || null
          };
        } catch (error) {
          console.error(`Error fetching product details for ${item.productId}:`, error);
          return {
            ...item.toObject(),
            productImage: null,
            productCategory: null
          };
        }
      }));

      return {
        ...order.toObject(),
        cartItems: enrichedCartItems
      };
    }));

    const total = await Order.countDocuments({ 
      userId,
      orderStatus: { $in: ['placed', 'confirmed', 'ready', 'out_for_delivery', 'delivered'] },
      paymentStatus: { $ne: 'cancelled' }
    });

    res.json({
      success: true,
      orders: enrichedOrders,
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

// Admin: List all payments with filters and pagination
export const listPayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, method, startDate, endDate, search } = req.query;
  const filter = {};
  if (status) filter.paymentStatus = status;
  if (method) filter.paymentMethod = method;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }
  if (search) {
    filter.$or = [
      { email: { $regex: search, $options: 'i' } },
      { orderId: { $regex: search, $options: 'i' } },
    ];
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Payment.find(filter).sort({ date: -1 }).skip(skip).limit(Number(limit)),
    Payment.countDocuments(filter)
  ]);
  // Avoid stale caching in browsers/proxies
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.json({ success: true, items, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
});

// Admin: Get single payment by id
export const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate('userId', 'name email phone city pincode country role');
  if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

  // Try to attach minimal order summary by orderNumber
  let order = null;
  let locationInfo = null;
  if (payment.orderId) {
    const orderDoc = await Order.findOne({ orderNumber: payment.orderId })
      .select('orderNumber paymentMethod paymentStatus orderStatus amount createdAt userDetails deliveryLocation cartItems');
    if (orderDoc) {
      // Enrich cart items with product info (image, category)
      const enrichedCartItems = await Promise.all(orderDoc.cartItems.map(async (item) => {
        try {
          const prod = await Product.findById(item.productId).select('name images category');
          return {
            ...item.toObject(),
            productImage: prod?.images?.[0] || null,
            productCategory: prod?.category || null,
          };
        } catch (e) {
          return { ...item.toObject(), productImage: null, productCategory: null };
        }
      }));

      order = {
        ...orderDoc.toObject(),
        cartItems: enrichedCartItems,
      };

      // Robustly resolve city/area/pincode from Location
      locationInfo = await resolveLocationInfo(orderDoc.deliveryLocation, orderDoc.userDetails);
    }
  }

  res.json({ success: true, payment, order, location: locationInfo });
});

// Create payment record (e.g., when booking confirmed for COD or external success)
export const createPaymentRecord = asyncHandler(async (req, res) => {
  const { userId, email, orderId, movieName, amount, paymentMethod, paymentStatus = 'pending', date, parkingType, seatCount, gatewayPaymentId, gatewayOrderId, meta } = req.body;
  const doc = await Payment.create({
    userId,
    email,
    orderId,
    movieName,
    amount,
    paymentMethod,
    paymentStatus,
    date: date ? new Date(date) : new Date(),
    parkingType,
    seatCount,
    gatewayPaymentId,
    gatewayOrderId,
    meta,
  });
  res.status(201).json({ success: true, payment: doc });
});

// Admin: Backfill payments from Orders collection
export const backfillPaymentsFromOrders = asyncHandler(async (req, res) => {
  const { dryRun = false } = req.query;
  // Fetch orders to backfill
  const orders = await Order.find({}).select('orderNumber userId userDetails amount createdAt paymentMethod paymentStatus razorpayPaymentId razorpayOrderId');
  let created = 0, skipped = 0, updated = 0;

  for (const o of orders) {
    // Determine status mapping
    let paymentStatus = 'pending';
    if (o.paymentStatus === 'paid') paymentStatus = 'success';
    // We track only success/pending, ignore others

    const payload = {
      userId: o.userId,
      email: o?.userDetails?.email,
      orderId: o.orderNumber,
      amount: o.amount,
      paymentMethod: o.paymentMethod || 'razorpay',
      paymentStatus,
      date: o.createdAt,
      gatewayPaymentId: o.razorpayPaymentId,
      gatewayOrderId: o.razorpayOrderId,
      meta: { source: 'backfill' }
    };

    const existing = await Payment.findOne({ orderId: o.orderNumber });
    if (!existing) {
      if (!dryRun) await Payment.create(payload);
      created++;
    } else {
      // Optionally update mismatched fields
      const needsUpdate = (existing.paymentStatus !== paymentStatus) || (existing.amount !== o.amount) || (existing.paymentMethod !== payload.paymentMethod);
      if (needsUpdate) {
        if (!dryRun) await Payment.updateOne({ _id: existing._id }, { $set: payload });
        updated++;
      } else {
        skipped++;
      }
    }
  }

  res.json({ success: true, created, updated, skipped, totalOrders: orders.length });
});

// Admin: Update payment status (e.g., mark COD as paid)
export const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { paymentStatus } = req.body;

  const allowed = ['pending', 'success'];
  if (!allowed.includes(paymentStatus)) {
    return res.status(400).json({ success: false, message: 'Invalid payment status. Allowed: pending, success' });
  }

  const payment = await Payment.findById(id);
  if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

  const prev = payment.paymentStatus;
  payment.paymentStatus = paymentStatus;
  await payment.save();

  // Sync related order paymentStatus when possible
  if (payment.orderId) {
    const order = await Order.findOne({ orderNumber: payment.orderId });
    if (order) {
      if (paymentStatus === 'success') {
        // Mark order as paid; keep current orderStatus unchanged
        if (order.paymentStatus !== 'paid') {
          order.paymentStatus = 'paid';
          await order.save();
        }
      } else if (paymentStatus === 'pending') {
        // Only revert if not already paid online; be conservative
        if (order.paymentStatus === 'paid') {
          // Do not auto-downgrade from paid; keep as paid
        } else {
          order.paymentStatus = 'pending';
          await order.save();
        }
      }
    }
  }

  res.json({ success: true, payment, previousStatus: prev });
});

// User: Get user's payments/transactions
export const getUserPayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, method, startDate, endDate } = req.query;
  const userId = req.user._id;
  
  const filter = { userId };
  
  if (status) filter.paymentStatus = status;
  if (method) filter.paymentMethod = method;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }
  
  const skip = (Number(page) - 1) * Number(limit);
  
  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('orderId amount paymentMethod paymentStatus date gatewayPaymentId gatewayOrderId meta timestamps'),
    Payment.countDocuments(filter)
  ]);
  
  // Enrich payments with order information
  const enrichedPayments = await Promise.all(payments.map(async (payment) => {
    let orderInfo = null;
    if (payment.orderId) {
      const order = await Order.findOne({ orderNumber: payment.orderId })
        .select('orderNumber orderStatus cartItems deliveryLocation userDetails');
      if (order) {
        orderInfo = {
          orderNumber: order.orderNumber,
          orderStatus: order.orderStatus,
          itemCount: order.cartItems?.length || 0
        };
      }
    }
    
    return {
      _id: payment._id,
      orderId: payment.orderId,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      paymentStatus: payment.paymentStatus,
      date: payment.date,
      createdAt: payment.createdAt,
      gatewayPaymentId: payment.gatewayPaymentId,
      gatewayOrderId: payment.gatewayOrderId,
      orderInfo
    };
  }));
  
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({ 
    success: true, 
    payments: enrichedPayments, 
    pagination: { 
      page: Number(page), 
      limit: Number(limit), 
      total, 
      pages: Math.ceil(total / Number(limit)) 
    } 
  });
});