import Razorpay from 'razorpay';
import crypto from 'crypto';
import { asyncHandler } from '../utils/asyncHandler.js';
import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import { sendOrderStatusNotification, sendOrderConfirmationEmail } from '../utils/orderEmailService.js';

// Initialize Razorpay with validation
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error('❌ Razorpay configuration missing. Please check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.');
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

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

    // For COD orders, decrement stock immediately since payment is guaranteed
    if (paymentMethod === 'cod' && cartItems && cartItems.length > 0) {
      console.log('📦 COD Order - decrementing product stock immediately');
      await decrementProductStock(cartItems);
      // Update product order counts for COD orders as they're confirmed at placement
      await updateProductOrderCounts(cartItems);
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

    // Get the existing order to check previous status
    const existingOrder = await Order.findOne({ orderNumber }).populate('userId', 'email name');
    
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Handle order cancellation - restore stock
    if (orderStatus === 'cancelled' && existingOrder.orderStatus !== 'cancelled') {
      console.log('🔄 Order cancelled - restoring product stock');
      await restoreProductStock(existingOrder.cartItems);
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
        message: 'Order not found after update'
      });
    }

    // Update product order counts if status is being confirmed for the first time
    if (existingOrder.orderStatus !== 'confirmed' && orderStatus === 'confirmed' && order.cartItems && order.cartItems.length > 0) {
      console.log('Order confirmed - updating product order counts');
      await updateProductOrderCounts(order.cartItems);
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

    const total = await Order.countDocuments({ userId });

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