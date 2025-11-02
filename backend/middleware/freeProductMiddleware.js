import User from '../models/userModel.js';

/**
 * Middleware to track order days and update user eligibility for free product
 * Should be called after a successful order is placed
 */
export const trackOrderDay = async (userId) => {
  try {
    if (!userId) {
      console.error('No userId provided to trackOrderDay');
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found:', userId);
      return;
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();
    const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    
    // Get today's date at midnight for comparison
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Initialize monthlyOrderDays if not exists
    if (!user.monthlyOrderDays) {
      user.monthlyOrderDays = [];
    }

    // Check if user already ordered today
    const alreadyOrderedToday = user.monthlyOrderDays.some(orderDay => {
      const orderDate = new Date(orderDay.date);
      const orderDateStart = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
      return orderDateStart.getTime() === todayStart.getTime();
    });

    // If not ordered today, add the day
    if (!alreadyOrderedToday) {
      user.monthlyOrderDays.push({
        date: now,
        month: currentMonth,
        year: currentYear
      });
    }

    // Filter order days for current month
    const currentMonthOrders = user.monthlyOrderDays.filter(
      orderDay => orderDay.month === currentMonth && orderDay.year === currentYear
    );

    // Count unique days in current month
    const uniqueDays = new Set(
      currentMonthOrders.map(orderDay => {
        const d = new Date(orderDay.date);
        return d.getDate();
      })
    );

    const uniqueDaysCount = uniqueDays.size;

    // Check if it's a new month - if so, reset everything
    if (user.lastRewardMonth && user.lastRewardMonth !== currentMonthKey) {
      // New month - reset everything
      console.log(`🔄 New month detected for user ${userId} - Resetting all free product data`);
      user.freeProductEligible = false;
      user.selectedFreeProductId = null;
      user.freeProductUsed = false;
      user.lastRewardMonth = null; // Clear to allow fresh start
      
      // Clean up old month's order days (keep only current month)
      user.monthlyOrderDays = user.monthlyOrderDays.filter(
        orderDay => orderDay.month === currentMonth && orderDay.year === currentYear
      );
      
      // Recalculate unique days after cleaning
      const cleanedOrders = user.monthlyOrderDays;
      const cleanedUniqueDays = new Set(
        cleanedOrders.map(orderDay => {
          const d = new Date(orderDay.date);
          return d.getDate();
        })
      );
      const cleanedUniqueDaysCount = cleanedUniqueDays.size;
      
      // Check if user is eligible in the new month after reset
      if (cleanedUniqueDaysCount >= 10) {
        user.freeProductEligible = true;
        user.lastRewardMonth = currentMonthKey;
        console.log(`🎉 User ${userId} eligible in new month with ${cleanedUniqueDaysCount} days!`);
      }
    } else {
      // Same month - check if user has reached 10 unique order days
      // STRICT: Only allow ONE free product per month
      if (uniqueDaysCount >= 10 && !user.freeProductEligible && !user.freeProductUsed) {
        user.freeProductEligible = true;
        user.lastRewardMonth = currentMonthKey;
        console.log(`🎉 User ${userId} is now eligible for a free product! (${uniqueDaysCount} days)`);
      } else if (user.freeProductUsed) {
        // User already used their free product this month - not eligible again
        console.log(`❌ User ${userId} already claimed free product this month. Wait for next month.`);
      }
    }

    await user.save();
    return {
      uniqueDaysCount,
      isEligible: user.freeProductEligible,
      daysRemaining: Math.max(0, 10 - uniqueDaysCount)
    };
  } catch (error) {
    console.error('Error in trackOrderDay middleware:', error);
    return null;
  }
};

/**
 * Middleware to check and reset free product status after it's used
 * This marks the free product as used and resets eligibility
 * STRICT: Only ONE free product per month - user must wait until next month
 */
export const markFreeProductUsed = async (userId, productId, productName, orderNumber) => {
  try {
    if (!userId) {
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      return;
    }

    if (user.freeProductEligible || user.selectedFreeProductId) {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
      
      // Reset eligibility flags and mark as used for THIS MONTH
      user.freeProductEligible = false;
      user.freeProductUsed = true; // This prevents getting another free product this month
      user.selectedFreeProductId = null;
      
      // Record claim history for admin tracking
      if (!user.freeProductClaimHistory) {
        user.freeProductClaimHistory = [];
      }
      user.freeProductClaimHistory.push({
        productId: productId,
        productName: productName,
        claimedAt: now,
        month: currentMonthKey,
        orderNumber: orderNumber
      });
      
      // Keep monthlyOrderDays intact - user can't use them this month, but they roll over
      
      await user.save();
      console.log(`✅ Free product claimed by user ${userId} - NO MORE free products until next month`);
    }
  } catch (error) {
    console.error('Error in markFreeProductUsed:', error);
  }
};

/**
 * Check user's current eligibility status
 */
export const checkEligibility = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return {
        eligible: false,
        uniqueDaysCount: 0,
        daysRemaining: 10
      };
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Filter order days for current month
    const currentMonthOrders = (user.monthlyOrderDays || []).filter(
      orderDay => orderDay.month === currentMonth && orderDay.year === currentYear
    );

    // Count unique days
    const uniqueDays = new Set(
      currentMonthOrders.map(orderDay => {
        const d = new Date(orderDay.date);
        return d.getDate();
      })
    );

    const uniqueDaysCount = uniqueDays.size;

    return {
      eligible: user.freeProductEligible || false,
      uniqueDaysCount,
      daysRemaining: Math.max(0, 10 - uniqueDaysCount),
      selectedFreeProductId: user.selectedFreeProductId || null,
      freeProductUsed: user.freeProductUsed || false
    };
  } catch (error) {
    console.error('Error checking eligibility:', error);
    return {
      eligible: false,
      uniqueDaysCount: 0,
      daysRemaining: 10
    };
  }
};
