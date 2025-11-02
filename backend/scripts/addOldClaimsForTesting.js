import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/userModel.js';

const addOldClaims = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const testEmail = 'angokul88@gmail.com';
    
    const user = await User.findOne({ email: testEmail });
    if (!user) {
      console.log('❌ User not found:', testEmail);
      process.exit(1);
    }

    console.log(`👤 Found user: ${user.name} (${user.email})\n`);

    // Add old claims from previous months for testing
    const oldClaims = [
      {
        productId: new mongoose.Types.ObjectId(),
        productName: 'October Product',
        claimedAt: new Date('2025-10-15'),
        month: '2025-10',
        orderNumber: 'ORD-2025-OCT',
        orderDaysAtClaim: 10
      },
      {
        productId: new mongoose.Types.ObjectId(),
        productName: 'September Product',
        claimedAt: new Date('2025-09-20'),
        month: '2025-09',
        orderNumber: 'ORD-2025-SEP',
        orderDaysAtClaim: 12
      },
      {
        productId: new mongoose.Types.ObjectId(),
        productName: 'August Product',
        claimedAt: new Date('2025-08-10'),
        month: '2025-08',
        orderNumber: 'ORD-2025-AUG',
        orderDaysAtClaim: 11
      }
    ];

    // Add old claims to the array
    user.freeProductClaimHistory.push(...oldClaims);
    await user.save();

    console.log('✅ Added old claims for testing:');
    oldClaims.forEach((claim, index) => {
      console.log(`   ${index + 1}. ${claim.month} - ${claim.productName}`);
    });

    console.log(`\n📊 Total claims now: ${user.freeProductClaimHistory.length}`);
    
    console.log('\n📋 All Claims:');
    user.freeProductClaimHistory.forEach((claim, index) => {
      console.log(`   ${index + 1}. Month: ${claim.month} - ${claim.productName} (${new Date(claim.claimedAt).toLocaleDateString()})`);
    });

    console.log('\n✅ Test data added successfully!');
    console.log('💡 Now run: node scripts/testCleanup.js');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

addOldClaims();
