#!/usr/bin/env node

/**
 * Script to simulate order and test free product flow
 * Usage: node scripts/simulateOrderAndCheck.js <email>
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

// Import models and middleware
import User from '../models/userModel.js';
import { trackOrderDay } from '../middleware/freeProductMiddleware.js';

async function simulateOrderAndCheck(email) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      mongoose.connection.close();
      return;
    }

    console.log('📊 BEFORE Order:');
    console.log('  Email:', user.email);
    console.log('  Free Product Eligible:', user.freeProductEligible);
    console.log('  Free Product Used:', user.freeProductUsed);
    console.log('  Order Days:', user.monthlyOrderDays?.length || 0);
    console.log('  Last Reward Month:', user.lastRewardMonth);

    // Simulate order
    console.log('\n🔄 Simulating order...');
    const result = await trackOrderDay(user._id);
    
    console.log('\n📊 AFTER Order:');
    console.log('  Result:', result);
    
    // Fetch updated user
    const updatedUser = await User.findById(user._id);
    console.log('  Free Product Eligible:', updatedUser.freeProductEligible);
    console.log('  Free Product Used:', updatedUser.freeProductUsed);
    console.log('  Order Days:', updatedUser.monthlyOrderDays?.length || 0);
    console.log('  Last Reward Month:', updatedUser.lastRewardMonth);

    // Count unique days
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentMonthOrders = (updatedUser.monthlyOrderDays || []).filter(
      orderDay => orderDay.month === currentMonth && orderDay.year === currentYear
    );
    const uniqueDays = new Set(currentMonthOrders.map(od => new Date(od.date).getDate()));
    
    console.log('\n✅ Current Progress:');
    console.log('  Unique Days This Month:', uniqueDays.size);
    console.log('  Days Remaining:', Math.max(0, 10 - uniqueDays.size));
    console.log('  Is Eligible:', updatedUser.freeProductEligible);

    if (uniqueDays.size >= 10) {
      console.log('\n🎉 User is eligible for free product!');
    } else {
      console.log(`\n📈 Order on ${10 - uniqueDays.size} more days to unlock reward`);
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

// Get email from command line
const email = process.argv[2];
if (!email) {
  console.log('Usage: node scripts/simulateOrderAndCheck.js <email>');
  process.exit(1);
}

simulateOrderAndCheck(email);
