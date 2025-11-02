import mongoose from 'mongoose';
import 'dotenv/config';
import User from '../models/userModel.js';

/**
 * Script to set up a test user with 10 order days for free product eligibility
 * This simulates a user who has ordered on 10 different days in the current month
 */

const setupTestUser = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get user email from command line or use a default
    const userEmail = process.argv[2];
    
    if (!userEmail) {
      console.error('❌ Please provide a user email as argument');
      console.log('Usage: node setupFreeProductTest.js user@example.com');
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

    // Get current date
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();
    const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    // Create 10 order days (last 10 days)
    const orderDays = [];
    for (let i = 9; i >= 0; i--) {
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - i);
      
      orderDays.push({
        date: orderDate,
        month: orderDate.getMonth() + 1,
        year: orderDate.getFullYear()
      });
    }

    // Update the user
    user.monthlyOrderDays = orderDays;
    user.freeProductEligible = true;
    user.lastRewardMonth = currentMonthKey;
    user.freeProductUsed = false;
    user.selectedFreeProductId = null;

    await user.save();

    console.log('\n✅ User updated successfully!');
    console.log('\n📊 User Status:');
    console.log(`   - Monthly Order Days: ${user.monthlyOrderDays.length}`);
    console.log(`   - Free Product Eligible: ${user.freeProductEligible ? '✅ YES' : '❌ NO'}`);
    console.log(`   - Last Reward Month: ${user.lastRewardMonth}`);
    console.log(`   - Free Product Used: ${user.freeProductUsed ? 'Yes' : 'No'}`);
    
    console.log('\n📅 Order Days:');
    user.monthlyOrderDays.forEach((day, index) => {
      console.log(`   ${index + 1}. ${new Date(day.date).toLocaleDateString()}`);
    });

    console.log('\n🎉 User is now eligible for a FREE product!');
    console.log('💡 Go to the cart page to see the eligibility banner.');

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
