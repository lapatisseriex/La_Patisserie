import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/userModel.js';

const testCleanup = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    
    // Find users with claim history
    const usersWithClaims = await User.find({
      'freeProductClaimHistory.0': { $exists: true }
    }).select('email name freeProductClaimHistory');

    console.log(`📊 Found ${usersWithClaims.length} users with claim history\n`);

    console.log('📋 Current Claim History BEFORE Cleanup:');
    console.log('='.repeat(80));
    
    usersWithClaims.forEach(user => {
      console.log(`\n👤 User: ${user.name || 'N/A'} (${user.email})`);
      console.log(`   Claims: ${user.freeProductClaimHistory.length}`);
      user.freeProductClaimHistory.forEach((claim, index) => {
        console.log(`   ${index + 1}. Month: ${claim.month} - ${claim.productName} (${new Date(claim.claimedAt).toLocaleDateString()})`);
      });
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n🧹 Running Cleanup...\n');

    // Run the cleanup - remove all claims NOT from current month
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

    console.log(`✅ Cleanup Results:`);
    console.log(`   - Current Month: ${currentMonthKey}`);
    console.log(`   - Users Modified: ${result.modifiedCount}`);
    console.log(`   - Matched Users: ${result.matchedCount}\n`);

    // Get updated data
    const usersAfterCleanup = await User.find({
      'freeProductClaimHistory.0': { $exists: true }
    }).select('email name freeProductClaimHistory');

    console.log('📋 Claim History AFTER Cleanup:');
    console.log('='.repeat(80));
    
    if (usersAfterCleanup.length === 0) {
      console.log('\n✨ No users with claim history remaining (all old claims removed!)');
    } else {
      usersAfterCleanup.forEach(user => {
        console.log(`\n👤 User: ${user.name || 'N/A'} (${user.email})`);
        console.log(`   Claims: ${user.freeProductClaimHistory.length}`);
        user.freeProductClaimHistory.forEach((claim, index) => {
          console.log(`   ${index + 1}. Month: ${claim.month} - ${claim.productName} (${new Date(claim.claimedAt).toLocaleDateString()})`);
        });
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n📊 Summary:');
    console.log(`   Before: ${usersWithClaims.reduce((sum, u) => sum + u.freeProductClaimHistory.length, 0)} total claims`);
    console.log(`   After: ${usersAfterCleanup.reduce((sum, u) => sum + u.freeProductClaimHistory.length, 0)} total claims`);
    console.log(`   Removed: ${usersWithClaims.reduce((sum, u) => sum + u.freeProductClaimHistory.length, 0) - usersAfterCleanup.reduce((sum, u) => sum + u.freeProductClaimHistory.length, 0)} old claims`);

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

testCleanup();
