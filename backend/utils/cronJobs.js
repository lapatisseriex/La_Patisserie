import cron from 'node-cron';
import { resetMonthlyRewardsForAllUsers } from '../utils/monthlyRewardCleanup.js';

/**
 * Schedule automatic monthly reward cleanup
 * Runs on the 1st of every month at 00:01 AM
 */
export const scheduleMonthlyRewardCleanup = () => {
  // Schedule: Run on 1st of every month at 00:01 AM
  // Cron format: minute hour day month day-of-week
  // '1 0 1 * *' = At 00:01 on day 1 of every month
  
  const task = cron.schedule('1 0 1 * *', async () => {
    console.log('⏰ Monthly reward cleanup scheduled task running...');
    try {
      await resetMonthlyRewardsForAllUsers();
      console.log('✅ Monthly reward cleanup completed successfully');
    } catch (error) {
      console.error('❌ Monthly reward cleanup failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Adjust to your timezone
  });

  console.log('✅ Monthly reward cleanup cron job scheduled');
  console.log('   Schedule: 1st of every month at 00:01 AM');
  console.log('   Timezone: Asia/Kolkata');
  
  return task;
};

/**
 * For testing: Run cleanup immediately
 */
export const runCleanupNow = async () => {
  console.log('🔄 Running monthly reward cleanup manually...');
  try {
    const result = await resetMonthlyRewardsForAllUsers();
    return result;
  } catch (error) {
    console.error('❌ Manual cleanup failed:', error);
    throw error;
  }
};
