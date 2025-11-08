import mongoose from 'mongoose';
import 'dotenv/config';
import User from '../models/userModel.js';

/**
 * Script to set up a test user with different reward statuses
 * This simulates a user with various reward states for testing
 * 
 * Usage:
 *   node setupFreeProductTest.js user@example.com eligible  (10 days, can claim)
 *   node setupFreeProductTest.js user@example.com claimed   (10 days, already claimed)
 *   node setupFreeProductTest.js user@example.com progress 5  (5 days, in progress)
 */

const setupTestUser = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get user email and status from command line
    const userEmail = process.argv[2];
    const status = process.argv[3] || 'eligible'; // eligible, claimed, progress
    const customDays = parseInt(process.argv[4]) || 10;
    
    if (!userEmail) {
      console.error('❌ Please provide a user email as argument');
      console.log('Usage: node setupFreeProductTest.js user@example.com [status] [days]');
      console.log('  status: eligible, claimed, or progress (default: eligible)');
      console.log('  days: number of order days 1-10 (default: 10)');
      console.log('\nExamples:');
      console.log('  node setupFreeProductTest.js user@example.com eligible');
      console.log('  node setupFreeProductTest.js user@example.com claimed');
      console.log('  node setupFreeProductTest.js user@example.com progress 5');
      process.exit(1);
    }

    // Find the user
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.error(`❌ User with email "${userEmail}" not found`);
      process.exit(1);
    }

    console.log(`\n📧 Found user: ${user.name || user.email}`);
    console.log(`User ID: ${user._id}`);
    console.log(`Setting up status: ${status.toUpperCase()}`);

    // Get current date
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();
    const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    // Determine number of days based on status
    let numDays = customDays;
    if (status === 'eligible' || status === 'claimed') {
      numDays = 10; // Must have 10 days for these statuses
    } else if (status === 'progress') {
      numDays = Math.min(Math.max(1, customDays), 9); // 1-9 days for in-progress
    }

    // Create order days (last N days)
    const orderDays = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - i);
      
      orderDays.push({
        date: orderDate,
        month: orderDate.getMonth() + 1,
        year: orderDate.getFullYear()
      });
    }

    // Update the user based on status
    user.monthlyOrderDays = orderDays;

    if (status === 'eligible') {
      // Eligible to claim
      user.freeProductEligible = true;
      user.freeProductUsed = false;
      user.lastRewardMonth = null;
      user.selectedFreeProductId = null;
      console.log('   → User set to ELIGIBLE status (can claim)');
      
    } else if (status === 'claimed') {
      // Already claimed this month
      user.freeProductEligible = false;
      user.freeProductUsed = true;
      user.lastRewardMonth = currentMonthKey;
      user.selectedFreeProductId = null;
      
      // Add a claim to history if not already present
      if (!user.freeProductClaimHistory) {
        user.freeProductClaimHistory = [];
      }
      
      // Check if there's already a claim for this month
      const hasClaimThisMonth = user.freeProductClaimHistory.some(
        claim => claim.month === currentMonthKey
      );
      
      if (!hasClaimThisMonth) {
        user.freeProductClaimHistory.push({
          productId: 'test-product-123',
          productName: 'Test Free Product',
          month: currentMonthKey,
          claimedAt: new Date()
        });
      }
      console.log('   → User set to CLAIMED status (already used this month)');
      
    } else if (status === 'progress') {
      // In progress (has some days but not eligible yet)
      user.freeProductEligible = false;
      user.freeProductUsed = false;
      user.lastRewardMonth = null;
      user.selectedFreeProductId = null;
      console.log(`   → User set to IN PROGRESS status (${numDays} days)`);
    }

    await user.save();

    console.log('\n✅ User updated successfully!');
    console.log('\n📊 User Status:');
    console.log(`   - Monthly Order Days: ${user.monthlyOrderDays.length}`);
    console.log(`   - Free Product Eligible: ${user.freeProductEligible ? '✅ YES' : '❌ NO'}`);
    console.log(`   - Free Product Used: ${user.freeProductUsed ? 'Yes' : 'No'}`);
    console.log(`   - Last Reward Month: ${user.lastRewardMonth || 'None'}`);
    console.log(`   - Total Claims: ${user.freeProductClaimHistory?.length || 0}`);
    
    console.log('\n📅 Order Days:');
    user.monthlyOrderDays.forEach((day, index) => {
      console.log(`   ${index + 1}. ${new Date(day.date).toLocaleDateString()}`);
    });

    if (status === 'eligible') {
      console.log('\n🎉 User is now ELIGIBLE for a FREE product!');
      console.log('💡 Go to the cart page to see the eligibility banner.');
    } else if (status === 'claimed') {
      console.log('\n✅ User has CLAIMED their free product this month!');
      console.log('💡 They need to wait until next month to claim again.');
    } else if (status === 'progress') {
      const remaining = 10 - numDays;
      console.log(`\n📈 User is IN PROGRESS (${numDays}/10 days)`);
      console.log(`💡 They need ${remaining} more order day${remaining > 1 ? 's' : ''} to become eligible.`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  }
};

// Run the script
setupTestUser();
