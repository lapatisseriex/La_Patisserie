import express from 'express';
import { 
  getInventoryOverview,
  getLowStockProducts,
  bulkUpdateStock,
  getStockActivity,
  updateStockAlerts,
  generateInventoryReport
} from '../controllers/stockValidationController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are admin only
router.use(protect, admin);

// Inventory management routes
router.get('/inventory/overview', getInventoryOverview);
router.get('/inventory/low-stock', getLowStockProducts);
router.get('/inventory/activity', getStockActivity);
router.get('/inventory/report', generateInventoryReport);

// Stock update routes
router.put('/inventory/bulk-update', bulkUpdateStock);
router.put('/inventory/alerts', updateStockAlerts);

export default router;