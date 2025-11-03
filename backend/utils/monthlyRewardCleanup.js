import User from '../models/userModel.js';
import LoyaltyProgram from '../models/loyaltyProgramModel.js';

/**
 * Reset monthly rewards for all users at the start of a new month
 * This function should be called automatically (via cron job) on the 1st of each month
 * or can be called manually by admin
 */
export const resetMonthlyRewardsForAllUsers = async () => {
  try {
    console.log('🔄 Starting monthly reward reset for all users...');
    
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    
    console.log(`📅 Current Month: ${currentMonthKey}`);
    
    // Find all users who have monthly order days or reward data
    const users = await User.find({
      $or: [
        { 'monthlyOrderDays.0': { $exists: true } },
        { freeProductEligible: true },
        { freeProductUsed: true },
        { lastRewardMonth: { $exists: true, $ne: null } }
      ]
    });
    
    console.log(`👥 Found ${users.length} users with reward data`);
    
    let resetCount = 0;
    let cleanedCount = 0;
    
    for (const user of users) {
      let needsUpdate = false;
      
      // Clean old month data - keep only current month
      if (user.monthlyOrderDays && user.monthlyOrderDays.length > 0) {
        const oldLength = user.monthlyOrderDays.length;
        user.monthlyOrderDays = user.monthlyOrderDays.filter(
          orderDay => orderDay.month === currentMonth && orderDay.year === currentYear
        );
        
        if (oldLength !== user.monthlyOrderDays.length) {
          cleanedCount++;
          needsUpdate = true;
          console.log(`  🧹 Cleaned ${oldLength - user.monthlyOrderDays.length} old days for user ${user.email}`);
        }
      }
      
      // Reset if user's last reward was from a different month
      if (user.lastRewardMonth && user.lastRewardMonth !== currentMonthKey) {
        console.log(`  🔄 Resetting user ${user.email} (last reward: ${user.lastRewardMonth})`);
        user.freeProductEligible = false;
        user.selectedFreeProductId = null;
        user.freeProductUsed = false;
        user.lastRewardMonth = null;
        resetCount++;
        needsUpdate = true;
      }
      
      // Save if any changes were made
      if (needsUpdate) {
        await user.save();
      }
    }
    
    // Also clean LoyaltyProgram model
    const loyaltyRecords = await LoyaltyProgram.find({
      currentMonth: { $ne: currentMonthKey }
    });
    
    console.log(`📊 Found ${loyaltyRecords.length} loyalty records to reset`);
    
    for (const loyalty of loyaltyRecords) {
      // Archive to history if they had progress
      if (loyalty.uniqueDaysCount >= 10 || loyalty.freeProductClaimed) {
        loyalty.history.push({
          month: loyalty.currentMonth,
          uniqueDaysCount: loyalty.uniqueDaysCount,
          freeProductClaimed: loyalty.freeProductClaimed,
          claimedAt: loyalty.freeProductClaimedAt,
        });
      }
      
      // Reset for new month
      loyalty.currentMonth = currentMonthKey;
      loyalty.orderDates = [];
      loyalty.uniqueDaysCount = 0;
      loyalty.freeProductEligible = false;
      loyalty.freeProductClaimed = false;
      loyalty.freeProductClaimedAt = null;
      loyalty.totalOrdersThisMonth = 0;
      
      await loyalty.save();
    }
    
    console.log('✅ Monthly reward reset completed');
    console.log(`   Users cleaned: ${cleanedCount}`);
    console.log(`   Users reset: ${resetCount}`);
    console.log(`   Loyalty records reset: ${loyaltyRecords.length}`);
    
    return {
      success: true,
      cleanedCount,
      resetCount,
      loyaltyRecordsReset: loyaltyRecords.length,
      currentMonth: currentMonthKey
    };
    
  } catch (error) {
    console.error('❌ Error resetting monthly rewards:', error);
    throw error;
  }
};

/**
 * Clean up old month data for a specific user
 * This is called automatically when user places an order
 */
export const cleanupUserOldData = async (userId) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    const user = await User.findById(userId);
    if (!user) return;
    
    if (user.monthlyOrderDays && user.monthlyOrderDays.length > 0) {
      const oldLength = user.monthlyOrderDays.length;
      user.monthlyOrderDays = user.monthlyOrderDays.filter(
        orderDay => orderDay.month === currentMonth && orderDay.year === currentYear
      );
      
      if (oldLength !== user.monthlyOrderDays.length) {
        await user.save();
        console.log(`🧹 Cleaned ${oldLength - user.monthlyOrderDays.length} old days for user ${userId}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning user data:', error);
  }
};
