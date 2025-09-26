import Cart from '../models/cartModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
export const getCart = asyncHandler(async (req, res) => {
  try {
    const cartSummary = await Cart.getCartSummary(req.user.uid);
    
    res.status(200).json({
      success: true,
      data: cartSummary
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart',
      error: error.message
    });
  }
});

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
export const addToCart = asyncHandler(async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    const cart = await Cart.addOrUpdateItem(req.user.uid, productId, quantity);
    
    // Get updated cart summary
    const cartSummary = await Cart.getCartSummary(req.user.uid);
    
    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      data: {
        cart: cartSummary
      }
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    
    if (error.message.includes('Product not found') || 
        error.message.includes('not available') ||
        error.message.includes('Insufficient stock')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.code === 11000) {
      // Duplicate key error - item already exists
      return res.status(400).json({
        success: false,
        message: 'Item already in cart'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart',
      error: error.message
    });
  }
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/:itemId
// @access  Private
export const updateCartItem = asyncHandler(async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    
    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: 'Item ID is required'
      });
    }

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    await Cart.updateItemQuantity(req.user.uid, itemId, quantity);
    
    // Get updated cart summary
    const cartSummary = await Cart.getCartSummary(req.user.uid);
    
    res.status(200).json({
      success: true,
      message: 'Cart item updated successfully',
      data: {
        cart: cartSummary
      }
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    
    if (error.message.includes('not found') || 
        error.message.includes('Insufficient stock') ||
        error.message.includes('greater than 0')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update cart item',
      error: error.message
    });
  }
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
export const removeFromCart = asyncHandler(async (req, res) => {
  try {
    const { itemId } = req.params;
    
    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: 'Item ID is required'
      });
    }

    await Cart.removeItem(req.user.uid, itemId);
    
    // Get updated cart summary
    const cartSummary = await Cart.getCartSummary(req.user.uid);
    
    res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully',
      data: cartSummary
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart',
      error: error.message
    });
  }
});

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
export const clearCart = asyncHandler(async (req, res) => {
  try {
    await Cart.clearUserCart(req.user.uid);
    
    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        items: [],
        itemCount: 0,
        totalQuantity: 0,
        subtotal: 0
      }
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
      error: error.message
    });
  }
});

// @desc    Get cart item count
// @route   GET /api/cart/count
// @access  Private
export const getCartCount = asyncHandler(async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.uid });
    const totalQuantity = cart ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
    const itemCount = cart ? cart.items.length : 0;
    
    res.status(200).json({
      success: true,
      data: {
        count: itemCount,
        totalQuantity
      }
    });
  } catch (error) {
    console.error('Get cart count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cart count',
      error: error.message
    });
  }
});