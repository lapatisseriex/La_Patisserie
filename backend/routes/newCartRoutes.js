import express from 'express';
import {
  getNewCart,
  addToNewCart,
  updateNewCartItem,
  removeFromNewCart,
  clearNewCart,
  getNewCartCount
} from '../controllers/newCartController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All cart routes require authentication
router.use(protect);

// @route   GET /api/newcart
// @desc    Get user's cart with complete product details
// @access  Private
router.get('/', getNewCart);

// @route   GET /api/newcart/count
// @desc    Get cart item count
// @access  Private
router.get('/count', getNewCartCount);

// @route   POST /api/newcart
// @desc    Add item to cart with complete product information
// @access  Private
router.post('/', addToNewCart);

// @route   PUT /api/newcart/:productId
// @desc    Update cart item quantity
// @access  Private
router.put('/:productId', updateNewCartItem);

// @route   DELETE /api/newcart/:productId
// @desc    Remove item from cart
// @access  Private
router.delete('/:productId', removeFromNewCart);

// @route   DELETE /api/newcart
// @desc    Clear entire cart
// @access  Private
router.delete('/', clearNewCart);

export default router;