import asyncHandler from 'express-async-handler';
import { getDynamicCategoryImages } from '../utils/dynamicCategories.js';
import { cache } from '../utils/cache.js';

// @desc    Get dynamic category images based on top products
// @route   GET /api/dynamic-categories
// @access  Public
export const getDynamicCategories = asyncHandler(async (req, res) => {
  const cacheKey = 'dynamic-categories';
  
  // Check if we have cached data (cache for 5 minutes)
  const cachedData = cache.get(cacheKey);
  
  if (cachedData) {
    console.log('Using cached dynamic category data');
    return res.status(200).json(cachedData);
  }
  
  console.log('Cache miss for dynamic categories, fetching from database');
  
  // Get dynamic category images
  const dynamicCategories = await getDynamicCategoryImages();
  
  if (!dynamicCategories) {
    res.status(500);
    throw new Error('Failed to get dynamic category images');
  }
  
  // Cache the data for 5 minutes (300 seconds)
  cache.set(cacheKey, dynamicCategories, 300);
  
  res.status(200).json(dynamicCategories);
});