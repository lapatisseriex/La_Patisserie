import mongoose from 'mongoose';
import Order from '../models/orderModel.js';

// Test different possible database connections
const testConnections = [
  {
    name: 'Environment MONGODB_URI',
    uri: "mongodb+srv://lapatisseriex:laPatisseriex123.@cluster0.krvx65a.mongodb.net/test?retryWrites=true&w=majority"
  },
];

const checkDatabase = async (connectionInfo) => {
  try {
    console.log(`\n=== Testing: ${connectionInfo.name} ===`);
    
    if (!connectionInfo.uri) {
      console.log('❌ URI not available');
      return;
    }

    console.log(`URI: ${connectionInfo.uri}`);
    
    // Connect to the database
    await mongoose.connect(connectionInfo.uri);
    console.log('✅ Connected successfully');

    // Check orders count
    const orderCount = await Order.countDocuments({});
    console.log(`📊 Orders found: ${orderCount}`);

    // If orders found, show full data
    if (orderCount > 0) {
      const sampleOrders = await Order.find({}).limit(3); // fetch all fields
      console.log('\n=== Full Sample Order Data (First 3) ===');
      for (const [index, order] of sampleOrders.entries()) {
        console.log(`\n🧾 Order #${index + 1}`);
        console.log(JSON.stringify(order, null, 2)); // Pretty-print full object
      }

      // Check deliveryLocation structure
      const orderWithPopulated = await Order.findOne({}).populate('deliveryLocation');
      if (orderWithPopulated) {
        console.log(`\n=== Delivery Location Details (Populated) ===`);
        console.log(`Type: ${typeof orderWithPopulated.deliveryLocation}`);
        console.log(`Value:`, JSON.stringify(orderWithPopulated.deliveryLocation, null, 2));
      }
    } else {
      console.log('No orders found.');
    }

    // List all collections in this database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n📚 Collections in database:`);
    for (const coll of collections) {
      const count = await mongoose.connection.db.collection(coll.name).countDocuments();
      console.log(`- ${coll.name}: ${count} documents`);
    }

    await mongoose.connection.close();
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    try {
      await mongoose.connection.close();
    } catch {
      // ignore close errors
    }
  }
};


const findOrders = async () => {
  console.log('🔍 SEARCHING FOR YOUR 40 ORDERS...\n');
  
  for (const connectionInfo of testConnections) {
    await checkDatabase(connectionInfo);
    
    // Add a small delay between connections
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n=== SEARCH COMPLETE ===');
  console.log('If none of the above databases contain your 40 orders, please check:');
  console.log('1. Your actual MongoDB connection string');
  console.log('2. Whether you\'re using MongoDB Atlas or a different host');
  console.log('3. Different database names in your application');
};

findOrders();