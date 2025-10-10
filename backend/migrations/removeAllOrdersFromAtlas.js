import mongoose from 'mongoose';
import Order from '../models/orderModel.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Database connection using the correct MongoDB URI
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('MONGO')));
      process.exit(1);
    }
    
    console.log('Connecting to MongoDB Atlas...');
    console.log('URI:', mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials
    
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Atlas connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const removeAllOrdersFromAtlas = async () => {
  try {
    await connectDB();

    console.log('\n=== REMOVING ALL ORDERS FROM MONGODB ATLAS ===');

    // Count existing orders before deletion
    const orderCount = await Order.countDocuments({});
    console.log(`Found ${orderCount} orders in MongoDB Atlas database`);

    if (orderCount === 0) {
      console.log('No orders found to delete');
      return;
    }

    // Show some sample orders before deletion
    console.log('\nSample orders before deletion:');
    const sampleOrders = await Order.find({}).limit(5).select('orderNumber deliveryLocation createdAt');
    for (const order of sampleOrders) {
      console.log(`- ${order.orderNumber} | Delivery: ${order.deliveryLocation} | Created: ${order.createdAt}`);
    }

    console.log('\n⚠️  WARNING: This will permanently delete ALL orders from MongoDB Atlas!');
    console.log('Proceeding with deletion...');

    // Delete all orders
    const result = await Order.deleteMany({});
    
    console.log(`✅ Successfully deleted ${result.deletedCount} orders from MongoDB Atlas`);

    // Verify deletion
    const remainingCount = await Order.countDocuments({});
    console.log(`Remaining orders: ${remainingCount}`);

    if (remainingCount === 0) {
      console.log('✅ All orders have been successfully removed from MongoDB Atlas');
    } else {
      console.log(`❌ Warning: ${remainingCount} orders still remain in the database`);
    }

    // Show all collections and their counts
    console.log('\nAll collections in the database:');
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const coll of collections) {
      const count = await mongoose.connection.db.collection(coll.name).countDocuments();
      console.log(`- ${coll.name}: ${count} documents`);
    }

  } catch (error) {
    console.error('❌ Error removing orders:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

removeAllOrdersFromAtlas();