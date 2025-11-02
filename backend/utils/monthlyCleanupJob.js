import cron from 'node-cron';
import User from '../models/userModel.js';

/**
 * Monthly cleanup job to reset free product claim history
 * Runs every day at 00:01 (1 minute after midnight)
 * Checks if it's the 1st day of a new month and clears old claim history
 */
export const startMonthlyCleanupJob = () => {
  // Run every day at 00:01 AM
  cron.schedule('1 0 * * *', async () => {
    try {
      const now = new Date();
      const currentDay = now.getDate();
      
      // Only run on the 1st day of the month
      if (currentDay === 1) {
        console.log('🗑️  Starting monthly claim history cleanup...');
        
        const currentMonth = now.getMonth() + 1; // 1-12
        const currentYear = now.getFullYear();
        const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
        
        // Get previous month for logging
        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        const prevMonthKey = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
        
        // Find all users with claim history from previous months
        const result = await User.updateMany(
          {
            'freeProductClaimHistory.0': { $exists: true } // Has at least one claim
          },
          {
            $pull: {
              freeProductClaimHistory: {
                month: { $ne: currentMonthKey } // Remove all claims NOT from current month
              }
            }
          }
        );
        
        console.log(`✅ Monthly cleanup completed!`);
        console.log(`   - Previous month: ${prevMonthKey}`);
        console.log(`   - Current month: ${currentMonthKey}`);
        console.log(`   - Users processed: ${result.modifiedCount}`);
        console.log(`   - Old claim history removed successfully`);
        
        // Also clean up old monthlyOrderDays (keep only last 2 months for safety)
        const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        
        const orderDaysResult = await User.updateMany(
          {},
          {
            $pull: {
              monthlyOrderDays: {
                date: { $lt: twoMonthsAgo }
              }
            }
          }
        );
        
        console.log(`   - Old order days cleaned: ${orderDaysResult.modifiedCount} users`);
        
      } else {
        console.log(`⏭️  Not the 1st of the month (Day ${currentDay}) - Skipping cleanup`);
      }
    } catch (error) {
      console.error('❌ Error in monthly cleanup job:', error);
    }
  });
  
  console.log('🕐 Monthly cleanup job scheduled - Runs daily at 00:01 AM');
  console.log('   - Removes claim history from previous months');
  console.log('   - Keeps only current month data');
};

/**
 * Manual cleanup function for testing or admin trigger
 * Can be called directly to force cleanup
 */
export const runManualCleanup = async () => {
  try {
    console.log('🔧 Running MANUAL claim history cleanup...');
    
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    
    // Remove all claims NOT from current month
    const result = await User.updateMany(
      {
        'freeProductClaimHistory.0': { $exists: true }
      },
      {
        $pull: {
          freeProductClaimHistory: {
            month: { $ne: currentMonthKey }
          }
        }
      }
    );
    
    // Clean up old order days
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const orderDaysResult = await User.updateMany(
      {},
      {
        $pull: {
          monthlyOrderDays: {
            date: { $lt: twoMonthsAgo }
          }
        }
      }
    );
    
    console.log('✅ Manual cleanup completed!');
    console.log(`   - Current month: ${currentMonthKey}`);
    console.log(`   - Users with claims cleaned: ${result.modifiedCount}`);
    console.log(`   - Users with old order days cleaned: ${orderDaysResult.modifiedCount}`);
    
    return {
      success: true,
      currentMonth: currentMonthKey,
      usersProcessed: result.modifiedCount,
      orderDaysCleaned: orderDaysResult.modifiedCount
    };
    
  } catch (error) {
    console.error('❌ Error in manual cleanup:', error);
    throw error;
  }
};

/**
 * Get cleanup status and next run time
 */
export const getCleanupStatus = () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 1, 0, 0);
  
  const firstOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 1, 0, 0);
  
  return {
    currentDate: now.toISOString(),
    nextDailyCheck: tomorrow.toISOString(),
    nextCleanupDate: firstOfNextMonth.toISOString(),
    daysUntilCleanup: Math.ceil((firstOfNextMonth - now) / (1000 * 60 * 60 * 24))
  };
};
