/**
 * Script to check and fix free product cart state
 * Usage: node scripts/checkFreeProductCart.js <email>
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

// Import models
import User from '../models/userModel.js';
import NewCart from '../models/newCartModel.js';
import Product from '../models/productModel.js';

async function checkAndFixCart(email) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('\n📊 User Status:');
    console.log('  Email:', email);
    console.log('  Free Product Eligible:', user.freeProductEligible);
    console.log('  Selected Free Product ID:', user.selectedFreeProductId);
    console.log('  Free Product Used:', user.freeProductUsed);
    console.log('  Order Days This Month:', user.monthlyOrderDays.length);

    // Find cart
    const cart = await NewCart.findOne({ userId: user._id });
    if (!cart || cart.items.length === 0) {
      console.log('\n🛒 Cart is empty');
      mongoose.connection.close();
      process.exit(0);
    }

    console.log('\n🛒 Cart Items:');
    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      console.log(`  - ${product?.name || 'Unknown Product'}`);
      console.log(`    Product ID: ${item.productId}`);
      console.log(`    Quantity: ${item.quantity}`);
      console.log(`    Is Free Product: ${item.isFreeProduct}`);
      console.log(`    Price: ₹${item.productDetails?.price || 0}`);
    }

    console.log('\n💰 Cart Totals:');
    console.log('  Cart Total:', cart.cartTotal);
    console.log('  Cart Count:', cart.cartCount);

    // Check if there's a mismatch
    const hasFreeProduct = cart.items.some(item => item.isFreeProduct);
    if (hasFreeProduct && !user.selectedFreeProductId) {
      console.log('\n⚠️  WARNING: Cart has free product but user.selectedFreeProductId is not set');
      console.log('   Fixing...');
      
      const freeItem = cart.items.find(item => item.isFreeProduct);
      user.selectedFreeProductId = freeItem.productId;
      await user.save();
      console.log('   ✅ Fixed!');
    }

    if (!hasFreeProduct && user.selectedFreeProductId) {
      console.log('\n⚠️  WARNING: User has selectedFreeProductId but no free product in cart');
      console.log('   Fixing...');
      
      user.selectedFreeProductId = null;
      await user.save();
      console.log('   ✅ Fixed!');
    }

    console.log('\n✅ All checks complete');
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
  console.log('Usage: node scripts/checkFreeProductCart.js <email>');
  process.exit(1);
}

checkAndFixCart(email);
