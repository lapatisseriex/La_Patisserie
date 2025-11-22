import { asyncHandler } from '../utils/asyncHandler.js';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import DeliveryLocationMapping from '../models/deliveryLocationMappingModel.js';
import Payment from '../models/paymentModel.js';
import User from '../models/userModel.js';
import { createNotification } from './notificationController.js';
import { resolveVariantInfoForItem } from '../utils/variantUtils.js';
import { getActiveAdminEmails } from '../utils/adminUtils.js';
import {
  sendOrderStatusNotification,
  sendAdminOrderStatusNotification
} from '../utils/orderEmailService.js';
import { getLogoData } from '../utils/logoUtils.js';
import { emitPaymentUpdate } from '../utils/socketEvents.js';

const resolveUserIdString = (userRef) => {
  if (!userRef) {
    return null;
  }

  if (typeof userRef === 'string') {
    return userRef;
  }

  if (typeof userRef === 'object') {
    // Check if it's a Mongoose ObjectId first (has toHexString method)
    if (typeof userRef.toHexString === 'function') {
      return userRef.toHexString();
    }

    // Then check for toString
    if (typeof userRef.toString === 'function') {
      const stringValue = userRef.toString();
      // Avoid infinite recursion - return string only if it's different from '[object Object]'
      if (stringValue && stringValue !== '[object Object]') {
        return stringValue;
      }
    }

    // Only recurse if _id or id is different from the original object
    if (userRef._id && userRef._id !== userRef) {
      return resolveUserIdString(userRef._id);
    }

    if (userRef.id && userRef.id !== userRef) {
      return resolveUserIdString(userRef.id);
    }
  }

  return null;
};

const getConnectedUserSocketId = (userRef) => {
  const userId = resolveUserIdString(userRef);
  if (!userId || !global.connectedUsers) {
    return null;
  }
  return global.connectedUsers.get(userId);
};

const normalizeOrderForEmail = async (orderDoc) => {
  if (!orderDoc) {
    return null;
  }

  let plainOrder;
  if (typeof orderDoc.toObject === 'function') {
    plainOrder = orderDoc.toObject({ virtuals: true });
  } else if (orderDoc._doc) {
    plainOrder = { ...orderDoc._doc };
  } else {
    plainOrder = { ...orderDoc };
  }

  if (!plainOrder.cartItems && orderDoc.cartItems) {
    plainOrder.cartItems = Array.isArray(orderDoc.cartItems)
      ? orderDoc.cartItems.map(item => (typeof item.toObject === 'function' ? item.toObject() : { ...item }))
      : [];
  }

  const userDetails = { ...(plainOrder.userDetails || {}) };
  let userCandidate = null;

  if (orderDoc.userId) {
    if (typeof orderDoc.userId === 'object' && orderDoc.userId !== null && orderDoc.userId.email) {
      userCandidate = orderDoc.userId;
    } else {
      userCandidate = await User.findById(orderDoc.userId).select('name email phone').lean();
    }
  }

  if (userCandidate) {
    if (userCandidate.name && !userDetails.name) userDetails.name = userCandidate.name;
    if (userCandidate.email && !userDetails.email) userDetails.email = userCandidate.email;
    if (userCandidate.phone && !userDetails.phone) userDetails.phone = userCandidate.phone;

    plainOrder.userId = {
      ...(typeof plainOrder.userId === 'object' && plainOrder.userId !== null ? plainOrder.userId : {}),
      _id: userCandidate._id || plainOrder.userId,
      name: userCandidate.name || userDetails.name || plainOrder.userId?.name,
      email: userCandidate.email || userDetails.email || plainOrder.userId?.email,
      phone: userCandidate.phone || userDetails.phone || plainOrder.userId?.phone
    };
  }

  plainOrder.userDetails = userDetails;

  return plainOrder;
};

const sendStatusEmails = async (orderDoc, previousStatus, newStatus) => {
  try {
    if (!orderDoc || !newStatus || newStatus === previousStatus) {
      return;
    }

    const normalizedOrder = await normalizeOrderForEmail(orderDoc);
    if (!normalizedOrder) {
      return;
    }

    normalizedOrder.orderStatus = newStatus;

    const userEmail = normalizedOrder.userDetails?.email || normalizedOrder.userId?.email;
    if (userEmail) {
      try {
        // Get logo data for email attachment
        const logoData = getLogoData();
        
        await sendOrderStatusNotification(normalizedOrder, newStatus, userEmail, logoData);
      } catch (userEmailError) {
        console.error('Failed to send user status email:', userEmailError.message);
      }
    }

    // Don't send admin email for "out_for_delivery" status - only notify the customer
    if (newStatus !== 'out_for_delivery') {
      let adminEmails = [];
      try {
        adminEmails = await getActiveAdminEmails();
      } catch (adminLookupError) {
        console.error('Failed to fetch admin recipients:', adminLookupError.message);
      }

      if (Array.isArray(adminEmails) && adminEmails.length > 0) {
        try {
          await sendAdminOrderStatusNotification(normalizedOrder, newStatus, adminEmails);
        } catch (adminEmailError) {
          console.error('Failed to send admin status email:', adminEmailError.message);
        }
      }
    } else {
      console.log(`Skipping admin email notification for order #${normalizedOrder.orderNumber} - Status: out_for_delivery (customer-only notification)`);
    }
  } catch (error) {
    console.error('Status email workflow failed:', error.message);
  }
};

// @desc    Get grouped pending orders for order tracking
// @route   GET /api/admin/orders/grouped
// @access  Private/Admin
export const getGroupedPendingOrders = asyncHandler(async (req, res) => {
  try {
    // Get orders with 'placed', 'confirmed', and 'out_for_delivery' status (ready for dispatch or partially dispatched)
    const orders = await Order.find({
      orderStatus: { $in: ['placed', 'confirmed', 'out_for_delivery'] }
    })
    .populate({
      path: 'cartItems.productId',
      select: 'name variants images category',
      populate: {
        path: 'category',
        model: 'Category'
      }
    })
    .populate({
      path: 'hostelId',
      populate: {
        path: 'locationId',
        model: 'Location'
      }
    })
    .lean();
    
    if (orders.length === 0) {
      return res.status(200).json([]);
    }
    
    // Manually group the orders
    const hostelGroups = {};
    
    orders.forEach(order => {
      // Get hostel information from populated data or fallback to stored strings
      const hostelName = order.hostelId?.name || order.hostelName || 'Unknown Hostel';
      const hostelLocation = order.hostelId?.locationId ? 
        `${order.hostelId.locationId.area}, ${order.hostelId.locationId.city} - ${order.hostelId.locationId.pincode}` :
        order.deliveryLocation || 'Unknown Location';
      
      // Initialize hostel group if not exists
      if (!hostelGroups[hostelName]) {
        hostelGroups[hostelName] = {
          hostel: hostelName,
          hostelId: order.hostelId?._id || null,
          locationInfo: order.hostelId?.locationId || null,
          deliveryLocations: [], // Store all delivery locations
          categories: {},
          totalOrders: 0
        };
      }
      
      // Add delivery location to the list if not already present
      // Use the constructed hostel location if available, otherwise use the stored delivery location
      const location = hostelLocation || order.deliveryLocation?.trim();
      if (location && location !== '' && !hostelGroups[hostelName].deliveryLocations.includes(location)) {
        hostelGroups[hostelName].deliveryLocations.push(location);
      }
      
      // Process each cart item - only count pending items
      order.cartItems.forEach(item => {
        // Skip items that are already dispatched or delivered
        if (item.dispatchStatus === 'dispatched' || item.dispatchStatus === 'delivered') {
          return;
        }

        let categoryName = 'Unknown Category';
        
        // Try to get category name from populated data
        if (item.productId && item.productId.category && item.productId.category.name) {
          categoryName = item.productId.category.name;
        }
        
        const productName = item.productName;
        
        // Initialize category if not exists
        if (!hostelGroups[hostelName].categories[categoryName]) {
          hostelGroups[hostelName].categories[categoryName] = {
            category: categoryName,
            products: {},
            totalOrders: 0
          };
        }
        
        // Initialize product if not exists
        if (!hostelGroups[hostelName].categories[categoryName].products[productName]) {
          hostelGroups[hostelName].categories[categoryName].products[productName] = {
            productName: productName,
            productId: item.productId ? item.productId._id : item.productId,
            productImage: item.productId && item.productId.images && item.productId.images.length > 0 
              ? item.productId.images[0] 
              : null,
            orderCount: 0,
            totalQuantity: 0,
            orderIds: []
          };
        }
        
        // Add to counts - only pending items
        hostelGroups[hostelName].categories[categoryName].products[productName].orderCount += 1;
        hostelGroups[hostelName].categories[categoryName].products[productName].totalQuantity += item.quantity;
        hostelGroups[hostelName].categories[categoryName].products[productName].orderIds.push(order._id);
        
        hostelGroups[hostelName].categories[categoryName].totalOrders += 1;
        hostelGroups[hostelName].totalOrders += 1;
      });
    });
    
    // Convert to array format expected by frontend, filtering out empty categories
    const result = Object.values(hostelGroups)
      .map(hostelGroup => ({
        hostel: hostelGroup.hostel,
        hostelId: hostelGroup.hostelId,
        locationInfo: hostelGroup.locationInfo,
        deliveryLocation: hostelGroup.deliveryLocations.length > 0 
          ? hostelGroup.deliveryLocations[0]
          : 'Unknown Location',
        totalOrders: hostelGroup.totalOrders,
        categories: Object.values(hostelGroup.categories)
          .filter(categoryGroup => categoryGroup.totalOrders > 0)
          .map(categoryGroup => ({
            category: categoryGroup.category,
            totalOrders: categoryGroup.totalOrders,
            products: Object.values(categoryGroup.products).filter(product => product.orderCount > 0)
          }))
      }))
      .filter(hostelGroup => hostelGroup.totalOrders > 0 && hostelGroup.categories.length > 0);

    // Try to enhance with delivery location mapping data
    try {
      const mappings = await DeliveryLocationMapping.find({ isActive: true }).lean();
      const mappingByHostel = {};
      
      mappings.forEach(mapping => {
        if (mapping.hostelName && mapping.deliveryLocation) {
          mappingByHostel[mapping.hostelName] = mapping.deliveryLocation;
        }
      });

      // Update delivery locations with mapping data
      result.forEach(hostelGroup => {
        if (mappingByHostel[hostelGroup.hostel]) {
          hostelGroup.deliveryLocation = mappingByHostel[hostelGroup.hostel];
        }
      });
    } catch (mappingError) {
      console.log('Could not fetch delivery location mappings:', mappingError.message);
    }
    
    res.status(200).json(result);
    
  } catch (error) {
    console.error('Error in getGroupedPendingOrders:', error);
    res.status(500).json({ 
      message: 'Failed to fetch grouped orders',
      error: error.message 
    });
  }
});

// @desc    Get individual pending orders for detailed dispatch management
// @route   GET /api/admin/orders/individual
// @access  Private/Admin
export const getIndividualPendingOrders = asyncHandler(async (req, res) => {
  try {
    // Get orders with 'placed' and 'confirmed' status that have pending items
    const orders = await Order.find({
      orderStatus: { $in: ['placed', 'confirmed', 'out_for_delivery'] },
      'cartItems.dispatchStatus': { $in: ['pending', null, undefined] }
    })
    .populate({
      path: 'cartItems.productId',
      select: 'name variants images category',
      populate: {
        path: 'category',
        model: 'Category'
      }
    })
    .populate('userId', 'name email phone')
    .populate({
      path: 'hostelId',
      populate: {
        path: 'locationId',
        model: 'Location'
      }
    })
    .sort({ createdAt: 1 }) // Oldest first
    .lean();
    
    if (orders.length === 0) {
      return res.status(200).json([]);
    }
    
    // Filter and enrich orders
    const result = orders.map(order => {
      // Get all cart items categorized by their dispatch status
      const pendingItems = order.cartItems.filter(item => 
        !item.dispatchStatus || item.dispatchStatus === 'pending'
      ).map(item => {
        const plainItem = typeof item.toObject === 'function' ? item.toObject() : { ...item };
        const { variant, variantLabel } = resolveVariantInfoForItem(plainItem, item.productId);

        return {
          ...plainItem,
          variant: variant || plainItem.variant || null,
          variantLabel: variantLabel || plainItem.variantLabel || '',
          categoryName: item.productId && item.productId.category && item.productId.category.name 
            ? item.productId.category.name 
            : 'Unknown Category',
          dispatchStatus: item.dispatchStatus || 'pending'
        };
      });

      const dispatchedItems = order.cartItems.filter(item => 
        item.dispatchStatus === 'dispatched'
      ).map(item => {
        const plainItem = typeof item.toObject === 'function' ? item.toObject() : { ...item };
        const { variant, variantLabel } = resolveVariantInfoForItem(plainItem, item.productId);

        return {
          ...plainItem,
          variant: variant || plainItem.variant || null,
          variantLabel: variantLabel || plainItem.variantLabel || '',
          categoryName: item.productId && item.productId.category && item.productId.category.name 
            ? item.productId.category.name 
            : 'Unknown Category',
          dispatchStatus: item.dispatchStatus
        };
      });

      const deliveredItems = order.cartItems.filter(item => 
        item.dispatchStatus === 'delivered'
      ).map(item => {
        const plainItem = typeof item.toObject === 'function' ? item.toObject() : { ...item };
        const { variant, variantLabel } = resolveVariantInfoForItem(plainItem, item.productId);

        return {
          ...plainItem,
          variant: variant || plainItem.variant || null,
          variantLabel: variantLabel || plainItem.variantLabel || '',
          categoryName: item.productId && item.productId.category && item.productId.category.name 
            ? item.productId.category.name 
            : 'Unknown Category',
          dispatchStatus: item.dispatchStatus
        };
      });
      
      // Only include orders that have pending items OR dispatched items (for delivery management)
      if (pendingItems.length === 0 && dispatchedItems.length === 0) {
        return null; // Skip orders with no pending or dispatched items
      }
      
      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        userDetails: order.userDetails,
        deliveryLocation: order.deliveryLocation,
        hostelName: order.hostelName,
        hostelId: order.hostelId?._id || null,
        hostelInfo: order.hostelId || null,
        locationInfo: order.hostelId?.locationId || null,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        amount: order.amount,
        createdAt: order.createdAt,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        pendingItems: pendingItems,
        dispatchedItems_list: dispatchedItems,
        deliveredItems_list: deliveredItems,
        totalItems: order.cartItems.length,
        dispatchedItems: dispatchedItems.length,
        deliveredItems: deliveredItems.length
      };
    }).filter(Boolean); // Remove null entries
    
    res.status(200).json(result);
    
  } catch (error) {
    console.error('Error in getIndividualPendingOrders:', error);
    res.status(500).json({ 
      message: 'Failed to fetch individual pending orders',
      error: error.message 
    });
  }
});

// @desc    Dispatch orders for a specific product
// @route   POST /api/admin/dispatch
// @access  Private/Admin
export const dispatchOrders = asyncHandler(async (req, res) => {
  const { hostel, category, productName, count } = req.body;

  // Validate required fields
  if (!hostel || !category || !productName || !count) {
    return res.status(400).json({
      message: 'All fields are required: hostel, category, productName, count'
    });
  }

  if (count <= 0) {
    return res.status(400).json({
      message: 'Count must be greater than 0'
    });
  }

  try {
    // Find orders that match the criteria and are ready for dispatch ('placed' or 'confirmed' status)
    const pendingOrders = await Order.find({
      hostelName: hostel,
      orderStatus: { $in: ['placed', 'confirmed'] },
      'cartItems.productName': productName
    }).populate({
      path: 'cartItems.productId',
      populate: {
        path: 'category',
        model: 'Category'
      }
    }).limit(count * 2).sort({ createdAt: 1 });

    if (pendingOrders.length === 0) {
      return res.status(404).json({
        message: 'No orders ready for dispatch found for the specified criteria'
      });
    }

    // Filter orders that actually contain the specific product in the right category
    const matchingOrders = pendingOrders.filter(order => {
      return order.cartItems.some(item => {
        const itemCategoryName = item.productId && 
                                item.productId.category && 
                                item.productId.category.name ? 
                                item.productId.category.name : 'Unknown Category';
        
        return item.productName === productName && itemCategoryName === category;
      });
    });

    // Limit to the requested count
    const ordersToDispatch = matchingOrders.slice(0, count);
    
    if (ordersToDispatch.length === 0) {
      return res.status(404).json({
        message: 'No orders found matching the exact product and category criteria'
      });
    }

    // Update specific cart items to dispatched status and recalculate order status
    const dispatchPromises = ordersToDispatch.map(async (order) => {
      const previousStatus = order.orderStatus;

      const updatedCartItems = order.cartItems.map(item => {
        const plainItem = typeof item.toObject === 'function' ? item.toObject() : { ...item };
        if (plainItem.productName === productName) {
          const itemCategoryName = plainItem.productId &&
                                   plainItem.productId.category &&
                                   plainItem.productId.category.name
            ? plainItem.productId.category.name
            : 'Unknown Category';

          if (itemCategoryName === category) {
            return {
              ...plainItem,
              dispatchStatus: 'dispatched',
              dispatchedAt: new Date()
            };
          }
        }
        return plainItem;
      });

      // Update order asynchronously to avoid blocking WebSocket notification
      Order.findByIdAndUpdate(order._id, {
        cartItems: updatedCartItems,
        updatedAt: new Date()
      }).then(async (updatedOrder) => {
        if (updatedOrder) {
          const calculatedStatus = updatedOrder.calculateOrderStatus();
          if (calculatedStatus !== updatedOrder.orderStatus) {
            await Order.findByIdAndUpdate(order._id, {
              orderStatus: calculatedStatus
            }).catch(err => console.error('Failed to update order status:', err.message));
          }
        }
      }).catch(err => console.error('Failed to update order cart items:', err.message));

      const finalOrderDoc = await Order.findById(order._id)
        .populate('userId', 'name email phone');

      if (finalOrderDoc) {
        finalOrderDoc.cartItems = updatedCartItems;
        // Send emails asynchronously (non-blocking) via Vercel
        sendStatusEmails(finalOrderDoc, previousStatus, finalOrderDoc.orderStatus)
          .then(() => console.log(`✅ Bulk dispatch email sent for order #${finalOrderDoc.orderNumber}`))
          .catch(err => console.error(`❌ Bulk dispatch email failed for order #${finalOrderDoc.orderNumber}:`, err.message));
      }

      const finalOrder = finalOrderDoc ? finalOrderDoc.toObject({ virtuals: true }) : order.toObject();
      finalOrder.cartItems = updatedCartItems;

      return finalOrder;
    });

    const updatedOrders = await Promise.all(dispatchPromises);

    // Send notifications to users
    try {
      for (const updatedOrder of updatedOrders) {
        const dispatchProgress = updatedOrder.cartItems.reduce((acc, item) => {
          acc.total++;
          if (item.dispatchStatus === 'dispatched') acc.dispatched++;
          if (item.dispatchStatus === 'delivered') acc.delivered++;
          return acc;
        }, { total: 0, dispatched: 0, delivered: 0 });

        // Create more specific notification based on dispatch progress
        let notificationTitle, notificationMessage;
        
        if (dispatchProgress.dispatched === dispatchProgress.total) {
          notificationTitle = '**Complete Order Dispatched!** 🚚';
          notificationMessage = `Your complete order **#${updatedOrder.orderNumber}** is now out for delivery and will reach you soon!`;
        } else {
          notificationTitle = '**Partial Dispatch Update!** 📦';
          notificationMessage = `**${productName}** from your order **#${updatedOrder.orderNumber}** has been dispatched! (${dispatchProgress.dispatched}/${dispatchProgress.total} items dispatched)`;
        }

        // Send real-time WebSocket notification immediately (before database write for faster delivery)
        if (global.io && global.connectedUsers) {
          const userSocketId = getConnectedUserSocketId(updatedOrder.userId);
          if (userSocketId) {
            global.io.to(userSocketId).emit('orderStatusUpdate', {
              orderNumber: updatedOrder.orderNumber,
              status: updatedOrder.orderStatus,
              message: notificationMessage,
              productDispatched: productName,
              dispatchProgress: dispatchProgress,
              timestamp: new Date().toISOString()
            });
          }
        }

        // Create notification in database (non-blocking)
        createNotification(
          updatedOrder.userId,
          updatedOrder.orderNumber,
          'order_dispatched',
          notificationTitle,
          notificationMessage,
          {
            orderNumber: updatedOrder.orderNumber,
            productName: productName,
            hostel: hostel,
            deliveryLocation: updatedOrder.deliveryLocation,
            dispatchProgress: dispatchProgress
          }
        ).catch(err => console.error('Failed to create dispatch notification:', err.message));
      }
    } catch (notificationError) {
      console.error('Error sending notifications:', notificationError);
      // Don't fail the dispatch if notifications fail
    }

    res.status(200).json({
      message: 'Product dispatched successfully',
      dispatchedCount: updatedOrders.length,
      orderIds: updatedOrders.map(o => o._id),
      product: productName,
      category: category,
      hostel: hostel,
      ordersUpdated: updatedOrders.map(order => ({
        orderNumber: order.orderNumber,
        newStatus: order.orderStatus,
        dispatchProgress: order.cartItems.reduce((acc, item) => {
          acc.total++;
          if (item.dispatchStatus === 'dispatched') acc.dispatched++;
          if (item.dispatchStatus === 'delivered') acc.delivered++;
          return acc;
        }, { total: 0, dispatched: 0, delivered: 0 })
      }))
    });

  } catch (error) {
    console.error('Error in dispatchOrders:', error);
    res.status(500).json({
      message: 'Failed to dispatch orders',
      error: error.message
    });
  }
});

// @desc    Dispatch individual item from a specific order
// @route   POST /api/admin/dispatch-item
// @access  Private/Admin
export const dispatchIndividualItem = asyncHandler(async (req, res) => {
  const { orderId, productName, categoryName } = req.body;

  // Validate required fields
  if (!orderId || !productName) {
    return res.status(400).json({
      message: 'Order ID and product name are required'
    });
  }

  try {
    // Find the specific order
    const order = await Order.findById(orderId)
      .populate({
        path: 'cartItems.productId',
        populate: {
          path: 'category',
          model: 'Category'
        }
      })
      .populate('userId', '_id name email phone');

    if (!order) {
      return res.status(404).json({
        message: 'Order not found'
      });
    }

    const previousStatus = order.orderStatus;


   

    // Check if order is in a dispatchable state
    if (!['placed', 'confirmed', 'out_for_delivery'].includes(order.orderStatus)) {
      return res.status(400).json({
        message: 'Order is not in a dispatchable state'
      });
    }

    // Find the specific item to dispatch
    const itemIndex = order.cartItems.findIndex(item => {
      const itemCategoryName = item.productId && 
                             item.productId.category && 
                             item.productId.category.name ? 
                             item.productId.category.name : 'Unknown Category';
      
      return item.productName === productName && 
             (!categoryName || itemCategoryName === categoryName) &&
             (!item.dispatchStatus || item.dispatchStatus === 'pending');
    });

    if (itemIndex === -1) {
      return res.status(404).json({
        message: 'Pending item not found in order or already dispatched'
      });
    }

    // Update the specific item's dispatch status
    order.cartItems[itemIndex].dispatchStatus = 'dispatched';
    order.cartItems[itemIndex].dispatchedAt = new Date();

    // Calculate new order status
    const dispatchedItems = order.cartItems.filter(item => item.dispatchStatus === 'dispatched').length;
    const deliveredItems = order.cartItems.filter(item => item.dispatchStatus === 'delivered').length;
    const totalItems = order.cartItems.length;

    let newOrderStatus = order.orderStatus;
    if (deliveredItems === totalItems) {
      newOrderStatus = 'delivered';
    } else if (dispatchedItems > 0) {
      newOrderStatus = 'out_for_delivery';
    }

    order.orderStatus = newOrderStatus;
    order.updatedAt = new Date();

    // Save order asynchronously to avoid blocking WebSocket notification
    order.save().catch(err => console.error('Failed to save order status:', err.message));

    // Send status emails asynchronously (non-blocking) via Vercel
    console.log(`🚀 Triggering dispatch email for order #${order.orderNumber} at ${new Date().toISOString()}`);
    // Don't await - fire and forget to avoid blocking the response
    sendStatusEmails(order, previousStatus, newOrderStatus)
      .then(() => console.log(`✅ Dispatch email sent for order #${order.orderNumber} at ${new Date().toISOString()}`))
      .catch(err => console.error(`❌ Dispatch email failed for order #${order.orderNumber}:`, err.message));

    // Send notification to user
    try {
      const dispatchProgress = {
        total: totalItems,
        dispatched: dispatchedItems,
        delivered: deliveredItems
      };

      let notificationTitle, notificationMessage;
      
      if (dispatchedItems === totalItems && deliveredItems === 0) {
        notificationTitle = '**Complete Order Dispatched!** 🚚';
        notificationMessage = `Your complete order **#${order.orderNumber}** is now out for delivery!`;
      } else {
        notificationTitle = '**Item Dispatched!** 📦';
        notificationMessage = `**${productName}** from your order **#${order.orderNumber}** has been dispatched! (${dispatchedItems}/${totalItems} items dispatched)`;
      }

      // Send real-time WebSocket notification immediately (before database write for faster delivery)
      if (global.io && global.connectedUsers) {
        const userId = resolveUserIdString(order.userId);
        const userSocketId = getConnectedUserSocketId(order.userId);

        console.log(`🔔 Attempting WebSocket notification for user ${userId}`);
        console.log(`🔌 User socket ID: ${userSocketId || 'NOT CONNECTED'}`);
        console.log(`👥 Total connected users: ${global.connectedUsers.size}`);

        if (userSocketId) {
          global.io.to(userSocketId).emit('orderStatusUpdate', {
            orderNumber: order.orderNumber,
            status: newOrderStatus,
            message: notificationMessage,
            productDispatched: productName,
            dispatchProgress: dispatchProgress,
            timestamp: new Date().toISOString()
          });
          console.log(`✅ WebSocket notification sent to user ${userId}`);
        } else {
          console.log(`⚠️ User ${userId} is not connected via WebSocket`);
        }
      } else {
        console.log('⚠️ WebSocket not available: io or connectedUsers is undefined');
      }

      // Create notification in database (non-blocking)
      createNotification(
        resolveUserIdString(order.userId),
        order.orderNumber,
        'order_dispatched',
        notificationTitle,
        notificationMessage,
        {
          orderNumber: order.orderNumber,
          productName: productName,
          hostelName: order.hostelName,
          deliveryLocation: order.deliveryLocation,
          dispatchProgress: dispatchProgress
        }
      ).catch(err => console.error('Failed to create dispatch notification:', err.message));
    } catch (notificationError) {
      console.error('❌ Error sending notification:', notificationError);
    }

    res.status(200).json({
      message: 'Item dispatched successfully',
      orderNumber: order.orderNumber,
      dispatchedItem: productName,
      newOrderStatus: newOrderStatus,
      dispatchProgress: {
        total: totalItems,
        dispatched: dispatchedItems,
        delivered: deliveredItems,
        pending: totalItems - dispatchedItems - deliveredItems
      }
    });

  } catch (error) {
    console.error('Error in dispatchIndividualItem:', error);
    res.status(500).json({
      message: 'Failed to dispatch item',
      error: error.message
    });
  }
});

// @desc    Mark individual item or all dispatched items as delivered
// @route   POST /api/admin/deliver-item
// @access  Private/Admin
export const markAsDelivered = asyncHandler(async (req, res) => {
  const { orderId, productName, categoryName, deliverAll } = req.body;

  // Validate required fields
  if (!orderId) {
    return res.status(400).json({
      message: 'Order ID is required'
    });
  }

  try {
    // Find the specific order
    const order = await Order.findById(orderId)
      .populate({
        path: 'cartItems.productId',
        populate: {
          path: 'category',
          model: 'Category'
        }
      })
      .populate('userId', 'name email phone');

    if (!order) {
      return res.status(404).json({
        message: 'Order not found'
      });
    }

    // Check if order is in a deliverable state
    if (!['out_for_delivery', 'confirmed', 'placed'].includes(order.orderStatus)) {
      return res.status(400).json({
        message: 'Order is not in a deliverable state'
      });
    }

    let updatedItems = [];

    if (deliverAll === 'ALL_DISPATCHED') {
      // Mark all dispatched items as delivered
      order.cartItems.forEach((item, index) => {
        if (item.dispatchStatus === 'dispatched') {
          order.cartItems[index].dispatchStatus = 'delivered';
          order.cartItems[index].deliveredAt = new Date();
          updatedItems.push(item.productName);
        }
      });

      if (updatedItems.length === 0) {
        return res.status(400).json({
          message: 'No dispatched items found to deliver'
        });
      }

    } else {
      // Mark specific item as delivered
      if (!productName) {
        return res.status(400).json({
          message: 'Product name is required for individual item delivery'
        });
      }

      const itemIndex = order.cartItems.findIndex(item => {
        const itemCategoryName = item.productId && 
                               item.productId.category && 
                               item.productId.category.name ? 
                               item.productId.category.name : 'Unknown Category';
        
        return item.productName === productName && 
               (!categoryName || itemCategoryName === categoryName) &&
               item.dispatchStatus === 'dispatched';
      });

      if (itemIndex === -1) {
        return res.status(404).json({
          message: 'Dispatched item not found in order or not ready for delivery'
        });
      }

      // Update the specific item's delivery status
      order.cartItems[itemIndex].dispatchStatus = 'delivered';
      order.cartItems[itemIndex].deliveredAt = new Date();
      updatedItems.push(productName);
    }

    // Calculate new order status
    const dispatchedItems = order.cartItems.filter(item => item.dispatchStatus === 'dispatched').length;
    const deliveredItems = order.cartItems.filter(item => item.dispatchStatus === 'delivered').length;
    const totalItems = order.cartItems.length;

    // Store previous status before updating
    const previousStatus = order.orderStatus;
    
    let newOrderStatus = order.orderStatus;
    if (deliveredItems === totalItems) {
      newOrderStatus = 'delivered';
      order.actualDeliveryTime = new Date();
    } else if (dispatchedItems > 0) {
      newOrderStatus = 'out_for_delivery';
    }

    const shouldFinalizeCodPayment =
      newOrderStatus === 'delivered' &&
      order.paymentMethod === 'cod' &&
      order.paymentStatus !== 'paid';

    if (shouldFinalizeCodPayment) {
      order.paymentStatus = 'paid';
    }

  order.orderStatus = newOrderStatus;
    order.updatedAt = new Date();

    // Save order asynchronously to avoid blocking WebSocket notification
    order.save().catch(err => console.error('Failed to save delivery status:', err.message));

    if (shouldFinalizeCodPayment) {
      try {
        let codPaymentDoc = await Payment.findOne({ orderId: order.orderNumber });
        let codPreviousStatus = codPaymentDoc?.paymentStatus;

        if (codPaymentDoc && codPaymentDoc.paymentStatus !== 'success') {
          codPreviousStatus = codPaymentDoc.paymentStatus;
          codPaymentDoc.paymentStatus = 'success';
          codPaymentDoc.date = codPaymentDoc.date || new Date();
          await codPaymentDoc.save();
        } else if (!codPaymentDoc) {
          codPaymentDoc = await Payment.create({
            userId: order.userId,
            email: order.userDetails?.email,
            orderId: order.orderNumber,
            amount: order.amount,
            paymentMethod: 'cod',
            paymentStatus: 'success',
            date: new Date(),
            meta: { source: 'cod_delivery_auto_finalize' }
          });
          codPreviousStatus = 'pending';
        }

        emitPaymentUpdate(codPaymentDoc, {
          source: 'cod_delivery_auto_finalize',
          previousStatus: codPreviousStatus
        });
      } catch (paymentUpdateError) {
        console.error('Failed to finalize COD payment record:', paymentUpdateError);
      }
    }

    // Send notification to user
    try {
      const deliveryProgress = {
        total: totalItems,
        dispatched: dispatchedItems,
        delivered: deliveredItems
      };

      let notificationTitle, notificationMessage;
      
      if (deliveredItems === totalItems) {
        notificationTitle = '**Order Delivered!** ✅';
        notificationMessage = `Your complete order **#${order.orderNumber}** has been delivered successfully!`;
      } else if (updatedItems.length > 1) {
        notificationTitle = '**Items Delivered!** 📦✅';
        notificationMessage = `${updatedItems.length} items from your order **#${order.orderNumber}** have been delivered! (${deliveredItems}/${totalItems} items delivered)`;
      } else {
        notificationTitle = '**Item Delivered!** 📦✅';
        notificationMessage = `**${updatedItems[0]}** from your order **#${order.orderNumber}** has been delivered! (${deliveredItems}/${totalItems} items delivered)`;
      }

      // Send real-time WebSocket notification immediately (before database write for faster delivery)
      if (global.io && global.connectedUsers) {
        const userSocketId = getConnectedUserSocketId(order.userId);
        if (userSocketId) {
          global.io.to(userSocketId).emit('orderStatusUpdate', {
            orderNumber: order.orderNumber,
            status: newOrderStatus,
            message: notificationMessage,
            itemsDelivered: updatedItems,
            deliveryProgress: deliveryProgress,
            timestamp: new Date().toISOString()
          });
        }
        
        // Emit to all admin clients for instant UI update
        global.io.emit('orderStatusUpdated', {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          status: newOrderStatus,
          items: order.cartItems.map(item => ({
            ...item.toObject(),
            productId: item.productId ? {
              _id: item.productId._id,
              name: item.productId.name,
              image: item.productId.image,
              images: item.productId.images,
              category: item.productId.category
            } : item.productId
          })),
          deliveredItems: updatedItems,
          deliveryProgress: deliveryProgress,
          timestamp: new Date().toISOString()
        });
      }

      // Create notification in database (non-blocking)
      createNotification(
        resolveUserIdString(order.userId),
        order.orderNumber,
        'order_delivered',
        notificationTitle,
        notificationMessage,
        {
          orderNumber: order.orderNumber,
          deliveredItems: updatedItems,
          hostelName: order.hostelName,
          deliveryLocation: order.deliveryLocation,
          deliveryProgress: deliveryProgress
        }
      ).catch(err => console.error('Failed to create delivery notification:', err.message));
    } catch (notificationError) {
      console.error('Error sending delivery notification:', notificationError);
    }

    res.status(200).json({
      message: `Successfully marked ${updatedItems.length > 1 ? 'items' : 'item'} as delivered`,
      orderNumber: order.orderNumber,
      deliveredItems: updatedItems,
      newOrderStatus: newOrderStatus,
      paymentStatus: order.paymentStatus,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        orderStatus: newOrderStatus,
        paymentStatus: order.paymentStatus,
        items: order.cartItems.map(item => {
          const serializedItem = {
            ...item.toObject(),
            productId: item.productId ? {
              _id: item.productId._id,
              name: item.productId.name,
              image: item.productId.image,
              images: item.productId.images,
              category: item.productId.category
            } : item.productId
          };
          console.log('Serialized item:', serializedItem.productName, 'Image:', serializedItem.productId?.image || serializedItem.image);
          return serializedItem;
        })
      },
      deliveryProgress: {
        total: totalItems,
        dispatched: dispatchedItems,
        delivered: deliveredItems,
        pending: totalItems - dispatchedItems - deliveredItems
      }
    });

  } catch (error) {
    console.error('Error in markAsDelivered:', error);
    res.status(500).json({
      message: 'Failed to mark item(s) as delivered',
      error: error.message
    });
  }
});

// @desc    Get order statistics for dashboard
// @route   GET /api/admin/orders/stats
// @access  Private/Admin
export const getOrderStats = asyncHandler(async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedStats = {
      total: 0,
      placed: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
    });

    res.status(200).json(formattedStats);
  } catch (error) {
    console.error('Error in getOrderStats:', error);
    res.status(500).json({
      message: 'Failed to fetch order statistics',
      error: error.message
    });
  }
});

// @desc    Cancel order by user
// @route   PUT /api/payments/orders/:orderNumber/cancel
// @access  Private
export const cancelUserOrder = asyncHandler(async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { cancelReason } = req.body;
    const userId = req.user?._id;

    console.log('🚫 User cancelling order:', orderNumber);

    // Find the order
    const order = await Order.findOne({ orderNumber });

    if (!order) {
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

    // Check if order can be cancelled (not out for delivery or delivered)
    const canCancel = !['out_for_delivery', 'delivered', 'cancelled'].includes(order.orderStatus);
    
    if (!canCancel) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage',
        currentStatus: order.orderStatus
      });
    }

    const previousStatus = order.orderStatus;

    // Restore stock for cancelled order
    console.log('🔄 Restoring stock for cancelled order items...');
    for (const item of order.cartItems) {
      try {
        const product = await Product.findById(item.productId);
        if (!product) {
          console.warn(`Product ${item.productId} not found, skipping stock restoration`);
          continue;
        }

        // Check if product has variants
        if (product.variants && product.variants.length > 0) {
          const variantIndex = item.variantIndex || 0;
          if (product.variants[variantIndex]) {
            // Restore stock for specific variant
            const currentStock = product.variants[variantIndex].stock || 0;
            product.variants[variantIndex].stock = currentStock + item.quantity;
            console.log(`✅ Restored ${item.quantity} units to variant ${variantIndex} of ${product.name}. New stock: ${product.variants[variantIndex].stock}`);
          }
        } else {
          // Restore stock for product without variants
          const currentStock = product.stock || 0;
          product.stock = currentStock + item.quantity;
          console.log(`✅ Restored ${item.quantity} units to ${product.name}. New stock: ${product.stock}`);
        }

        await product.save();
      } catch (stockError) {
        console.error(`Error restoring stock for product ${item.productId}:`, stockError);
        // Continue with other items even if one fails
      }
    }

  // Update order status to cancelled
    order.orderStatus = 'cancelled';
    order.cancelReason = cancelReason || 'Cancelled by user';
    order.cancelledAt = new Date();
    await order.save();

    console.log('✅ Order cancelled successfully:', order.orderNumber);

    // Send response immediately to improve user experience
    const responseData = {
      success: true,
      message: 'Order cancelled successfully. Stock has been restored.',
      order: {
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        cancelReason: order.cancelReason
      }
    };

    // Emit WebSocket events to notify all admin clients immediately
    try {
      if (global.io) {
        global.io.emit('orderStatusUpdated', {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          status: 'cancelled',
          timestamp: new Date().toISOString()
        });
        // Optional: emit a dedicated event for cancellations for clients that listen to it
        global.io.emit('orderCancelled', {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          timestamp: new Date().toISOString()
        });
        console.log('📣 Emitted WebSocket events for order cancellation:', order.orderNumber);
      } else {
        console.warn('⚠️ WebSocket (io) not available - cannot emit cancellation events');
      }
    } catch (wsErr) {
      console.error('❌ Failed to emit cancellation WebSocket events:', wsErr);
    }

    // Send status update emails and notifications asynchronously (non-blocking)
    // This prevents the user from waiting for email delivery which can be slow
    setImmediate(async () => {
      try {
        await sendStatusEmails(order, previousStatus, 'cancelled');
        console.log('✅ Cancellation emails sent successfully');
      } catch (emailError) {
        console.error('⚠️ Failed to send cancellation emails (non-critical):', emailError.message);
      }

      // Create notification for user
      try {
        await createNotification(
          order.userId,
          order.orderNumber,
          'order_cancelled',
          'Order Cancelled',
          `Your order #${order.orderNumber} has been cancelled${cancelReason ? ': ' + cancelReason : ''}`,
          {
            cancelReason: cancelReason || 'No reason provided',
            cancelledAt: new Date(),
            previousStatus: previousStatus
          }
        );
        console.log('✅ User notification created for order cancellation');
      } catch (notificationError) {
        console.error('⚠️ Failed to create user cancellation notification (non-critical):', notificationError);
      }
    });

    res.status(200).json(responseData);

  } catch (error) {
    console.error('Error in cancelUserOrder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    });
  }
});
