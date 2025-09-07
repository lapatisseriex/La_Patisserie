import asyncHandler from 'express-async-handler';
import Category from '../models/categoryModel.js';
import Product from '../models/productModel.js';
import { deleteFromCloudinary, getPublicIdFromUrl } from '../utils/cloudinary.js';

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
  
  // Create the category
  const category = await Category.create({
    name,
    description,
    images: images || [],
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
    category.images = images;
    
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
  const category = await Category.findById(req.params.id);
  
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  
  // Find products for this category
  const products = await Product.find({ 
    category: req.params.id,
    isActive: true
  }).sort('-createdAt');
  
  res.status(200).json(products);
});
