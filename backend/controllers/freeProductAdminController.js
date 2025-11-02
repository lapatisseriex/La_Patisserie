import { asyncHandler } from '../utils/asyncHandler.js';
import User from '../models/userModel.js';

/**
 * @desc    Get all users who claimed free products
 * @route   GET /api/admin/free-product-claims
 * @access  Private/Admin
 */
export const getFreeProductClaims = asyncHandler(async (req, res) => {
  try {
    const { month, limit = 50, page = 1 } = req.query;
    
    // Build query
    const query = {
      'freeProductClaimHistory.0': { $exists: true } // Has at least one claim
    };
    
    // If month filter provided, filter by specific month
    if (month) {
      query['freeProductClaimHistory.month'] = month;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get users with claim history
    const users = await User.find(query)
      .select('name email phone freeProductClaimHistory monthlyOrderDays freeProductEligible freeProductUsed lastRewardMonth')
      .sort({ 'freeProductClaimHistory.claimedAt': -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('freeProductClaimHistory.productId', 'name images price');
    
    // Get total count for pagination
    const totalCount = await User.countDocuments(query);
    
    // Format the response to flatten claim history
    const claims = [];
    users.forEach(user => {
      if (user.freeProductClaimHistory && user.freeProductClaimHistory.length > 0) {
        user.freeProductClaimHistory.forEach(claim => {
          // Filter by month if specified
          if (!month || claim.month === month) {
            claims.push({
              userId: user._id,
              userName: user.name,
              userEmail: user.email,
              userPhone: user.phone,
              productId: claim.productId?._id,
              productName: claim.productName || claim.productId?.name,
              productImage: claim.productId?.images?.[0],
              claimedAt: claim.claimedAt,
              month: claim.month,
              orderNumber: claim.orderNumber,
              currentEligible: user.freeProductEligible,
              currentUsed: user.freeProductUsed,
              currentOrderDays: user.monthlyOrderDays?.length || 0
            });
          }
        });
      }
    });
    
    // Sort by claimed date
    claims.sort((a, b) => new Date(b.claimedAt) - new Date(a.claimedAt));
    
    res.json({
      success: true,
      data: {
        claims,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching free product claims:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch free product claims',
      error: error.message
    });
  }
});

/**
 * @desc    Get free product claims statistics
 * @route   GET /api/admin/free-product-claims/stats
 * @access  Private/Admin
 */
export const getFreeProductClaimsStats = asyncHandler(async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    
    // Get total claims all time
    const totalUsers = await User.countDocuments({
      'freeProductClaimHistory.0': { $exists: true }
    });
    
    // Get claims this month
    const thisMonthClaims = await User.aggregate([
      { $unwind: '$freeProductClaimHistory' },
      { $match: { 'freeProductClaimHistory.month': currentMonthKey } },
      { $count: 'total' }
    ]);
    
    // Get currently eligible users
    const eligibleUsers = await User.countDocuments({
      freeProductEligible: true,
      freeProductUsed: false
    });
    
    // Get users with progress (order days but not eligible yet)
    const usersWithProgress = await User.countDocuments({
      'monthlyOrderDays.0': { $exists: true },
      freeProductEligible: false
    });
    
    // Get most claimed products this month
    const topProducts = await User.aggregate([
      { $unwind: '$freeProductClaimHistory' },
      { $match: { 'freeProductClaimHistory.month': currentMonthKey } },
      {
        $group: {
          _id: {
            productId: '$freeProductClaimHistory.productId',
            productName: '$freeProductClaimHistory.productName'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      success: true,
      data: {
        totalUsersWithClaims: totalUsers,
        claimsThisMonth: thisMonthClaims[0]?.total || 0,
        currentlyEligible: eligibleUsers,
        usersWithProgress: usersWithProgress,
        currentMonth: currentMonthKey,
        topClaimedProducts: topProducts.map(p => ({
          productName: p._id.productName,
          productId: p._id.productId,
          claimCount: p.count
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching free product stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

/**
 * @desc    Get specific user's claim history
 * @route   GET /api/admin/free-product-claims/user/:userId
 * @access  Private/Admin
 */
export const getUserClaimHistory = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .select('name email phone freeProductClaimHistory monthlyOrderDays freeProductEligible freeProductUsed lastRewardMonth')
      .populate('freeProductClaimHistory.productId', 'name images price');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    // Calculate current progress
    const currentMonthOrders = (user.monthlyOrderDays || []).filter(
      orderDay => orderDay.month === currentMonth && orderDay.year === currentYear
    );
    const uniqueDays = new Set(currentMonthOrders.map(od => new Date(od.date).getDate()));
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone
        },
        currentStatus: {
          eligible: user.freeProductEligible,
          used: user.freeProductUsed,
          lastRewardMonth: user.lastRewardMonth,
          orderDaysThisMonth: uniqueDays.size,
          daysRemaining: Math.max(0, 10 - uniqueDays.size)
        },
        claimHistory: (user.freeProductClaimHistory || []).map(claim => ({
          productId: claim.productId?._id,
          productName: claim.productName || claim.productId?.name,
          productImage: claim.productId?.images?.[0],
          claimedAt: claim.claimedAt,
          month: claim.month,
          orderNumber: claim.orderNumber
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching user claim history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user claim history',
      error: error.message
    });
  }
});
