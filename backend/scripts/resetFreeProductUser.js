/**
 * Script to clear cart and reset free product state
 * Usage: node scripts/resetFreeProductTest.js <email>
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

async function resetCart(email) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('\n📊 Before Reset:');
    console.log('  Free Product Eligible:', user.freeProductEligible);
    console.log('  Selected Free Product ID:', user.selectedFreeProductId);
    console.log('  Free Product Used:', user.freeProductUsed);

    // Find and clear cart
    const cart = await NewCart.findOne({ userId: user._id });
    if (cart) {
      console.log('  Cart Items:', cart.items.length);
      cart.items.forEach((item, i) => {
        console.log(`    Item ${i + 1}: ${item.productId}, isFreeProduct: ${item.isFreeProduct}`);
      });
      
      // Clear all cart items
      cart.items = [];
      await cart.save();
      console.log('\n✅ Cart cleared');
    } else {
      console.log('  No cart found');
    }

    // Reset user's selected free product
    user.selectedFreeProductId = null;
    await user.save();
    console.log('✅ User selectedFreeProductId reset');

    console.log('\n📊 After Reset:');
    console.log('  Free Product Eligible:', user.freeProductEligible);
    console.log('  Selected Free Product ID:', user.selectedFreeProductId);
    console.log('  Cart Items: 0');

    console.log('\n✅ Ready to test! User is still eligible for free product.');
    console.log('   Go to the website and try adding a free product again.');

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
  console.log('Usage: node scripts/resetFreeProductTest.js <email>');
  process.exit(1);
}

resetCart(email);
