import express from 'express';
import {
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
} from '../controllers/analyticsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All analytics routes require admin authentication
router.use(protect, admin);

// Dashboard overview
router.get('/overview', getDashboardOverview);

// Orders trend over time
router.get('/orders-trend', getOrdersTrend);

// Orders by location/hostel
router.get('/orders-by-location', getOrdersByLocation);

// Top products
router.get('/top-products', getTopProducts);

// Category performance
router.get('/category-performance', getCategoryPerformance);

// Payment method breakdown
router.get('/payment-methods', getPaymentMethodBreakdown);

// Recent orders
router.get('/recent-orders', getRecentOrders);

// Hostel performance
router.get('/hostel-performance', getHostelPerformance);

// Test data
router.get('/test-data', testCategoriesAndProducts);

// Test hostel mapping (temporary - no auth for testing)
router.get('/test-hostels-simple', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const Hostel = mongoose.model('Hostel');
    const Order = mongoose.model('Order');
    
    const hostels = await Hostel.find({}).limit(10);
    const uniqueDeliveryLocations = await Order.distinct('deliveryLocation');
    
    res.json({
      success: true,
      data: {
        hostelsCount: hostels.length,
        hostels: hostels.map(h => ({ name: h.name, address: h.address })),
        deliveryLocationsCount: uniqueDeliveryLocations.length,
        deliveryLocations: uniqueDeliveryLocations.slice(0, 10)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test hostel mapping
router.get('/test-hostels', testHostelMapping);

export default router;