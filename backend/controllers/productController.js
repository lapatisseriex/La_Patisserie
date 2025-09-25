import asyncHandler from 'express-async-handler';
import Product from '../models/productModel.js';
import Category from '../models/categoryModel.js';
import TimeSettings from '../models/timeSettingsModel.js';
import { deleteFromCloudinary, getPublicIdFromUrl } from '../utils/cloudinary.js';
import { cache } from '../utils/cache.js';

// @desc    Get all products with optional filtering
// @route   GET /api/products
// @access  Public
export const getProducts = asyncHandler(async (req, res) => {
  const {
    category,
    isActive,
    minPrice,
    maxPrice,
    isVeg,
    hasDiscount,
    tags,
    search,
    limit = 20,
    page = 1
  } = req.query;

  // Build filter object
  const filter = {};
  
  // Category filter
  if (category) {
    filter.category = category;
  }
  
  // Active status filter
  if (isActive !== undefined) {
    if (isActive.toLowerCase() === 'all') {
      // Don't filter by isActive status, return all products
      console.log('Returning all products (active and inactive)');
    } else {
      filter.isActive = isActive === 'true';
      console.log(`Filtering products by isActive=${filter.isActive}`);
    }
  } else {
    filter.isActive = true; // Default to active products only
    console.log('Default: Returning active products only');
  }
  
  // Price range filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
  }
  
  // Vegetarian filter
  if (isVeg !== undefined) {
    filter.isVeg = isVeg === 'true';
  }
  
  // Discount filter
  if (hasDiscount === 'true') {
    filter.$and = [
      { 'discount.type': { $ne: null } },
      { cancelOffer: { $ne: true } }
    ];
  }
  
  // Tags filter (match any tag in the array)
  if (tags) {
    const tagArray = tags.split(',');
    filter.tags = { $in: tagArray };
  }
  
  // Search by name or description
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  
  // Create a cache key based on the query parameters
  const queryHash = JSON.stringify({
    filter,
    skip,
    limit,
    isAdmin: req.user?.role === 'admin'
  });
  
  // Generate a cache key from the hash
  const cacheKey = `products-${Buffer.from(queryHash).toString('base64')}`;
  
  // Check if we have a cache hit
  const cachedData = cache.get(cacheKey);
  let products, totalProducts;
  
  if (cachedData) {
    console.log('Cache hit for products query');
    products = cachedData.products;
    totalProducts = cachedData.totalProducts;
  } else {
    console.log('Cache miss for products query, fetching from database');
    
    // Execute query
    products = await Product.find(filter)
      .populate({
        path: 'category',
        select: 'name images description isActive',
        // Don't filter out inactive categories for admin views
        match: req.user?.role === 'admin' ? {} : { isActive: true }
      })
      .select('-__v') // Exclude version field
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination (run in parallel)
    totalProducts = await Product.countDocuments(filter);
    
    // Store in cache - shorter timeout (2 minutes) for product listing
    // Admin requests aren't cached (they need fresh data)
    if (!req.user?.role === 'admin') {
      cache.set(cacheKey, { products, totalProducts }, 120);
    }
  }

  // Check shop availability
  const timeSettings = await TimeSettings.getCurrentSettings();
  const isShopOpen = timeSettings ? timeSettings.isShopOpen() : true;
  const nextOpenTime = isShopOpen ? null : timeSettings?.getNextOpeningTime();

  // Add availability status to each product
  const productsWithAvailability = products.map(product => ({
    ...product.toObject(),
    isAvailable: isShopOpen,
    shopStatus: {
      isOpen: isShopOpen,
      nextOpenTime: nextOpenTime
    }
  }));
  
  // Set caching headers for better performance
  res.set('Cache-Control', 'public, max-age=60'); // Cache for 1 minute
  
  res.status(200).json({
    products: productsWithAvailability,
    page: Number(page),
    pages: Math.ceil(totalProducts / Number(limit)),
    totalProducts,
    shopStatus: {
      isOpen: isShopOpen,
      nextOpenTime: nextOpenTime
    }
  });
});

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProduct = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate({
        path: 'category',
        select: 'name images description isActive'
      });

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    // For non-admin users, don't return inactive products
    if (!product.isActive && (!req.user || req.user.role !== 'admin')) {
      res.status(404);
      throw new Error('Product not found');
    }

    // Check shop availability
    const timeSettings = await TimeSettings.getCurrentSettings();
    const isShopOpen = timeSettings ? timeSettings.isShopOpen() : true;
    const nextOpenTime = isShopOpen ? null : timeSettings?.getNextOpeningTime();

    // Add availability status to the product
    const productWithAvailability = {
      ...product.toObject(),
      isAvailable: isShopOpen,
      shopStatus: {
        isOpen: isShopOpen,
        nextOpenTime: nextOpenTime
      }
    };

    res.status(200).json(productWithAvailability);
  } catch (error) {
    // Handle invalid ObjectId format
    if (error.name === 'CastError') {
      res.status(404);
      throw new Error('Product not found');
    }
    throw error;
  }
});

// @desc    Create a new product
// @route   POST /api/products
// @access  Admin only
export const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    images,
    videos,
    category,
    tags,
    isVeg,
    hasEgg, // Added hasEgg field
    discount,
    importantField,
    extraFields,
    id,
    badge,
    variants // [{ name?, price, stock, quantity, measuring }]
  } = req.body;

  // Validate required fields
  if (!name || !category) {
    res.status(400);
    throw new Error('Name and category are required');
  }

  // Verify category exists
  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    res.status(400);
    throw new Error('Selected category not found');
  }

  if (!categoryExists.isActive) {
    console.warn(`Creating product in inactive category: ${categoryExists.name}`);
  }

  // Validate variants if provided
  if (variants && !Array.isArray(variants)) {
    res.status(400);
    throw new Error('Variants must be an array');
  }

  // Create product
  const product = await Product.create({
    name,
    description,
    images: images || [],
    videos: videos || [],
    category,
    tags: Array.isArray(tags) ? tags : [],
    isVeg: isVeg !== undefined ? isVeg : true,
    hasEgg: hasEgg !== undefined ? hasEgg : false, // Added hasEgg field
    discount: discount || { type: null, value: 0 },
    importantField,
    extraFields: extraFields || {},
    id,
    badge,
    variants: variants || [] // Store variants directly
  });

  const createdProduct = await Product.findById(product._id).populate('category', 'name');

  res.status(201).json(createdProduct);
});


// @desc    Update a product
// @route   PUT /api/products/:id
export const updateProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    images,
    videos,
    category,
    tags,
    isVeg,
    hasEgg, // Added hasEgg field
    discount,
    importantField,
    extraFields,
    isActive,
    id,
    badge,
    cancelOffer,
    variants // Array of variant objects [{ name?, price, stock, quantity, measuring }]
  } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Get current images & videos to check which ones were removed
  const currentImages = [...product.images];
  const currentVideos = [...product.videos];

  // Verify category exists if provided
  if (category) {
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      res.status(400);
      throw new Error('Selected category not found');
    }
  }

  // Update basic fields if provided
  product.name = name !== undefined ? name : product.name;
  product.description = description !== undefined ? description : product.description;
  product.category = category !== undefined ? category : product.category;
  product.isVeg = isVeg !== undefined ? isVeg : product.isVeg;
  product.hasEgg = hasEgg !== undefined ? hasEgg : product.hasEgg; // Added hasEgg update
  product.isActive = isActive !== undefined ? isActive : product.isActive;
  product.id = id !== undefined ? id : product.id;
  product.badge = badge !== undefined ? badge : product.badge;
  product.importantField = importantField !== undefined ? importantField : product.importantField;
  product.extraFields = extraFields !== undefined ? extraFields : product.extraFields;

  // Update discount and cancelOffer if provided
  if (discount) {
    product.discount = discount;
  }
  if (cancelOffer !== undefined) {
    product.cancelOffer = cancelOffer;
  }

  // Update tags if provided
  if (tags) {
    product.tags = Array.isArray(tags) ? tags : [];
  }

  // Update variants if provided
  if (variants) {
    if (!Array.isArray(variants)) {
      res.status(400);
      throw new Error('Variants must be an array');
    }
    product.variants = variants;
  }

  // Update images if provided
  if (images !== undefined) {
    product.images = images;

    // Find removed images to delete from Cloudinary
    const removedImages = currentImages.filter(img => !images.includes(img));

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
    product.videos = videos;

    // Find removed videos to delete from Cloudinary
    const removedVideos = currentVideos.filter(vid => !videos.includes(vid));

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

  // Save updated product
  const updatedProduct = await product.save();

  // Return populated product
  const populatedProduct = await Product.findById(updatedProduct._id)
    .populate('category', 'name');

  res.status(200).json(populatedProduct);
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Admin only
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  
  // Delete all images and videos from Cloudinary
  const imagesToDelete = [...product.images];
  const videosToDelete = [...product.videos];
  
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
  
  // Delete the product
  await product.deleteOne();
  
  res.status(200).json({ message: 'Product removed successfully' });
});

// @desc    Update product discount
// @route   PUT /api/products/:id/discount
// @access  Admin only
export const updateProductDiscount = asyncHandler(async (req, res) => {
  const { type, value, cancelOffer } = req.body;
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  
  // Update discount
  if (type && value !== undefined) {
    product.discount = { type, value };
  }
  
  // Update cancelOffer flag if provided
  if (cancelOffer !== undefined) {
    product.cancelOffer = cancelOffer;
  }
  
  const updatedProduct = await product.save();
  
  res.status(200).json(updatedProduct);
});
