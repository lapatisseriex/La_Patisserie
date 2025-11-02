import express from 'express';
import {
  checkFreeProductEligibility,
  selectFreeProduct,
  addFreeProductToCart,
  removeFreeProductFromCart,
  getFreeProductProgress
} from '../controllers/freeProductController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Check eligibility
router.get('/check-eligibility', checkFreeProductEligibility);

// Get progress
router.get('/progress', getFreeProductProgress);

// Select free product
router.post('/select', selectFreeProduct);

// Add free product to cart
router.post('/add-to-cart', addFreeProductToCart);

// Remove free product from cart
router.delete('/remove-from-cart', removeFreeProductFromCart);

export default router;
