// Migration script to update existing products with correct discount calculations
// Run this script to fix existing products with hardcoded discounts

import mongoose from 'mongoose';
import Product from '../models/productModel.js';
import dotenv from 'dotenv';

dotenv.config();

const updateProductDiscounts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all products
    const products = await Product.find({});
    console.log(`Found ${products.length} products to update`);

    let updatedCount = 0;

    for (const product of products) {
      let needsUpdate = false;

      // Update each variant
      for (let i = 0; i < product.variants.length; i++) {
        const variant = product.variants[i];
        
        // Check if variant has discount but no proper discount settings
        if (variant.price && !variant.discount?.type) {
          // If the price seems to be a discounted price (like 110), 
          // and we want to set it as the base price with no discount
          console.log(`Updating variant ${i} of product ${product.name}`);
          
          // Clear any implicit discount by ensuring discount is properly set
          variant.discount = {
            type: null,
            value: 0
          };
          
          needsUpdate = true;
        }
        
        // Initialize pricing calculator fields if they don't exist
        if (variant.costPrice === undefined) variant.costPrice = 0;
        if (variant.profitWanted === undefined) variant.profitWanted = 0;
        if (variant.freeCashExpected === undefined) variant.freeCashExpected = 0;
      }

      if (needsUpdate) {
        await product.save();
        updatedCount++;
        console.log(`Updated product: ${product.name}`);
      }
    }

    console.log(`Successfully updated ${updatedCount} products`);
    
  } catch (error) {
    console.error('Error updating products:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the migration
updateProductDiscounts();