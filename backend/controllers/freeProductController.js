import { asyncHandler } from '../utils/asyncHandler.js';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import NewCart from '../models/newCartModel.js';
import { checkEligibility } from '../middleware/freeProductMiddleware.js';

/**
 * @desc    Check if user is eligible for free product
 * @route   GET /api/free-product/check-eligibility
 * @access  Private
 */
export const checkFreeProductEligibility = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.uid;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  const eligibilityData = await checkEligibility(userId);

  res.json({
    success: true,
    data: eligibilityData
  });
});

/**
 * @desc    Select a free product
 * @route   POST /api/free-product/select
 * @access  Private
 */
export const selectFreeProduct = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.uid;
  const { productId } = req.body;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  if (!productId) {
    return res.status(400).json({
      success: false,
      message: 'Product ID is required'
    });
  }

  // Check if user is eligible
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (!user.freeProductEligible) {
    return res.status(403).json({
      success: false,
      message: 'User is not eligible for a free product'
    });
  }

  // Verify product exists
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  if (!product.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Selected product is not available'
    });
  }

  // Update user's selected free product
  user.selectedFreeProductId = productId;
  await user.save();

  res.json({
    success: true,
    message: 'Free product selected successfully',
    data: {
      selectedProduct: {
        _id: product._id,
        name: product.name,
        image: product.images?.[0] || product.image,
        price: product.price
      }
    }
  });
});

/**
 * @desc    Add free product to cart
 * @route   POST /api/free-product/add-to-cart
 * @access  Private
 */
export const addFreeProductToCart = asyncHandler(async (req, res) => {
  const firebaseUid = req.user?.uid;  // Firebase UID for cart operations
  const mongoId = req.user?._id;      // MongoDB _id for user lookup
  
  if (!firebaseUid || !mongoId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  const { productId, variantIndex = 0 } = req.body;

  // Check if user is eligible and has selected this product
  const user = await User.findById(mongoId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (!user.freeProductEligible) {
    return res.status(403).json({
      success: false,
      message: 'User is not eligible for a free product'
    });
  }

  // Use provided productId or the user's selected free product
  const selectedProductId = productId || user.selectedFreeProductId;
  
  if (!selectedProductId) {
    return res.status(400).json({
      success: false,
      message: 'No free product selected'
    });
  }

  // Get product details
  const product = await Product.findById(selectedProductId);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  if (!product.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Product is not available'
    });
  }

  // Get or create cart (use Firebase UID for cart operations)
  const cart = await NewCart.getOrCreateCart(firebaseUid);

  // Check if there's already a free product in the cart
  const existingFreeProduct = cart.items.find(item => item.isFreeProduct);
  if (existingFreeProduct) {
    // If it's the same product, just return success
    if (existingFreeProduct.productId.toString() === selectedProductId.toString()) {
      await cart.populate('items.productId');
      return res.json({
        success: true,
        message: 'Free product already in cart',
        data: {
          cart: {
            items: cart.items,
            cartTotal: cart.cartTotal,
            cartCount: cart.cartCount
          }
        }
      });
    }
    // If it's a different product, return error
    return res.status(400).json({
      success: false,
      message: 'Cart already contains a different free product. Please remove it first.'
    });
  }

  // Prepare product details for cart
  const selectedVariant = product.variants?.[variantIndex] || null;
  
  const productDetails = {
    name: product.name,
    price: selectedVariant?.price || product.price,
    image: product.images?.[0] || product.image,
    category: product.category?.name || product.category,
    isActive: product.isActive,
    hasEgg: product.hasEgg || false,
    variantIndex,
    variants: product.variants || [],
    selectedVariant
  };

  // Add free product to cart with isFreeProduct flag
  await cart.addOrUpdateItem(
    selectedProductId,
    1, // Only one free product
    productDetails,
    { absolute: true, isFreeProduct: true }
  );

  // Update user to mark that free product has been selected
  user.selectedFreeProductId = selectedProductId;
  await user.save();

  // Populate cart items
  await cart.populate('items.productId');

  // Format cart items properly (same format as getNewCart)
  const formattedItems = cart.items.map(item => {
    const itemObj = item.toObject ? item.toObject() : item;
    return {
      _id: itemObj._id,
      productId: itemObj.productId?._id || itemObj.productId,
      quantity: itemObj.quantity,
      isFreeProduct: itemObj.isFreeProduct || false,
      addedAt: itemObj.addedAt,
      productDetails: itemObj.productDetails
    };
  });

  res.json({
    success: true,
    message: 'Free product added to cart successfully',
    data: {
      cart: {
        items: formattedItems,
        cartTotal: cart.cartTotal,
        cartCount: cart.cartCount
      }
    }
  });
});

/**
 * @desc    Remove free product from cart (if user changes their mind)
 * @route   DELETE /api/free-product/remove-from-cart
 * @access  Private
 */
export const removeFreeProductFromCart = asyncHandler(async (req, res) => {
  const firebaseUid = req.user?.uid;  // Firebase UID for cart operations
  const mongoId = req.user?._id;      // MongoDB _id for user lookup

  if (!firebaseUid || !mongoId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  const cart = await NewCart.findOne({ userId: firebaseUid });
  if (!cart) {
    return res.status(404).json({
      success: false,
      message: 'Cart not found'
    });
  }

  // Find and remove free product
  const freeProductIndex = cart.items.findIndex(item => item.isFreeProduct);
  
  if (freeProductIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'No free product found in cart'
    });
  }

  cart.items.splice(freeProductIndex, 1);
  cart.lastUpdated = new Date();
  await cart.save();

  // Clear the selected free product ID so user can select again
  const user = await User.findById(mongoId);
  if (user) {
    user.selectedFreeProductId = null;
    await user.save();
  }

  res.json({
    success: true,
    message: 'Free product removed from cart',
    data: {
      cart: {
        items: cart.items,
        cartTotal: cart.cartTotal,
        cartCount: cart.cartCount
      }
    }
  });
});

/**
 * @desc    Get progress towards free product eligibility
 * @route   GET /api/free-product/progress
 * @access  Private
 */
export const getFreeProductProgress = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.uid;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  const eligibilityData = await checkEligibility(userId);

  // Get user's order dates for timeline display
  const user = await User.findById(userId).select('monthlyOrderDays');
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  // Get current month order dates
  const currentMonthOrders = (user?.monthlyOrderDays || []).filter(
    orderDay => orderDay.month === currentMonth && orderDay.year === currentYear
  );
  
  // Extract and sort dates
  const orderDates = currentMonthOrders
    .map(od => od.date)
    .sort((a, b) => new Date(b) - new Date(a)); // Sort newest first

  const progress = {
    currentDays: eligibilityData.uniqueDaysCount,
    requiredDays: 10,
    daysRemaining: eligibilityData.daysRemaining,
    isEligible: eligibilityData.eligible,
    percentage: Math.min((eligibilityData.uniqueDaysCount / 10) * 100, 100),
    orderDates: orderDates // Add order dates for timeline
  };

  res.json({
    success: true,
    data: progress
  });
});
