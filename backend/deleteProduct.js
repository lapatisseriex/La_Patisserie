import mongoose from 'mongoose';
import Product from './models/productModel.js';
import dotenv from 'dotenv';

dotenv.config();

const deleteProductById = async (productId) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');

    // Find and delete the product
    const product = await Product.findOne({ id: productId });
    
    if (!product) {
      console.log(`❌ Product with ID "${productId}" not found in database`);
    } else {
      console.log(`Found product: ${product.name} (ID: ${product.id})`);
      await Product.deleteOne({ id: productId });
      console.log(`✅ Successfully deleted product with ID "${productId}"`);
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

// Get product ID from command line argument
const productId = process.argv[2];

if (!productId) {
  console.log('Usage: node deleteProduct.js <PRODUCT_ID>');
  console.log('Example: node deleteProduct.js TIRAM-007');
  process.exit(1);
}

deleteProductById(productId);
