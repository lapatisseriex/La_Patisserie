import mongoose from 'mongoose';
import 'dotenv/config';
import User from '../models/userModel.js';

/**
 * Script to show ALL users and their reward status
 * Categories: Eligible, Claimed (Used), In Progress
 */

const showAllRewardUsers = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get current month/year
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    // Find ALL users who have ordered at least once (have monthlyOrderDays)
    const allUsers = await User.find({
      'monthlyOrderDays.0': { $exists: true }
    }).select('email name monthlyOrderDays freeProductEligible freeProductUsed lastRewardMonth freeProductClaimHistory');

    console.log(`📊 Total users with order history: ${allUsers.length}\n`);

    // Categorize users
    const eligible = [];
    const used = [];
    const inProgress = [];

    allUsers.forEach(user => {
      // Count current month days only
      const currentMonthDays = user.monthlyOrderDays.filter(day => {
        const dayMonth = day.month;
        const dayYear = day.year;
        return dayMonth === currentMonth && dayYear === currentYear;
      });

      const uniqueDays = currentMonthDays.length;
      const daysRemaining = Math.max(0, 10 - uniqueDays);

      // Determine status
      if (user.freeProductEligible && !user.freeProductUsed) {
        // Eligible to claim
        eligible.push({
          user,
          currentDays: uniqueDays,
          daysRemaining
        });
      } else if (user.freeProductUsed || user.lastRewardMonth === currentMonthKey) {
        // Already claimed this month
        used.push({
          user,
          currentDays: uniqueDays,
          daysRemaining,
          lastClaim: user.freeProductClaimHistory?.[user.freeProductClaimHistory.length - 1]
        });
      } else if (uniqueDays > 0) {
        // In progress (has some days but not eligible yet)
        inProgress.push({
          user,
          currentDays: uniqueDays,
          daysRemaining
        });
      }
    });

    // Display Eligible Users
    console.log('🎉 ELIGIBLE USERS (Can claim now):');
    console.log('='.repeat(60));
    if (eligible.length === 0) {
      console.log('   No users eligible at the moment.\n');
    } else {
      eligible.forEach((item, index) => {
        console.log(`${index + 1}. ${item.user.name || 'Unknown'}`);
        console.log(`   Email: ${item.user.email}`);
        console.log(`   Current Days: ${item.currentDays}/10 ✅`);
        console.log(`   Status: ELIGIBLE - Can claim free product!`);
        console.log('');
      });
    }

    // Display Used/Claimed Users
    console.log('✅ CLAIMED USERS (Already used this month):');
    console.log('='.repeat(60));
    if (used.length === 0) {
      console.log('   No users have claimed yet this month.\n');
    } else {
      used.forEach((item, index) => {
        console.log(`${index + 1}. ${item.user.name || 'Unknown'}`);
        console.log(`   Email: ${item.user.email}`);
        console.log(`   Current Days: ${item.currentDays}/10`);
        console.log(`   Status: CLAIMED`);
        if (item.lastClaim) {
          console.log(`   Last Claim: ${item.lastClaim.productName} on ${new Date(item.lastClaim.claimedAt).toLocaleDateString()}`);
        }
        console.log(`   Total Claims: ${item.user.freeProductClaimHistory?.length || 0}`);
        console.log('');
      });
    }

    // Display In Progress Users
    console.log('📈 IN PROGRESS USERS (Working towards 10 days):');
    console.log('='.repeat(60));
    if (inProgress.length === 0) {
      console.log('   No users in progress.\n');
    } else {
      inProgress.forEach((item, index) => {
        console.log(`${index + 1}. ${item.user.name || 'Unknown'}`);
        console.log(`   Email: ${item.user.email}`);
        console.log(`   Current Days: ${item.currentDays}/10`);
        console.log(`   Days Remaining: ${item.daysRemaining}`);
        console.log(`   Progress: ${'█'.repeat(item.currentDays)}${'░'.repeat(item.daysRemaining)}`);
        console.log('');
      });
    }

    // Summary
    console.log('📊 SUMMARY:');
    console.log('='.repeat(60));
    console.log(`Total Users with Orders: ${allUsers.length}`);
    console.log(`Eligible (Can claim): ${eligible.length}`);
    console.log(`Claimed (Already used): ${used.length}`);
    console.log(`In Progress: ${inProgress.length}`);
    console.log(`Current Month: ${currentMonthKey}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  }
};

// Run the script
showAllRewardUsers();
