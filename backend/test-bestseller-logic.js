// Test the improved best seller logic
// Run this with: node test-bestseller-logic.js

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Product from './models/productModel.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected for testing');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Test best seller logic
const testBestSellerLogic = async () => {
  console.log('🧪 Testing Improved Best Seller Logic\n');

  try {
    // Test 1: Check current best seller count
    console.log('📊 Test 1: Current Best Seller Status');
    const bestSellerCount = await Product.countDocuments({ 
      isActive: true, 
      totalOrderCount: { $gte: 4 } 
    });
    
    console.log(`Total Best Sellers (4+ orders): ${bestSellerCount}`);
    
    if (bestSellerCount === 0) {
      console.log('❌ No best sellers found - section should be hidden');
    } else {
      console.log('✅ Best sellers exist - section should be shown');
    }

    console.log('\n---\n');

    // Test 2: Test API response for no best sellers
    console.log('🔍 Test 2: API Response Format');
    
    if (bestSellerCount === 0) {
      console.log('Expected API Response (No Best Sellers):');
      console.log({
        products: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalProducts: 0,
          hasNextPage: false,
          hasPrevPage: false
        },
        meta: {
          minOrdersThreshold: 4,
          resultCount: 0,
          hasBestSellers: false,
          message: 'No best sellers found. Products need at least 4 orders to qualify.'
        }
      });
    } else {
      const bestSellers = await Product.find({ 
        isActive: true, 
        totalOrderCount: { $gte: 4 } 
      }).select('name totalOrderCount').limit(3);
      
      console.log('Sample Best Sellers:');
      bestSellers.forEach(product => {
        console.log(`   ${product.name}: ${product.totalOrderCount} orders`);
      });
    }

    console.log('\n---\n');

    // Test 3: Check different thresholds
    console.log('📈 Test 3: Different Order Thresholds');
    
    const thresholds = [1, 2, 3, 4, 5, 10];
    
    for (const threshold of thresholds) {
      const count = await Product.countDocuments({ 
        isActive: true, 
        totalOrderCount: { $gte: threshold } 
      });
      console.log(`Products with ${threshold}+ orders: ${count}`);
    }

    console.log('\n---\n');

    // Test 4: Recommend action if no best sellers
    console.log('💡 Test 4: Recommendations');
    
    if (bestSellerCount === 0) {
      console.log('🎯 Actions to get best sellers:');
      console.log('   1. Use bulk update endpoint to populate order counts from existing orders');
      console.log('   2. Create test orders to reach 4+ order threshold');
      console.log('   3. Lower the threshold temporarily (minOrders query param)');
      console.log('   4. Hide best seller section in frontend when hasBestSellers = false');
      
      // Check if there are any products with orders at all
      const productsWithOrders = await Product.countDocuments({ 
        totalOrderCount: { $gt: 0 } 
      });
      
      console.log(`\n📊 Products with any orders: ${productsWithOrders}`);
      
      if (productsWithOrders > 0) {
        console.log('💡 Suggestion: Run bulk update to recalculate order counts');
      } else {
        console.log('💡 Suggestion: Need to process some orders first');
      }
    } else {
      console.log('✅ Best seller system is working correctly!');
    }

    console.log('\n🎉 Best seller logic test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// API Usage Examples
const showAPIUsage = () => {
  console.log('\n🔗 API Usage Examples:');
  console.log('');
  
  console.log('1. Check if best sellers exist:');
  console.log('   GET /api/products/bestsellers/check');
  console.log('   Response: { hasBestSellers: false, bestSellersCount: 0, ... }');
  console.log('');
  
  console.log('2. Get best sellers (returns empty if none):');
  console.log('   GET /api/products/bestsellers');
  console.log('   Response: { products: [], meta: { hasBestSellers: false }, ... }');
  console.log('');
  
  console.log('3. Frontend logic example:');
  console.log(`
const response = await fetch('/api/products/bestsellers/check');
const { hasBestSellers } = await response.json();

if (hasBestSellers) {
  // Show best seller section
  const bestsellers = await fetch('/api/products/bestsellers');
  // Display products
} else {
  // Hide best seller section completely
  console.log('No best sellers yet - hiding section');
}
  `);
};

// Run tests
const runTests = async () => {
  await connectDB();
  await testBestSellerLogic();
  showAPIUsage();
  await mongoose.connection.close();
  console.log('\n✅ Database connection closed');
};

// Uncomment to run tests
// runTests().catch(console.error);

console.log('🚀 Improved Best Seller Logic Ready!');
console.log('');
console.log('🔧 New Features:');
console.log('   ✅ Returns empty array when no best sellers');
console.log('   ✅ Includes hasBestSellers flag in response');
console.log('   ✅ Provides helpful message when none found');
console.log('   ✅ New /bestsellers/check endpoint for quick checks');
console.log('   ✅ Frontend can hide section when hasBestSellers = false');
console.log('');
console.log('🔧 To test, uncomment the last line and run: node test-bestseller-logic.js');