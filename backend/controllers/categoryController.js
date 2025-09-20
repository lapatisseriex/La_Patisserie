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

// @desc    Update special category image (Best Seller or Newly Launched)
// @route   PUT /api/categories/special-image/:type
// @access  Admin only
export const updateSpecialImage = asyncHandler(async (req, res) => {
  const { type } = req.params; // 'bestSeller' or 'newlyLaunched'
  const { imageUrl } = req.body;

  console.log(`Admin updating special image - Type: ${type}, URL: ${imageUrl}`);

  if (!['bestSeller', 'newlyLaunched'].includes(type)) {
    res.status(400);
    throw new Error('Invalid special image type. Must be "bestSeller" or "newlyLaunched"');
  }

  if (!imageUrl) {
    res.status(400);
    throw new Error('Image URL is required');
  }

  try {
    // Process image with background removal
    console.log(`Processing special image for ${type}: ${imageUrl}`);
    const processedImageUrl = await removeBackground(imageUrl);
    console.log(`Processed image URL: ${processedImageUrl}`);
    
    // Create or find a special categories document to store these images
    // We'll use a special category with a reserved name for this purpose
    let specialCategory = await Category.findOne({ name: '__SPECIAL_IMAGES__' });
    
    if (!specialCategory) {
      console.log('Creating new special category document');
      specialCategory = await Category.create({
        name: '__SPECIAL_IMAGES__',
        description: 'Special category for storing Best Seller and Newly Launched images',
        isActive: false, // Hidden from regular category listings
        specialImages: {}
      });
    }

    // Get the current special image to delete it later
    const currentImage = specialCategory.specialImages?.[type];
    
    // Update the special image
    if (!specialCategory.specialImages) {
      specialCategory.specialImages = {};
    }
    specialCategory.specialImages[type] = processedImageUrl;
    
    await specialCategory.save();
    console.log(`Special category updated with ${type} image: ${processedImageUrl}`);

    // Delete the old image from Cloudinary if it exists
    if (currentImage) {
      const publicId = getPublicIdFromUrl(currentImage);
      if (publicId) {
        try {
          await deleteFromCloudinary(publicId);
          console.log(`Deleted old image: ${publicId}`);
        } catch (error) {
          console.error(`Failed to delete old special image ${publicId}:`, error);
        }
      }
    }

    res.status(200).json({
      message: `${type} image updated successfully`,
      imageUrl: processedImageUrl,
      type
    });
  } catch (error) {
    console.error(`Error updating special image for ${type}:`, error);
    res.status(500);
    throw new Error(`Failed to update ${type} image`);
  }
});

// @desc    Get special category images (Best Seller and Newly Launched)
// @route   GET /api/categories/special-images
// @access  Public
export const getSpecialImages = asyncHandler(async (req, res) => {
  console.log('Fetching special category images...');
  
  try {
    const specialCategory = await Category.findOne({ name: '__SPECIAL_IMAGES__' });
    
    // Get manually uploaded images first
    let bestSellerImage = specialCategory?.specialImages?.bestSeller || null;
    let newlyLaunchedImage = specialCategory?.specialImages?.newlyLaunched || null;
    
    console.log(`Manual images - Best Seller: ${bestSellerImage}, Newly Launched: ${newlyLaunchedImage}`);
    
    // If no manual images are set, get from first products
    if (!bestSellerImage || !newlyLaunchedImage) {
      console.log('Fetching fallback images from products...');
      
      // Get best seller products (sorted by rating)
      const bestSellerProducts = await Product.find({ isActive: true })
        .sort({ rating: -1, createdAt: -1 })
        .limit(1)
        .select('images');
      
      // Get newly launched products (sorted by creation date)
      const newlyLaunchedProducts = await Product.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(1)
        .select('images');
      
      console.log(`Found ${bestSellerProducts.length} best seller products, ${newlyLaunchedProducts.length} newly launched products`);
      
      // Use first product image if no manual image is set
      if (!bestSellerImage && bestSellerProducts.length > 0 && bestSellerProducts[0].images.length > 0) {
        bestSellerImage = bestSellerProducts[0].images[0];
        console.log(`Using fallback best seller image: ${bestSellerImage}`);
      }
      
      if (!newlyLaunchedImage && newlyLaunchedProducts.length > 0 && newlyLaunchedProducts[0].images.length > 0) {
        newlyLaunchedImage = newlyLaunchedProducts[0].images[0];
        console.log(`Using fallback newly launched image: ${newlyLaunchedImage}`);
      }
    }

    const result = {
      bestSeller: bestSellerImage,
      newlyLaunched: newlyLaunchedImage,
      isManual: {
        bestSeller: !!(specialCategory?.specialImages?.bestSeller),
        newlyLaunched: !!(specialCategory?.specialImages?.newlyLaunched)
      }
    };
    
    console.log('Returning special images:', result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching special images:', error);
    res.status(500);
    throw new Error('Failed to fetch special images');
  }
});

// @desc    Delete special category image
// @route   DELETE /api/categories/special-image/:type
// @access  Admin only
export const deleteSpecialImage = asyncHandler(async (req, res) => {
  const { type } = req.params; // 'bestSeller' or 'newlyLaunched'

  if (!['bestSeller', 'newlyLaunched'].includes(type)) {
    res.status(400);
    throw new Error('Invalid special image type. Must be "bestSeller" or "newlyLaunched"');
  }

  try {
    const specialCategory = await Category.findOne({ name: '__SPECIAL_IMAGES__' });
    
    if (!specialCategory || !specialCategory.specialImages?.[type]) {
      res.status(404);
      throw new Error(`No ${type} image found to delete`);
    }

    const imageUrl = specialCategory.specialImages[type];
    
    // Delete from Cloudinary
    const publicId = getPublicIdFromUrl(imageUrl);
    if (publicId) {
      try {
        await deleteFromCloudinary(publicId);
      } catch (error) {
        console.error(`Failed to delete special image ${publicId}:`, error);
      }
    }

    // Remove from database
    specialCategory.specialImages[type] = null;
    await specialCategory.save();

    res.status(200).json({
      message: `${type} image deleted successfully`,
      type
    });
  } catch (error) {
    console.error(`Error deleting special image for ${type}:`, error);
    res.status(500);
    throw new Error(`Failed to delete ${type} image`);
  }
});
