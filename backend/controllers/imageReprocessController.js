import asyncHandler from 'express-async-handler';
import Category from '../models/categoryModel.js';
import { removeBackground } from '../utils/backgroundRemoval.js';

// @desc    Reprocess all images for a specific category
// @route   POST /api/categories/:id/reprocess-images
// @access  Admin only
export const reprocessCategoryImages = asyncHandler(async (req, res) => {
  const categoryId = req.params.id;
  
  // Find the category
  const category = await Category.findById(categoryId);
  
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  
  // Get current images
  const currentImages = [...category.images];
  let processedImages = [];
  
  // No images to process
  if (currentImages.length === 0) {
    res.status(200).json({ 
      message: 'No images to process',
      category
    });
    return;
  }
  
  console.log(`Reprocessing ${currentImages.length} images for category: ${category.name}`);
  
  try {
    // Check if images already have been processed (contain "/processed/" in the URL)
    const imagesToProcess = currentImages.filter(url => !url.includes('/processed/'));
    
    if (imagesToProcess.length === 0) {
      console.log(`No unprocessed images found for category: ${category.name}`);
      res.status(200).json({ 
        message: 'All images already processed',
        category
      });
      return;
    }
    
    console.log(`Found ${imagesToProcess.length} images to process for category: ${category.name}`);
    
    // Process only images that haven't been processed yet
    const newProcessedImages = await Promise.all(
      imagesToProcess.map(async (imageUrl) => {
        console.log(`Reprocessing image: ${imageUrl}`);
        return await removeBackground(imageUrl);
      })
    );
    
    // Create a mapping of original URLs to processed URLs
    const processedMap = {};
    imagesToProcess.forEach((originalUrl, index) => {
      processedMap[originalUrl] = newProcessedImages[index];
    });
    
    // Update only the images that needed processing
    const updatedImages = currentImages.map(url => 
      processedMap[url] || url
    );
    
    // Update the category with processed images
    category.images = updatedImages;
    await category.save();
    
    console.log('Background removal complete for all images');
    
    res.status(200).json({
      message: `Successfully reprocessed ${processedImages.length} images`,
      category
    });
  } catch (error) {
    console.error('Error reprocessing images:', error);
    res.status(500);
    throw new Error(`Failed to reprocess images: ${error.message}`);
  }
});