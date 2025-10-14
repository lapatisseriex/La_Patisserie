import express from 'express';
import { getUsers } from '../controllers/userController.js';
import Order from '../models/orderModel.js';
import { 
  getAllLocations, 
  createLocation, 
  updateLocation, 
  toggleLocationStatus 
} from '../controllers/locationController.js';
import {
  getGroupedPendingOrders,
  getIndividualPendingOrders,
  dispatchOrders,
  dispatchIndividualItem,
  markAsDelivered,
  getOrderStats
} from '../controllers/orderController.js';
import { migrateOrderHostelIds } from '../utils/migrateOrderHostelIds.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin user routes
router.get('/users', protect, admin, getUsers);

// Admin location routes
router.get('/locations', protect, admin, getAllLocations);
router.post('/locations', protect, admin, createLocation);
router.put('/locations/:id', protect, admin, updateLocation);
router.patch('/locations/:id/toggle', protect, admin, toggleLocationStatus);

// Admin order tracking routes
router.get('/orders/grouped', protect, admin, getGroupedPendingOrders);
router.get('/orders/individual', protect, admin, getIndividualPendingOrders);
router.get('/orders/stats', protect, admin, getOrderStats);
router.post('/dispatch', protect, admin, dispatchOrders);
router.post('/dispatch-item', protect, admin, dispatchIndividualItem);
router.post('/deliver-item', protect, admin, markAsDelivered);

// Migration route for hostel IDs
router.post('/orders/migrate-hostel-ids', protect, admin, async (req, res) => {
  try {
    const result = await migrateOrderHostelIds();
    res.json({
      success: true,
      message: 'Migration completed successfully',
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message
    });
  }
});

// Analysis route for hostel data
router.get('/orders/analyze-hostel-data', protect, admin, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const ordersWithHostelName = await Order.countDocuments({
      hostelName: { $exists: true, $ne: null, $ne: '' }
    });
    const ordersWithHostelId = await Order.countDocuments({
      hostelId: { $exists: true, $ne: null }
    });
    const ordersWithBoth = await Order.countDocuments({
      $and: [
        { hostelName: { $exists: true, $ne: null, $ne: '' } },
        { hostelId: { $exists: true, $ne: null } }
      ]
    });
    
    res.json({
      success: true,
      analysis: {
        totalOrders,
        ordersWithHostelName,
        ordersWithHostelId,
        ordersWithBoth,
        ordersNeedingMigration: ordersWithHostelName - ordersWithBoth
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Analysis failed',
      error: error.message
    });
  }
});

export default router;
