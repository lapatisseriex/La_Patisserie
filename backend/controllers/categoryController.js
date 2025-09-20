import asyncHandler from 'express-async-handler';
import Category from '../models/categoryModel.js';
import Product from '../models/productModel.js';
import { deleteFromCloudinary, getPublicIdFromUrl } from '../utils/cloudinary.js';
import { cache } from '../utils/cache.js';
import { removeBackground } from '../utils/backgroundRemoval.js';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = asyncHandler(async (req, res) => {
  // Filter options
  const filter = {};
  
  // Add isActive filter if specified
  if (req.query.isActive !== undefined) {
    // If isActive query param is explicitly 'all', don't filter by active status
    if (req.query.isActive.toLowerCase() === 'all') {
      // No filter needed, include both active and inactive
      console.log('Returning all categories (active and inactive)');
    } else {
      // Otherwise, filter by the boolean value
      filter.isActive = req.query.isActive === 'true';
      console.log(`Filtering categories by isActive=${filter.isActive}`);
    }
  } else {
    // Default to active categories only if not specified
    filter.isActive = true;
    console.log('Default: Returning active categories only');
  }
  
  const categories = await Category.find(filter).sort('name');
  console.log(`Found ${categories.length} categories matching filter:`, filter);
  res.status(200).json(categories);
});

// @desc    Get a single category by ID
// @route   GET /api/categories/:id
// @access  Public
export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  
  res.status(200).json(category);
});

// @desc    Create a new category
// @route   POST /api/categories
// @access  Admin only
export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, images, videos } = req.body;
  
  // Validate required fields
  if (!name) {
    res.status(400);
    throw new Error('Category name is required');
  }
  
  // Process images with background removal if provided
  let processedImages = [];
  if (images && images.length > 0) {
    // Filter out any images that already have been processed
    const imagesToProcess = images.filter(img => !img.includes('/processed/'));
    console.log(`Processing ${imagesToProcess.length} images for new category: ${name}`);
    
    try {
      if (imagesToProcess.length > 0) {
        // Create a mapping of original URLs to their processed versions
        const processedMap = {};
        
        // Process each unprocessed image
        const results = await Promise.all(
          imagesToProcess.map(async (imageUrl) => {
            console.log(`Processing image: ${imageUrl}`);
            const processedUrl = await removeBackground(imageUrl);
            processedMap[imageUrl] = processedUrl;
            return processedUrl;
          })
        );
        
        // Replace original URLs with processed ones, keep already processed URLs as is
        processedImages = images.map(url => 
          processedMap[url] || url
        );
        
        console.log('Background removal complete for all images');
      } else {
        // All images are already processed
        processedImages = images;
        console.log('All images already processed, skipping background removal');
      }
    } catch (error) {
      console.error('Error processing images for new category:', error);
      // If background removal fails, use original images
      processedImages = images;
    }
  }
  
  // Create the category
  const category = await Category.create({
    name,
    description,
    images: processedImages.length > 0 ? processedImages : images || [],
    videos: videos || []
  });
  
  res.status(201).json(category);
});

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Admin only
export const updateCategory = asyncHandler(async (req, res) => {
  const { name, description, images, videos, isActive } = req.body;
  const category = await Category.findById(req.params.id);
  
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  
  // Get current images to check which ones have been removed
  const currentImages = [...category.images];
  const currentVideos = [...category.videos];
  
  // Update category fields
  category.name = name || category.name;
  category.description = description !== undefined ? description : category.description;
  category.isActive = isActive !== undefined ? isActive : category.isActive;
  
  // Update images if provided
  if (images !== undefined) {
    // Find new images that need background removal
    // Both new images and ones that haven't been processed yet
    const newImages = images.filter(img => 
      !currentImages.includes(img) && !img.includes('/processed/')
    );
    let processedImages = [...images]; // Start with all images
    
    // Process new images with background removal
    if (newImages.length > 0) {
      console.log(`Found ${newImages.length} new images to process for category ${category.name}`);
      
      try {
        // Process each new image and collect results
        const processedResults = await Promise.all(
          newImages.map(async (imageUrl) => {
            console.log(`Starting background removal for image: ${imageUrl}`);
            const processedUrl = await removeBackground(imageUrl);
            return { originalUrl: imageUrl, processedUrl };
          })
        );
        
        // Replace original URLs with processed ones
        processedResults.forEach(({ originalUrl, processedUrl }) => {
          const imgIndex = processedImages.indexOf(originalUrl);
          if (imgIndex !== -1) {
            console.log(`Replacing ${originalUrl} with ${processedUrl}`);
            processedImages[imgIndex] = processedUrl;
          }
        });
        
        console.log(`Background removal complete for ${processedResults.length} images`);
      } catch (error) {
        console.error('Error during batch image processing:', error);
      }
    }
    
    // Update the category with the processed images
    category.images = processedImages;
    
    // Find removed images to delete from Cloudinary
    const removedImages = currentImages.filter(img => !images.includes(img));
    
    // Delete each removed image from Cloudinary
    for (const imageUrl of removedImages) {
      const publicId = getPublicIdFromUrl(imageUrl);
      if (publicId) {
        try {
          await deleteFromCloudinary(publicId);
        } catch (error) {
          console.error(`Failed to delete image ${publicId}:`, error);
        }
      }
    }
  }
  
  // Update videos if provided
  if (videos !== undefined) {
    category.videos = videos;
    
    // Find removed videos to delete from Cloudinary
    const removedVideos = currentVideos.filter(vid => !videos.includes(vid));
    
    // Delete each removed video from Cloudinary
    for (const videoUrl of removedVideos) {
      const publicId = getPublicIdFromUrl(videoUrl);
      if (publicId) {
        try {
          await deleteFromCloudinary(publicId, { resource_type: 'video' });
        } catch (error) {
          console.error(`Failed to delete video ${publicId}:`, error);
        }
      }
    }
  }
  
  // Save updated category
  const updatedCategory = await category.save();
  res.status(200).json(updatedCategory);
});

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Admin only
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  
  // Check if there are products using this category
  const productCount = await Product.countDocuments({ category: req.params.id });
  
  if (productCount > 0) {
    res.status(400);
    throw new Error(`Cannot delete category. ${productCount} products are using this category.`);
  }
  
  // Delete all images and videos from Cloudinary
  const imagesToDelete = [...category.images];
  const videosToDelete = [...category.videos];
  
  // Delete images from Cloudinary
  for (const imageUrl of imagesToDelete) {
    const publicId = getPublicIdFromUrl(imageUrl);
    if (publicId) {
      try {
        await deleteFromCloudinary(publicId);
      } catch (error) {
        console.error(`Failed to delete image ${publicId}:`, error);
      }
    }
  }
  
  // Delete videos from Cloudinary
  for (const videoUrl of videosToDelete) {
    const publicId = getPublicIdFromUrl(videoUrl);
    if (publicId) {
      try {
        await deleteFromCloudinary(publicId, { resource_type: 'video' });
      } catch (error) {
        console.error(`Failed to delete video ${publicId}:`, error);
      }
    }
  }
  
  // Delete the category
  await category.deleteOne();
  
  res.status(200).json({ message: 'Category removed successfully' });
});

// @desc    Get products by category
// @route   GET /api/categories/:id/products
// @access  Public
export const getCategoryProducts = asyncHandler(async (req, res) => {
  const categoryId = req.params.id;
  const cacheKey = `category-products-${categoryId}`;
  
  // Check if we have cached data
  const cachedProducts = cache.get(cacheKey);
  if (cachedProducts) {
    console.log(`Using cached products for category: ${categoryId}`);
    return res.status(200).json(cachedProducts);
  }
  
  // No cache hit, fetch from database
  console.log(`Cache miss for category: ${categoryId}, fetching from database`);
  
  const category = await Category.findById(categoryId);
  
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  
  // Find products for this category
  const products = await Product.find({ 
    category: categoryId,
    isActive: true
  }).sort('-createdAt');
  
  // Store in cache for 5 minutes (300 seconds)
  cache.set(cacheKey, products, 300);
  
  res.status(200).json(products);
});
