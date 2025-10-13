import mongoose from 'mongoose';
import Product from './models/productModel.js';
import dotenv from 'dotenv';

dotenv.config();

const listTiramisuProducts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');

    // Find all products with IDs starting with "TIRAM"
    const products = await Product.find({ 
      id: { $regex: /^TIRAM/i } 
    }).select('id name category').sort('id');
    
    if (products.length === 0) {
      console.log('❌ No Tiramisu products found');
    } else {
      console.log(`\n✅ Found ${products.length} Tiramisu products:\n`);
      products.forEach(product => {
        console.log(`  • ${product.id} - ${product.name}`);
      });
      console.log('\n');
    }

    // Disconnect
    await mongoose.disconnect();
    console.log('Database disconnected');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

listTiramisuProducts();
