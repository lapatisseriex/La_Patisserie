// Test script to verify hostelName functionality
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './backend/.env' });

// Import Order model
import Order from './backend/models/orderModel.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test hostelName functionality
const testHostelName = async () => {
  await connectDB();
  
  console.log('\n🧪 Testing hostelName functionality...\n');
  
  // Create a test order with hostelName
  const testOrder = new Order({
    orderNumber: `TEST-${Date.now()}`,
    userId: new mongoose.Types.ObjectId(),
    amount: 100,
    currency: 'INR',
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    orderStatus: 'placed',
    cartItems: [{
      productId: new mongoose.Types.ObjectId(),
      productName: 'Test Cake',
      quantity: 1,
      price: 100,
      variantIndex: 0
    }],
    userDetails: {
      name: 'Test User',
      email: 'test@example.com',
      phone: '1234567890',
      city: 'Test City',
      pincode: '123456',
      country: 'India'
    },
    deliveryLocation: 'Test Location',
    hostelName: 'Test Hostel ABC', // This is the key field we're testing
    orderSummary: {
      cartTotal: 100,
      discountedTotal: 100,
      deliveryCharge: 0,
      freeCashDiscount: 0,
      grandTotal: 100
    },
    estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000)
  });
  
  try {
    // Save the order
    await testOrder.save();
    console.log('✅ Test order created successfully!');
    console.log('📋 Order ID:', testOrder._id);
    console.log('🏨 Hostel Name stored:', testOrder.hostelName);
    
    // Retrieve the order to verify hostelName was saved
    const retrievedOrder = await Order.findById(testOrder._id);
    console.log('🔄 Retrieved order hostelName:', retrievedOrder.hostelName);
    
    if (retrievedOrder.hostelName === 'Test Hostel ABC') {
      console.log('🎉 SUCCESS: hostelName is being stored and retrieved correctly!');
    } else {
      console.log('❌ FAILURE: hostelName not stored correctly');
    }
    
    // Clean up test order
    await Order.findByIdAndDelete(testOrder._id);
    console.log('🧹 Test order cleaned up');
    
  } catch (error) {
    console.error('❌ Error creating test order:', error);
  }
  
  // Close the connection
  await mongoose.connection.close();
  console.log('\n✅ Test completed and database connection closed');
};

// Run the test
testHostelName().catch(console.error);