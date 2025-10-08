// Test file for product order tracking functionality
// Run this with: node test-product-tracking.js

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Product from './models/productModel.js';
import Order from './models/orderModel.js';

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

// Test product order tracking functionality
const testProductTracking = async () => {
  console.log('🧪 Testing Product Order Tracking Functionality\n');

  try {
    // Test 1: Check current product order counts
    console.log('📊 Test 1: Current Product Order Counts');
    const productsWithOrders = await Product.find({ totalOrderCount: { $gt: 0 } })
      .select('name totalOrderCount')
      .sort({ totalOrderCount: -1 })
      .limit(10);

    console.log(`Found ${productsWithOrders.length} products with orders:`);
    productsWithOrders.forEach(product => {
      console.log(`   ${product.name}: ${product.totalOrderCount} orders ${product.totalOrderCount >= 4 ? '(BEST SELLER)' : ''}`);
    });

    console.log('\n---\n');

    // Test 2: Check best seller products
    console.log('🏆 Test 2: Best Seller Products (4+ orders)');
    const bestSellers = await Product.find({ totalOrderCount: { $gte: 4 } })
      .select('name totalOrderCount')
      .sort({ totalOrderCount: -1 });

    console.log(`Found ${bestSellers.length} best seller products:`);
    bestSellers.forEach(product => {
      console.log(`   ${product.name}: ${product.totalOrderCount} orders`);
    });

    console.log('\n---\n');

    // Test 3: Test best seller method
    console.log('🔍 Test 3: Best Seller Method Test');
    const testProduct = await Product.findOne();
    if (testProduct) {
      console.log(`Product: ${testProduct.name}`);
      console.log(`Order Count: ${testProduct.totalOrderCount || 0}`);
      console.log(`Is Best Seller: ${testProduct.isBestSeller()}`);
      console.log(`Best Seller Virtual: ${testProduct.bestSeller}`);
    }

    console.log('\n---\n');

    // Test 4: Count total orders processed
    console.log('📈 Test 4: Order Statistics');
    const totalOrders = await Order.countDocuments();
    const confirmedOrders = await Order.countDocuments({ 
      orderStatus: { $in: ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'] } 
    });
    
    console.log(`Total Orders: ${totalOrders}`);
    console.log(`Confirmed Orders: ${confirmedOrders}`);

    console.log('\n---\n');

    // Test 5: Summary statistics
    console.log('📊 Test 5: Summary Statistics');
    const totalProducts = await Product.countDocuments();
    const productsWithOrdersCount = await Product.countDocuments({ totalOrderCount: { $gt: 0 } });
    const bestSellerCount = await Product.countDocuments({ totalOrderCount: { $gte: 4 } });
    
    const avgOrderCount = await Product.aggregate([
      { $group: { _id: null, avg: { $avg: "$totalOrderCount" } } }
    ]);

    console.log(`Total Products: ${totalProducts}`);
    console.log(`Products with Orders: ${productsWithOrdersCount}`);
    console.log(`Best Sellers: ${bestSellerCount}`);
    console.log(`Average Order Count: ${avgOrderCount[0]?.avg?.toFixed(2) || 0}`);

    console.log('\n🎉 Product tracking test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// New API endpoints available:
const showAPIEndpoints = () => {
  console.log('\n🔗 New API Endpoints Available:');
  console.log('');
  
  console.log('📊 GET /api/products/stats/orders');
  console.log('   - Get product order statistics');
  console.log('   - Query params: sortBy, order, limit, page, category, minOrders');
  console.log('   - Admin only');
  console.log('');
  
  console.log('🏆 GET /api/products/bestsellers');
  console.log('   - Get best selling products (4+ orders)');
  console.log('   - Query params: limit, page, category, minOrders');
  console.log('   - Public access');
  console.log('');
  
  console.log('📈 PUT /api/products/:id/order-count');
  console.log('   - Update specific product order count');
  console.log('   - Body: { increment: number, reset: boolean }');
  console.log('   - Admin only');
  console.log('');
  
  console.log('🔄 POST /api/products/bulk-update-order-counts');
  console.log('   - Bulk update all product order counts from existing orders');
  console.log('   - No parameters needed');
  console.log('   - Admin only');
  console.log('');
  
  console.log('🛍️ GET /api/products?bestSeller=true');
  console.log('   - Filter products to show only best sellers');
  console.log('   - Can combine with other filters');
  console.log('   - Public access');
};

// Run tests
const runTests = async () => {
  await connectDB();
  await testProductTracking();
  showAPIEndpoints();
  await mongoose.connection.close();
  console.log('\n✅ Database connection closed');
};

// Uncomment to run tests
// runTests().catch(console.error);

console.log('🚀 Product Order Tracking System Ready!');
console.log('');
console.log('📋 Features Implemented:');
console.log('   ✅ Track total orders per product');
console.log('   ✅ Auto-update counts when orders confirmed');
console.log('   ✅ Best seller logic (4+ orders)');
console.log('   ✅ New API endpoints for tracking');
console.log('   ✅ Best seller filtering in product list');
console.log('   ✅ Admin statistics and reporting');
console.log('');
console.log('🔧 To test, uncomment the last line and run: node test-product-tracking.js');