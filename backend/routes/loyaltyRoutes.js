import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getLoyaltyStatus,
  getAvailableFreeProducts,
  validateFreeProduct,
  markFreeProductClaimed,
  updateLoyaltyAfterOrder,
  getLoyaltyHistory,
} from '../controllers/loyaltyController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get loyalty status
router.get('/status', getLoyaltyStatus);

// Get available free products
router.get('/free-products', getAvailableFreeProducts);

// Validate free product selection
router.post('/validate-free-product', validateFreeProduct);

// Mark free product as claimed (internal use after order)
router.post('/claim-free-product', markFreeProductClaimed);

// Update loyalty after order (internal use)
router.post('/update-after-order', updateLoyaltyAfterOrder);

// Get loyalty history
router.get('/history', getLoyaltyHistory);

export default router;
