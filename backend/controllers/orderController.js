import { asyncHandler } from '../utils/asyncHandler.js';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import DeliveryLocationMapping from '../models/deliveryLocationMappingModel.js';
import { createNotification } from './notificationController.js';

// @desc    Get grouped pending orders for order tracking
// @route   GET /api/admin/orders/grouped
// @access  Private/Admin
export const getGroupedPendingOrders = asyncHandler(async (req, res) => {
  try {
    // Only get orders with 'placed' status
    const orders = await Order.find({
      orderStatus: 'placed'
    }).populate({
      path: 'cartItems.productId',
      populate: {
        path: 'category',
        model: 'Category'
      }
    }).lean();
    
    if (orders.length === 0) {
      return res.status(200).json([]);
    }
    
    // Manually group the orders
    const hostelGroups = {};
    
    orders.forEach(order => {
      const hostelName = order.hostelName || 'Unknown Hostel';
      
      // Initialize hostel group if not exists
      if (!hostelGroups[hostelName]) {
        hostelGroups[hostelName] = {
          hostel: hostelName,
          deliveryLocations: [], // Store all delivery locations
          categories: {},
          totalOrders: 0
        };
      }
      
      // Add delivery location to the list if not already present
      const location = order.deliveryLocation?.trim();
      if (location && location !== '' && !hostelGroups[hostelName].deliveryLocations.includes(location)) {
        hostelGroups[hostelName].deliveryLocations.push(location);
      }
      
      // Process each cart item
      order.cartItems.forEach(item => {
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
        
        // Add to counts - all orders here are 'placed' status
        hostelGroups[hostelName].categories[categoryName].products[productName].orderCount += 1;
        hostelGroups[hostelName].categories[categoryName].products[productName].totalQuantity += item.quantity;
        hostelGroups[hostelName].categories[categoryName].products[productName].orderIds.push(order._id);
        
        hostelGroups[hostelName].categories[categoryName].totalOrders += 1;
        hostelGroups[hostelName].totalOrders += 1;
      });
    });
    
    // Convert to array format expected by frontend
    const result = Object.values(hostelGroups).map(hostelGroup => ({
      hostel: hostelGroup.hostel,
      deliveryLocation: hostelGroup.deliveryLocations.length > 0 
        ? hostelGroup.deliveryLocations[0]
        : 'Unknown Location',
      totalOrders: hostelGroup.totalOrders,
      categories: Object.values(hostelGroup.categories).map(categoryGroup => ({
        category: categoryGroup.category,
        totalOrders: categoryGroup.totalOrders,
        products: Object.values(categoryGroup.products)
      }))
    }));

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
    // Find orders that match the criteria and are specifically in 'placed' status
    const pendingOrders = await Order.find({
      hostelName: hostel,
      orderStatus: 'placed',
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
        message: 'No orders with "placed" status found for the specified criteria'
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

    // Extract order IDs to update
    const orderIdsToDispatch = ordersToDispatch.map(order => order._id);

    // Update the orders to 'out_for_delivery' status
    const updateResult = await Order.updateMany(
      { _id: { $in: orderIdsToDispatch } },
      { 
        $set: { 
          orderStatus: 'out_for_delivery',
          updatedAt: new Date()
        }
      }
    );

    // Send notifications to users
    try {
      for (const order of ordersToDispatch) {
        // Create notification in database
        await createNotification(
          order.userId,
          order.orderNumber,
          'order_dispatched',
          '**Order Dispatched!** 🚚',
          `Your order **#${order.orderNumber}** is now out for delivery and will reach you soon!`,
          {
            orderNumber: order.orderNumber,
            productName: productName,
            hostel: hostel,
            deliveryLocation: order.deliveryLocation
          }
        );

        // Send real-time notification via WebSocket
        if (global.io && global.connectedUsers) {
          const userSocketId = global.connectedUsers.get(order.userId.toString());
          if (userSocketId) {
            global.io.to(userSocketId).emit('orderStatusUpdate', {
              orderNumber: order.orderNumber,
              status: 'out_for_delivery',
              message: `Your order **#${order.orderNumber}** is now out for delivery!`,
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
      message: 'Orders dispatched successfully',
      dispatchedCount: orderIdsToDispatch.length,
      orderIds: orderIdsToDispatch,
      product: productName,
      category: category,
      hostel: hostel
    });

  } catch (error) {
    console.error('Error in dispatchOrders:', error);
    res.status(500).json({
      message: 'Failed to dispatch orders',
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