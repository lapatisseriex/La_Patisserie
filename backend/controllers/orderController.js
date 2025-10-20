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
        await sendOrderStatusNotification(normalizedOrder, newStatus, userEmail);
      } catch (userEmailError) {
        console.error('Failed to send user status email:', userEmailError.message);
      }
    }

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

      await Order.findByIdAndUpdate(order._id, {
        cartItems: updatedCartItems,
        updatedAt: new Date()
      });

      const statusProbe = await Order.findById(order._id);
      const calculatedStatus = statusProbe.calculateOrderStatus();
      let newOrderStatus = calculatedStatus;

      if (calculatedStatus !== statusProbe.orderStatus) {
        await Order.findByIdAndUpdate(order._id, {
          orderStatus: calculatedStatus
        });
      }

      const finalOrderDoc = await Order.findById(order._id)
        .populate('userId', 'name email phone');

      if (finalOrderDoc) {
        finalOrderDoc.cartItems = updatedCartItems;
        await sendStatusEmails(finalOrderDoc, previousStatus, newOrderStatus);
      }

      const finalOrder = finalOrderDoc ? finalOrderDoc.toObject({ virtuals: true }) : order.toObject();
      finalOrder.cartItems = updatedCartItems;
      finalOrder.orderStatus = newOrderStatus;

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

        await createNotification(
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
        );

        // Send real-time notification via WebSocket
        if (global.io && global.connectedUsers) {
          const userSocketId = global.connectedUsers.get(updatedOrder.userId.toString());
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
      .populate('userId', 'name email phone');

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

    await order.save();

    await sendStatusEmails(order, previousStatus, newOrderStatus);

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

      await createNotification(
        order.userId._id,
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
      );

      // Send real-time notification via WebSocket
      if (global.io && global.connectedUsers) {
        const userSocketId = global.connectedUsers.get(order.userId._id.toString());
        if (userSocketId) {
          global.io.to(userSocketId).emit('orderStatusUpdate', {
            orderNumber: order.orderNumber,
            status: newOrderStatus,
            message: notificationMessage,
            productDispatched: productName,
            dispatchProgress: dispatchProgress,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
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

    await order.save();

  await sendStatusEmails(order, previousStatus, newOrderStatus);

    if (shouldFinalizeCodPayment) {
      try {
        const paymentRecord = await Payment.findOne({ orderId: order.orderNumber });
        if (paymentRecord && paymentRecord.paymentStatus !== 'success') {
          paymentRecord.paymentStatus = 'success';
          paymentRecord.date = paymentRecord.date || new Date();
          await paymentRecord.save();
        } else if (!paymentRecord) {
          await Payment.create({
            userId: order.userId,
            email: order.userDetails?.email,
            orderId: order.orderNumber,
            amount: order.amount,
            paymentMethod: 'cod',
            paymentStatus: 'success',
            date: new Date(),
            meta: { source: 'cod_delivery_auto_finalize' }
          });
        }
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

      await createNotification(
        order.userId._id,
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
      );

      // Send real-time notification via WebSocket
      if (global.io && global.connectedUsers) {
        const userSocketId = global.connectedUsers.get(order.userId._id.toString());
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
      }
    } catch (notificationError) {
      console.error('Error sending delivery notification:', notificationError);
    }

    res.status(200).json({
      message: `Successfully marked ${updatedItems.length > 1 ? 'items' : 'item'} as delivered`,
      orderNumber: order.orderNumber,
      deliveredItems: updatedItems,
      newOrderStatus: newOrderStatus,
      paymentStatus: order.paymentStatus,
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