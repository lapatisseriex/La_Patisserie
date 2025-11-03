import { asyncHandler } from '../utils/asyncHandler.js';
import User from '../models/userModel.js';
import { resetMonthlyRewardsForAllUsers } from '../utils/monthlyRewardCleanup.js';

/**
 * @desc    Get all users with their free product reward status (eligible, used, in-progress)
 * @route   GET /api/admin/free-product-claims/all-users
 * @access  Private/Admin
 */
export const getAllUsersRewardStatus = asyncHandler(async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    // Build query - get users who have ordered at least once
    const query = {
      'monthlyOrderDays.0': { $exists: true }
    };
    
    // Filter by status if provided
    if (status === 'eligible') {
      query.freeProductEligible = true;
      query.freeProductUsed = false;
    } else if (status === 'used') {
      query.freeProductUsed = true;
    } else if (status === 'progress') {
      query.freeProductEligible = false;
      query.freeProductUsed = false;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get all users
    const users = await User.find(query)
      .select('name email phone monthlyOrderDays freeProductEligible freeProductUsed lastRewardMonth freeProductClaimHistory')
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const totalCount = await User.countDocuments(query);
    
    // Format user data
    const usersData = users.map(user => {
      // Calculate current month order days
      const currentMonthOrders = (user.monthlyOrderDays || []).filter(
        orderDay => orderDay.month === currentMonth && orderDay.year === currentYear
      );
      const uniqueDays = new Set(currentMonthOrders.map(od => new Date(od.date).getDate()));
      
      // Get last claim
      const lastClaim = user.freeProductClaimHistory && user.freeProductClaimHistory.length > 0
        ? user.freeProductClaimHistory[user.freeProductClaimHistory.length - 1]
        : null;
      
      // Determine status
      let userStatus = 'progress';
      if (user.freeProductEligible && !user.freeProductUsed) {
        userStatus = 'eligible';
      } else if (user.freeProductUsed) {
        userStatus = 'used';
      }
      
      return {
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        userPhone: user.phone,
        currentOrderDays: uniqueDays.size,
        daysRemaining: Math.max(0, 10 - uniqueDays.size),
        status: userStatus,
        eligible: user.freeProductEligible,
        used: user.freeProductUsed,
        lastRewardMonth: user.lastRewardMonth,
        lastClaim: lastClaim ? {
          productName: lastClaim.productName,
          claimedAt: lastClaim.claimedAt,
          month: lastClaim.month
        } : null,
        totalClaims: user.freeProductClaimHistory?.length || 0
      };
    });
    
    res.json({
      success: true,
      data: {
        users: usersData,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching all users reward status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users reward status',
      error: error.message
    });
  }
});

/**
 * @desc    Get all users who claimed free products
 * @route   GET /api/admin/free-product-claims
 * @access  Private/Admin
 */
export const getFreeProductClaims = asyncHandler(async (req, res) => {
  try {
    const { month, limit = 50, page = 1 } = req.query;
    
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
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
            // Calculate CURRENT MONTH order days only
            const currentMonthOrders = (user.monthlyOrderDays || []).filter(
              orderDay => orderDay.month === currentMonth && orderDay.year === currentYear
            );
            const uniqueDays = new Set(currentMonthOrders.map(od => new Date(od.date).getDate()));
            
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
              currentOrderDays: uniqueDays.size, // Only current month unique days
              lastRewardMonth: user.lastRewardMonth
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
    
    // Get currently eligible users (STRICT: eligible and not used)
    const eligibleUsers = await User.countDocuments({
      freeProductEligible: true,
      freeProductUsed: false
    });
    
    // Get users with progress in CURRENT MONTH (has order days for current month but not eligible yet)
    const allUsersWithOrderDays = await User.find({
      'monthlyOrderDays.0': { $exists: true }
    }).select('monthlyOrderDays freeProductEligible');
    
    let usersWithProgress = 0;
    allUsersWithOrderDays.forEach(user => {
      const currentMonthOrders = (user.monthlyOrderDays || []).filter(
        orderDay => orderDay.month === currentMonth && orderDay.year === currentYear
      );
      // Count users who have current month orders but aren't eligible yet
      if (currentMonthOrders.length > 0 && !user.freeProductEligible) {
        usersWithProgress++;
      }
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
    
    console.log(`📊 Admin Stats - Month: ${currentMonthKey}, Eligible: ${eligibleUsers}, Progress: ${usersWithProgress}`);
    
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
    
    // Calculate current progress - ONLY COUNT CURRENT MONTH
    const currentMonthOrders = (user.monthlyOrderDays || []).filter(
      orderDay => orderDay.month === currentMonth && orderDay.year === currentYear
    );
    
    // Count unique days (not duplicate orders on same day)
    const uniqueDays = new Set(currentMonthOrders.map(od => new Date(od.date).getDate()));
    
    // Format order dates for display
    const orderDatesFormatted = currentMonthOrders.map(od => ({
      date: od.date,
      day: od.day,
      month: od.month,
      year: od.year,
      formatted: new Date(od.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    }));
    
    console.log(`📊 Admin - User ${userId} progress: ${uniqueDays.size}/10 days in ${currentYear}-${String(currentMonth).padStart(2, '0')}`);
    
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
          totalOrderEntries: currentMonthOrders.length, // Show how many order entries exist
          daysRemaining: Math.max(0, 10 - uniqueDays.size),
          currentMonth: `${currentYear}-${String(currentMonth).padStart(2, '0')}`,
          orderDates: orderDatesFormatted // Send formatted dates
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

/**
 * @desc    Reset monthly rewards for all users (cleanup old month data)
 * @route   POST /api/admin/free-product-claims/reset-monthly
 * @access  Private/Admin
 */
export const resetMonthlyRewards = asyncHandler(async (req, res) => {
  try {
    console.log('🔄 Admin triggered monthly reward reset');
    
    const result = await resetMonthlyRewardsForAllUsers();
    
    res.json({
      success: true,
      message: 'Monthly rewards reset successfully',
      data: result
    });
  } catch (error) {
    console.error('Error resetting monthly rewards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset monthly rewards',
      error: error.message
    });
  }
});
