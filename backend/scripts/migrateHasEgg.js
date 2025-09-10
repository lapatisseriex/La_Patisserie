import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/productModel.js';

// Load environment variables
dotenv.config();

const migrateHasEgg = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update all products to have hasEgg field set to false if it doesn't exist
    const result = await Product.updateMany(
      { hasEgg: { $exists: false } }, // Find products without hasEgg field
      { $set: { hasEgg: false } }     // Set hasEgg to false
    );

    console.log(`Updated ${result.modifiedCount} products with hasEgg field`);

    // Close the connection
    await mongoose.connection.close();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateHasEgg();
