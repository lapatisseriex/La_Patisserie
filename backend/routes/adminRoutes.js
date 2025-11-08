import express from 'express';
import { getUsers, getUserDetailsForAdmin } from '../controllers/userController.js';
import { getUserFavoritesForAdmin } from '../controllers/favoriteController.js';
import { getUserLoyaltyForAdmin } from '../controllers/loyaltyController.js';
import { getContactsByUser } from '../controllers/contactController.js';
import { getNewsletterStatusByEmail } from '../controllers/newsletterController.js';
import Order from '../models/orderModel.js';
import { 
  getAllLocations, 
  createLocation, 
  updateLocation, 
  toggleLocationStatus,
  deleteLocation
} from '../controllers/locationController.js';
import {
  getGroupedPendingOrders,
  getIndividualPendingOrders,
  dispatchOrders,
  dispatchIndividualItem,
  markAsDelivered,
  getOrderStats
} from '../controllers/orderController.js';
import {
  getFreeProductClaims,
  getFreeProductClaimsStats,
  getUserClaimHistory,
  resetMonthlyRewards,
  getAllUsersRewardStatus
} from '../controllers/freeProductAdminController.js';
import { migrateOrderHostelIds } from '../utils/migrateOrderHostelIds.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin user routes
router.get('/users', protect, admin, getUsers);
router.get('/users/:userId/details', protect, admin, getUserDetailsForAdmin);

// Admin location routes
router.get('/locations', protect, admin, getAllLocations);
router.post('/locations', protect, admin, createLocation);
router.put('/locations/:id', protect, admin, updateLocation);
router.patch('/locations/:id/toggle', protect, admin, toggleLocationStatus);
router.delete('/locations/:id', protect, admin, deleteLocation);

// Admin order tracking routes
router.get('/orders/grouped', protect, admin, getGroupedPendingOrders);
router.get('/orders/individual', protect, admin, getIndividualPendingOrders);
router.get('/orders/stats', protect, admin, getOrderStats);
router.post('/dispatch', protect, admin, dispatchOrders);
router.post('/dispatch-item', protect, admin, dispatchIndividualItem);
router.post('/deliver-item', protect, admin, markAsDelivered);

// Admin free product claims routes
router.get('/free-product-claims', protect, admin, getFreeProductClaims);
router.get('/free-product-claims/all-users', protect, admin, getAllUsersRewardStatus);
router.get('/free-product-claims/stats', protect, admin, getFreeProductClaimsStats);
router.get('/free-product-claims/user/:userId', protect, admin, getUserClaimHistory);

// Admin monthly cleanup routes
router.post('/free-product-claims/reset-monthly', protect, admin, resetMonthlyRewards);
router.post('/cleanup/run-manual', protect, admin, async (req, res) => {
  try {
    const { runManualCleanup } = await import('../utils/monthlyCleanupJob.js');
    const result = await runManualCleanup();
    res.json({
      success: true,
      message: 'Manual cleanup completed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error running manual cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run manual cleanup',
      error: error.message
    });
  }
});

router.get('/cleanup/status', protect, admin, async (req, res) => {
  try {
    const { getCleanupStatus } = await import('../utils/monthlyCleanupJob.js');
    const status = getCleanupStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting cleanup status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cleanup status',
      error: error.message
    });
  }
});

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

// User favorites
router.get('/users/:userId/favorites', protect, admin, getUserFavoritesForAdmin);

// User loyalty status
router.get('/users/:userId/loyalty', protect, admin, getUserLoyaltyForAdmin);

// User contacts
router.get('/contacts/user/:email', protect, admin, getContactsByUser);

// User newsletter status  
router.get('/newsletter/status/:email', protect, admin, getNewsletterStatusByEmail);

export default router;
