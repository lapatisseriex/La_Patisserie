import Product from '../models/productModel.js';
import Category from '../models/categoryModel.js';

/**
 * Get the most recent products and update their associated category images for special categories
 */
export const updateDynamicCategoryImages = async () => {
  try {
    // Get the most recently added product (for "Newly Launched" category)
    const newestProduct = await Product.findOne({ isActive: true })
      .sort('-createdAt')
      .populate('category');
    
    // Get the highest rated product (for "Best Sellers" category)
    const bestSellerProduct = await Product.findOne({ isActive: true })
      .sort('-rating')
      .populate('category');
    
    const updates = {
      newlyLaunched: {
        productId: newestProduct?._id,
        categoryId: newestProduct?.category?._id,
        categoryImage: newestProduct?.category?.images?.[0]
      },
      bestSeller: {
        productId: bestSellerProduct?._id,
        categoryId: bestSellerProduct?.category?._id,
        categoryImage: bestSellerProduct?.category?.images?.[0]
      }
    };
    
    return updates;
  } catch (error) {
    console.error('Error updating dynamic category images:', error);
    return null;
  }
};

/**
 * Get dynamic category images for frontend display
 * Returns the category images for "Newly Launched" and "Best Sellers" based on top products
 */
export const getDynamicCategoryImages = async () => {
  return await updateDynamicCategoryImages();
};