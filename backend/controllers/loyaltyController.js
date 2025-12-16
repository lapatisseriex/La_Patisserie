import { asyncHandler } from '../utils/asyncHandler.js';
import LoyaltyProgram from '../models/loyaltyProgramModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';

// @desc    Get loyalty status for admin view
// @route   GET /api/admin/users/:userId/loyalty
// @access  Private (Admin only)
export const getUserLoyaltyForAdmin = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  try {
    // Get user data first - this contains the actual monthlyOrderDays
    const user = await User.findOne({ uid: userId });
    
    // Calculate current month days from User model
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();
    const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    
    let uniqueDaysCount = 0;
    let orderDatesFromUser = [];
    
    if (user && user.monthlyOrderDays && Array.isArray(user.monthlyOrderDays)) {
      const currentMonthDays = user.monthlyOrderDays.filter(day => {
        return day.month === currentMonth && day.year === currentYear;
      });
      uniqueDaysCount = currentMonthDays.length;
      orderDatesFromUser = currentMonthDays.map(day => {
        const dateObj = new Date(day.date);
        return dateObj.toISOString().split('T')[0];
      });
    }
    
    const remainingDays = Math.max(0, 10 - uniqueDaysCount);
    const freeProductEligible = user?.freeProductEligible || false;
    const freeProductClaimed = user?.freeProductUsed || false;
    
    // Also check LoyaltyProgram for additional data
    const loyalty = await LoyaltyProgram.findOne({ userId });

    res.json({
      success: true,
      data: {
        hasLoyaltyProgram: !!loyalty || uniqueDaysCount > 0,
        uniqueDaysCount: uniqueDaysCount,
        totalOrdersThisMonth: loyalty?.totalOrdersThisMonth || uniqueDaysCount,
        freeProductEligible: freeProductEligible,
        freeProductClaimed: freeProductClaimed,
        freeProductClaimedAt: loyalty?.freeProductClaimedAt || null,
        remainingDays,
        currentMonth: currentMonthKey,
        lastOrderDate: loyalty?.lastOrderDate || (orderDatesFromUser.length > 0 ? orderDatesFromUser[orderDatesFromUser.length - 1] : null),
        orderDates: orderDatesFromUser.length > 0 ? orderDatesFromUser : (loyalty?.orderDates || []),
        history: loyalty?.history || [],
        // Include user claim history if available
        claimHistory: user?.freeProductClaimHistory || []
      }
    });
  } catch (error) {
    console.error('Error getting user loyalty for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user loyalty status',
      error: error.message
    });
  }
});

// @desc    Get loyalty status for current user
// @route   GET /api/loyalty/status
// @access  Private
export const getLoyaltyStatus = asyncHandler(async (req, res) => {
  const userId = req.user.uid;

  const loyalty = await LoyaltyProgram.getOrCreate(userId);
  await loyalty.save();

  const remainingDays = loyalty.getRemainingDays();

  res.json({
    success: true,
    data: {
      uniqueDaysCount: loyalty.uniqueDaysCount,
      totalOrdersThisMonth: loyalty.totalOrdersThisMonth,
      freeProductEligible: loyalty.freeProductEligible,
      freeProductClaimed: loyalty.freeProductClaimed,
      remainingDays,
      currentMonth: loyalty.currentMonth,
      lastOrderDate: loyalty.lastOrderDate,
      orderDates: loyalty.orderDates,
    }
  });
});

// @desc    Get available products for free selection
// @route   GET /api/loyalty/free-products
// @access  Private
export const getAvailableFreeProducts = asyncHandler(async (req, res) => {
  const userId = req.user.uid;

  const loyalty = await LoyaltyProgram.getOrCreate(userId);

  if (!loyalty.freeProductEligible) {
    return res.status(400).json({
      success: false,
      message: 'You are not eligible for a free product yet',
      remainingDays: loyalty.getRemainingDays(),
    });
  }

  // Get all active products (you can add more filters as needed)
  const products = await Product.find({ 
    isActive: true,
    stock: { $gt: 0 }
  })
    .select('name description price images category variants stock')
    .sort({ name: 1 })
    .lean();

  res.json({
    success: true,
    data: {
      products,
      eligibility: {
        uniqueDaysCount: loyalty.uniqueDaysCount,
        freeProductEligible: loyalty.freeProductEligible,
      }
    }
  });
});

// @desc    Validate free product selection (called before order placement)
// @route   POST /api/loyalty/validate-free-product
// @access  Private
export const validateFreeProduct = asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const { productId, variantIndex } = req.body;

  if (!productId) {
    return res.status(400).json({
      success: false,
      message: 'Product ID is required',
    });
  }

  const loyalty = await LoyaltyProgram.getOrCreate(userId);

  if (!loyalty.freeProductEligible) {
    return res.status(400).json({
      success: false,
      message: 'You are not eligible for a free product',
      remainingDays: loyalty.getRemainingDays(),
    });
  }

  if (loyalty.freeProductClaimed) {
    return res.status(400).json({
      success: false,
      message: 'You have already claimed your free product for this month',
    });
  }

  // Validate product exists and is available
  const product = await Product.findById(productId);
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
    });
  }

  if (!product.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Selected product is not available',
    });
  }

  // Check stock
  let stockAvailable = false;
  if (product.variants && product.variants.length > 0) {
    const variant = product.variants[variantIndex || 0];
    if (variant && variant.stock > 0) {
      stockAvailable = true;
    }
  } else if (product.stock > 0) {
    stockAvailable = true;
  }

  if (!stockAvailable) {
    return res.status(400).json({
      success: false,
      message: 'Selected product is out of stock',
    });
  }

  res.json({
    success: true,
    message: 'Free product validated successfully',
    data: {
      productId: product._id,
      productName: product.name,
      variantIndex: variantIndex || 0,
    }
  });
});

// @desc    Mark free product as claimed (called after successful order)
// @route   POST /api/loyalty/claim-free-product
// @access  Private
export const markFreeProductClaimed = asyncHandler(async (req, res) => {
  const userId = req.user.uid;

  const loyalty = await LoyaltyProgram.getOrCreate(userId);

  const claimed = loyalty.claimFreeProduct();
  
  if (!claimed) {
    return res.status(400).json({
      success: false,
      message: 'Unable to claim free product. Either not eligible or already claimed.',
    });
  }

  await loyalty.save();

  res.json({
    success: true,
    message: 'Free product claimed successfully',
    data: {
      freeProductClaimed: true,
      claimedAt: loyalty.freeProductClaimedAt,
    }
  });
});

// @desc    Update loyalty after order (internal use)
// @route   POST /api/loyalty/update-after-order
// @access  Private
export const updateLoyaltyAfterOrder = asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const { orderDate } = req.body;

  const loyalty = await LoyaltyProgram.getOrCreate(userId);
  loyalty.updateAfterOrder(orderDate || new Date());
  await loyalty.save();

  const remainingDays = loyalty.getRemainingDays();

  res.json({
    success: true,
    message: 'Loyalty updated successfully',
    data: {
      uniqueDaysCount: loyalty.uniqueDaysCount,
      freeProductEligible: loyalty.freeProductEligible,
      remainingDays,
    }
  });
});

// @desc    Get loyalty history
// @route   GET /api/loyalty/history
// @access  Private
export const getLoyaltyHistory = asyncHandler(async (req, res) => {
  const userId = req.user.uid;

  const loyalty = await LoyaltyProgram.findOne({ userId });

  if (!loyalty) {
    return res.json({
      success: true,
      data: {
        history: [],
        current: null,
      }
    });
  }

  res.json({
    success: true,
    data: {
      history: loyalty.history,
      current: {
        month: loyalty.currentMonth,
        uniqueDaysCount: loyalty.uniqueDaysCount,
        totalOrdersThisMonth: loyalty.totalOrdersThisMonth,
        freeProductEligible: loyalty.freeProductEligible,
        freeProductClaimed: loyalty.freeProductClaimed,
      }
    }
  });
});
