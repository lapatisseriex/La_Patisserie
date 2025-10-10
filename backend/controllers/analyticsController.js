import { asyncHandler } from '../utils/asyncHandler.js';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import Category from '../models/categoryModel.js';
import Hostel from '../models/hostelModel.js';
import Location from '../models/locationModel.js';
import DeliveryLocationMapping from '../models/deliveryLocationMappingModel.js';
import mongoose from 'mongoose';

// @desc    Get dashboard overview statistics
// @route   GET /api/analytics/overview
// @access  Private/Admin
const getDashboardOverview = asyncHandler(async (req, res) => {
  const { period = '30' } = req.query; // Default to last 30 days
  const daysAgo = parseInt(period);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysAgo);

  // Get total orders and revenue
  const totalOrders = await Order.countDocuments({
    createdAt: { $gte: startDate }
  });

  const revenueData = await Order.aggregate([
    {
      $match: {
        paymentStatus: 'paid',
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        averageOrderValue: { $avg: '$amount' }
      }
    }
  ]);

  // Get delivery location mappings for top hostel calculation
  const deliveryMappings = await DeliveryLocationMapping.find({ isActive: true });
  const mappingMap = new Map();
  deliveryMappings.forEach(mapping => {
    mappingMap.set(mapping.deliveryLocation, mapping.hostelName);
  });

  // Get top hostel by orders using proper mapping
  const topHostelData = await Order.aggregate([
    {
      $match: { createdAt: { $gte: startDate } }
    },
    {
      $group: {
        _id: '$deliveryLocation',
        orderCount: { $sum: 1 },
        revenue: { $sum: '$amount' }
      }
    }
  ]);

  // Map delivery locations to hostel names and group by hostel
  const hostelGroups = {};
  topHostelData.forEach(item => {
    const hostelName = mappingMap.get(item._id) || item._id;
    if (hostelGroups[hostelName]) {
      hostelGroups[hostelName].orderCount += item.orderCount;
      hostelGroups[hostelName].revenue += item.revenue;
    } else {
      hostelGroups[hostelName] = {
        _id: hostelName,
        orderCount: item.orderCount,
        revenue: item.revenue
      };
    }
  });

  // Get top hostel
  const topHostel = Object.values(hostelGroups)
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 1);

  console.log('Top hostel data (with proper mapping):', JSON.stringify(topHostel, null, 2));

  // Get top product
  const topProduct = await Order.aggregate([
    {
      $match: { createdAt: { $gte: startDate } }
    },
    {
      $unwind: '$cartItems'
    },
    {
      $group: {
        _id: {
          productId: '$cartItems.productId',
          productName: '$cartItems.productName'
        },
        totalQuantity: { $sum: '$cartItems.quantity' },
        totalRevenue: { $sum: { $multiply: ['$cartItems.quantity', '$cartItems.price'] } }
      }
    },
    {
      $sort: { totalQuantity: -1 }
    },
    {
      $limit: 1
    }
  ]);

  // Get most popular category
  const topCategory = await Order.aggregate([
    {
      $match: { createdAt: { $gte: startDate } }
    },
    {
      $unwind: '$cartItems'
    },
    {
      $lookup: {
        from: 'products',
        localField: 'cartItems.productId',
        foreignField: '_id',
        as: 'product'
      }
    },
    {
      $unwind: '$product'
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'product.categoryId',
        foreignField: '_id',
        as: 'category'
      }
    },
    {
      $unwind: '$category'
    },
    {
      $group: {
        _id: {
          categoryId: '$category._id',
          categoryName: '$category.name'
        },
        orderCount: { $sum: 1 }
      }
    },
    {
      $sort: { orderCount: -1 }
    },
    {
      $limit: 1
    }
  ]);

  // Get payment success rate
  const paymentStats = await Order.aggregate([
    {
      $match: { createdAt: { $gte: startDate } }
    },
    {
      $group: {
        _id: '$paymentStatus',
        count: { $sum: 1 }
      }
    }
  ]);

  const totalPaymentAttempts = paymentStats.reduce((sum, stat) => sum + stat.count, 0);
  const successfulPayments = paymentStats.find(stat => stat._id === 'paid')?.count || 0;
  const paymentSuccessRate = totalPaymentAttempts > 0 ? (successfulPayments / totalPaymentAttempts) * 100 : 0;

  res.json({
    success: true,
    data: {
      totalOrders,
      totalRevenue: revenueData[0]?.totalRevenue || 0,
      averageOrderValue: revenueData[0]?.averageOrderValue || 0,
      topHostel: topHostel[0] || { _id: 'N/A', orderCount: 0 },
      topProduct: topProduct[0] || { _id: { productName: 'N/A' }, totalQuantity: 0 },
      topCategory: topCategory[0] || { _id: { categoryName: 'N/A' }, orderCount: 0 },
      paymentSuccessRate: Math.round(paymentSuccessRate * 100) / 100,
      period: daysAgo
    }
  });
});

// @desc    Get orders trend over time
// @route   GET /api/analytics/orders-trend
// @access  Private/Admin
const getOrdersTrend = asyncHandler(async (req, res) => {
  const { period = 'week', days = '30' } = req.query;
  const daysAgo = parseInt(days);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysAgo);

  let groupBy;
  let dateFormat;

  switch (period) {
    case 'day':
      groupBy = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      };
      dateFormat = '%Y-%m-%d';
      break;
    case 'week':
      groupBy = {
        year: { $year: '$createdAt' },
        week: { $week: '$createdAt' }
      };
      dateFormat = '%Y-W%U';
      break;
    case 'month':
      groupBy = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      };
      dateFormat = '%Y-%m';
      break;
    default:
      groupBy = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      };
      dateFormat = '%Y-%m-%d';
  }

  const trendData = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: groupBy,
        orderCount: { $sum: 1 },
        revenue: {
          $sum: {
            $cond: [
              { $eq: ['$paymentStatus', 'paid'] },
              '$amount',
              0
            ]
          }
        },
        date: { $first: '$createdAt' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 }
    }
  ]);

  res.json({
    success: true,
    data: trendData.map(item => ({
      date: item.date,
      orders: item.orderCount,
      revenue: item.revenue,
      period: period
    }))
  });
});

// @desc    Get orders by hostel/location
// @route   GET /api/analytics/orders-by-location
// @access  Private/Admin
const getOrdersByLocation = asyncHandler(async (req, res) => {
  const { days = '30' } = req.query;
  const daysAgo = parseInt(days);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysAgo);

  // Get delivery location mappings
  const deliveryMappings = await DeliveryLocationMapping.find({ isActive: true });
  const mappingMap = new Map();
  
  // Create a lookup map for fast access
  deliveryMappings.forEach(mapping => {
    mappingMap.set(mapping.deliveryLocation, mapping.hostelName);
  });
  
  // Function to get hostel name from delivery location using mapping table
  const getHostelName = (deliveryLocation) => {
    return mappingMap.get(deliveryLocation) || deliveryLocation;
  };

  const locationData = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$deliveryLocation',
        orderCount: { $sum: 1 },
        totalRevenue: {
          $sum: {
            $cond: [
              { $eq: ['$paymentStatus', 'paid'] },
              '$amount',
              0
            ]
          }
        },
        averageOrderValue: { $avg: '$amount' }
      }
    }
  ]);

  // Map delivery locations to hostel names using mapping table
  const mappedLocationData = locationData.map(item => {
    const hostelName = getHostelName(item._id);
    return {
      _id: hostelName,
      orderCount: item.orderCount,
      totalRevenue: item.totalRevenue,
      averageOrderValue: item.averageOrderValue,
      originalLocation: item._id
    };
  });

  // Group by hostel name (in case multiple delivery locations map to the same hostel)
  const groupedByHostel = {};
  mappedLocationData.forEach(item => {
    if (groupedByHostel[item._id]) {
      groupedByHostel[item._id].orderCount += item.orderCount;
      groupedByHostel[item._id].totalRevenue += item.totalRevenue;
      groupedByHostel[item._id].averageOrderValue = 
        (groupedByHostel[item._id].averageOrderValue + item.averageOrderValue) / 2;
    } else {
      groupedByHostel[item._id] = item;
    }
  });

  const finalLocationData = Object.values(groupedByHostel)
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 20);

  console.log('Hostel analytics data (with names):', JSON.stringify(locationData, null, 2));

  res.json({
    success: true,
    data: locationData
  });
});

// @desc    Get top products
// @route   GET /api/analytics/top-products
// @access  Private/Admin
const getTopProducts = asyncHandler(async (req, res) => {
  const { days = '30', limit = 10 } = req.query;
  const daysAgo = parseInt(days);
  const limitNum = parseInt(limit);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysAgo);

  const topProducts = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $unwind: '$cartItems'
    },
    {
      $group: {
        _id: {
          productId: '$cartItems.productId',
          productName: '$cartItems.productName'
        },
        totalQuantity: { $sum: '$cartItems.quantity' },
        totalRevenue: { $sum: { $multiply: ['$cartItems.quantity', '$cartItems.price'] } },
        orderCount: { $sum: 1 }
      }
    },
    {
      $sort: { totalQuantity: -1 }
    },
    {
      $limit: limitNum
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id.productId',
        foreignField: '_id',
        as: 'productDetails'
      }
    }
  ]);

  res.json({
    success: true,
    data: topProducts
  });
});

// @desc    Get category performance
// @route   GET /api/analytics/category-performance
// @access  Private/Admin
const getCategoryPerformance = asyncHandler(async (req, res) => {
  const { days = '30' } = req.query;
  const daysAgo = parseInt(days);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysAgo);

  const categoryData = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $unwind: '$cartItems'
    },
    {
      $lookup: {
        from: 'products',
        localField: 'cartItems.productId',
        foreignField: '_id',
        as: 'product'
      }
    },
    {
      $unwind: '$product'
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'product.category',
        foreignField: '_id',
        as: 'category'
      }
    },
    {
      $unwind: '$category'
    },
    {
      $group: {
        _id: {
          categoryId: '$category._id',
          categoryName: '$category.name'
        },
        totalOrders: { $sum: 1 },
        totalQuantity: { $sum: '$cartItems.quantity' },
        totalRevenue: { $sum: { $multiply: ['$cartItems.quantity', '$cartItems.price'] } }
      }
    },
    {
      $sort: { totalRevenue: -1 }
    }
  ]);

  console.log('Category performance data:', JSON.stringify(categoryData, null, 2));

  res.json({
    success: true,
    data: categoryData
  });
});

// @desc    Test hostel data mapping
// @route   GET /api/analytics/test-hostels
// @access  Private/Admin
const testHostelMapping = asyncHandler(async (req, res) => {
  const Hostel = mongoose.model('Hostel');
  
  const hostels = await Hostel.find({}).limit(10);
  const orders = await Order.find({}).limit(10);
  const uniqueDeliveryLocations = await Order.distinct('deliveryLocation');

  console.log('Test data - Hostels:', hostels.length);
  console.log('Test data - Orders:', orders.length);
  console.log('Test data - Unique delivery locations:', uniqueDeliveryLocations.length);
  console.log('Delivery locations:', uniqueDeliveryLocations);
  console.log('Hostel addresses:', hostels.map(h => h.address));
  console.log('Hostel names:', hostels.map(h => h.name));

  res.json({
    success: true,
    data: {
      hostelsCount: hostels.length,
      hostels: hostels,
      ordersCount: orders.length,
      uniqueDeliveryLocations: uniqueDeliveryLocations,
      hostelAddresses: hostels.map(h => h.address),
      hostelNames: hostels.map(h => h.name)
    }
  });
});

// @desc    Test categories and products data
// @route   GET /api/analytics/test-data
// @access  Private/Admin
const testCategoriesAndProducts = asyncHandler(async (req, res) => {
  const Category = mongoose.model('Category');
  const Product = mongoose.model('Product');
  
  const categories = await Category.find({}).limit(5);
  const products = await Product.find({}).populate('category').limit(5);
  const orders = await Order.find({}).limit(3).populate({
    path: 'cartItems.productId',
    populate: {
      path: 'category'
    }
  });

  console.log('Test data - Categories:', categories.length);
  console.log('Test data - Products:', products.length);
  console.log('Test data - Orders:', orders.length);

  res.json({
    success: true,
    data: {
      categoriesCount: categories.length,
      categories: categories,
      productsCount: products.length,
      products: products,
      ordersCount: orders.length,
      orders: orders
    }
  });
});

// @desc    Get payment method breakdown
// @route   GET /api/analytics/payment-methods
// @access  Private/Admin
const getPaymentMethodBreakdown = asyncHandler(async (req, res) => {
  const { days = '30' } = req.query;
  const daysAgo = parseInt(days);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysAgo);

  const paymentData = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$paymentMethod',
        totalOrders: { $sum: 1 },
        totalRevenue: {
          $sum: {
            $cond: [
              { $eq: ['$paymentStatus', 'paid'] },
              '$amount',
              0
            ]
          }
        },
        successfulOrders: {
          $sum: {
            $cond: [
              { $eq: ['$paymentStatus', 'paid'] },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $addFields: {
        successRate: {
          $multiply: [
            { $divide: ['$successfulOrders', '$totalOrders'] },
            100
          ]
        }
      }
    }
  ]);

  res.json({
    success: true,
    data: paymentData
  });
});

// @desc    Get recent orders
// @route   GET /api/analytics/recent-orders
// @access  Private/Admin
const getRecentOrders = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const limitNum = parseInt(limit);

  const recentOrders = await Order.find()
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .limit(limitNum)
    .select('orderNumber userId amount paymentStatus orderStatus deliveryLocation createdAt cartItems');

  res.json({
    success: true,
    data: recentOrders
  });
});

// @desc    Get hostel performance analytics
// @route   GET /api/analytics/hostel-performance
// @access  Private/Admin
const getHostelPerformance = asyncHandler(async (req, res) => {
  const { days = '30' } = req.query;
  const daysAgo = parseInt(days);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysAgo);

  const hostelData = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$deliveryLocation',
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$amount' },
        averageOrderValue: { $avg: '$amount' },
        completedOrders: {
          $sum: {
            $cond: [{ $eq: ['$orderStatus', 'delivered'] }, 1, 0]
          }
        },
        pendingOrders: {
          $sum: {
            $cond: [{ $in: ['$orderStatus', ['pending', 'confirmed', 'preparing']] }, 1, 0]
          }
        }
      }
    },
    {
      $addFields: {
        completionRate: {
          $multiply: [
            { $divide: ['$completedOrders', '$totalOrders'] },
            100
          ]
        }
      }
    },
    {
      $sort: { totalRevenue: -1 }
    },
    {
      $limit: 20
    }
  ]);

  console.log('Hostel performance data:', JSON.stringify(hostelData, null, 2));

  res.json({
    success: true,
    data: hostelData
  });
});

export {
  getDashboardOverview,
  getOrdersTrend,
  getOrdersByLocation,
  getTopProducts,
  getCategoryPerformance,
  getPaymentMethodBreakdown,
  getRecentOrders,
  testCategoriesAndProducts,
  testHostelMapping,
  getHostelPerformance
};