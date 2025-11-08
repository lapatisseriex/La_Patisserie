import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Product from '../models/productModel.js';
import Category from '../models/categoryModel.js';
import TimeSettings from '../models/timeSettingsModel.js';
import { deleteFromCloudinary, getPublicIdFromUrl } from '../utils/cloudinary.js';
import { cache } from '../utils/cache.js';
import { sendNewProductNewsletter, sendNewProductToAllUsers, sendDiscountNewsletter } from '../utils/newsletterEmailService.js';
import { formatVariantLabel } from '../utils/variantUtils.js';

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
    bestSeller,
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
  
  // Best seller filter
  if (bestSeller === 'true') {
    filter.totalOrderCount = { $gte: 4 };
  }
  
  // Search by name, description, product id, and optionally Mongo _id if valid
  if (search) {
    const orConditions = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { id: { $regex: search, $options: 'i' } },
    ];

    // If search looks like a Mongo ObjectId, include an exact match on _id
    if (mongoose.Types.ObjectId.isValid(search)) {
      orConditions.push({ _id: new mongoose.Types.ObjectId(search) });
    }

    filter.$or = orConditions;
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
    // Return only fields needed for list views
  .select('name id price variants featuredImage images category isActive hasEgg isVeg badge totalOrderCount createdAt updatedAt')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit))
      .lean({ virtuals: true });

    // Get total count for pagination (run in parallel)
    totalProducts = await Product.countDocuments(filter);
    
    // Store in cache - shorter timeout (2 minutes) for product listing
    // Admin requests aren't cached (they need fresh data)
    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin) {
      cache.set(cacheKey, { products, totalProducts }, 120);
    }
  }

  // Check shop availability
  const timeSettings = await TimeSettings.getCurrentSettings();
  const isShopOpen = timeSettings ? timeSettings.isShopOpen() : true;
  const nextOpenTime = isShopOpen ? null : timeSettings?.getNextOpeningTime();

  // Add availability status to each product
  const productsWithAvailability = products.map(product => ({
    ...product, // already lean
    isAvailable: isShopOpen,
    shopStatus: {
      isOpen: isShopOpen,
      nextOpenTime: nextOpenTime
    }
  }));
  
  // Force fresh data on every request to ensure newly added or removed products show immediately
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    'Surrogate-Control': 'no-store'
  });
  
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
      })
      .select('-__v')
      .lean({ virtuals: true });

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

    // Convert lean object back to a mongoose document to use instance methods
    const productDoc = new Product(product);
    
    // Add pricing breakdown for each variant
    const variantsWithPricing = product.variants?.map((variant, index) => {
      const plainVariant = typeof variant?.toObject === 'function'
        ? variant.toObject()
        : { ...variant };
      return {
        ...plainVariant,
        variantLabel: formatVariantLabel(plainVariant),
        pricingBreakdown: productDoc.getVariantPricingBreakdown(index)
      };
    }) || [];

    // Add availability status to the product
    const productWithAvailability = {
      ...product,
      variants: variantsWithPricing,
      isAvailable: isShopOpen,
      shopStatus: {
        isOpen: isShopOpen,
        nextOpenTime: nextOpenTime
      },
      defaultVariantLabel: variantsWithPricing[0]?.variantLabel || ''
    };

    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      'Surrogate-Control': 'no-store'
    });

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

  // Check if product ID already exists
  if (id) {
    const existingProduct = await Product.findOne({ id });
    if (existingProduct) {
      res.status(400);
      throw new Error(`Product with ID "${id}" already exists. Please use a different ID.`);
    }
  }

  // Validate variants if provided
  if (variants && !Array.isArray(variants)) {
    res.status(400);
    throw new Error('Variants must be an array');
  }

  // Normalize variants to ensure all fields are preserved
  const normalizedVariants = Array.isArray(variants)
    ? variants.map(v => ({
        ...v,
        isStockActive: v?.isStockActive === true,
        stock: Math.max(0, Number(v?.stock || 0)),
        // Preserve pricing calculator fields
        costPrice: Number(v?.costPrice || 0),
        profitWanted: Number(v?.profitWanted || 0),
        freeCashExpected: Number(v?.freeCashExpected || 0)
      }))
    : [];

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
    variants: normalizedVariants // Store normalized variants only
  });

  const createdProduct = await Product.findById(product._id).populate('category', 'name');

  // Clear cache after creating product to ensure fresh data on next fetch
  cache.clear();

  // Send email to all registered users about new product (async, don't wait)
  sendNewProductToAllUsers(createdProduct).catch(err => {
    console.error('Failed to send new product email to all users:', err);
  });

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

  if (variants) {
    if (!Array.isArray(variants)) {
      res.status(400);
      throw new Error('Variants must be an array');
    }
    // Normalize incoming variants to ensure all fields are preserved
    product.variants = variants.map(v => ({
      ...v,
      isStockActive: v?.isStockActive === true,
      stock: Math.max(0, Number(v?.stock || 0)),
      // Preserve pricing calculator fields
      costPrice: Number(v?.costPrice || 0),
      profitWanted: Number(v?.profitWanted || 0),
      freeCashExpected: Number(v?.freeCashExpected || 0)
    }));
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

  // Clear cache after updating product to ensure fresh data on next fetch
  cache.clear();

  res.status(200).json(populatedProduct);
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Admin only
export const deleteProduct = asyncHandler(async (req, res) => {
  try {
    console.log(`Attempting to delete product with ID: ${req.params.id}`);
    
    // Clear cache immediately to prevent stale data
    cache.clear();
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      console.log(`Product not found with ID: ${req.params.id}`);
      res.status(404);
      throw new Error('Product not found');
    }

    console.log(`Found product: ${product.name}, starting deletion process...`);
    
    // Delete all images and videos from Cloudinary
    const imagesToDelete = [...(product.images || [])];
    const videosToDelete = [...(product.videos || [])];
    
    console.log(`Images to delete: ${imagesToDelete.length}, Videos to delete: ${videosToDelete.length}`);
    
    // Delete images from Cloudinary
    for (const imageUrl of imagesToDelete) {
      const publicId = getPublicIdFromUrl(imageUrl);
      if (publicId) {
        try {
          console.log(`Deleting image: ${publicId}`);
          await deleteFromCloudinary(publicId);
        } catch (error) {
          console.error(`Failed to delete image ${publicId}:`, error);
          // Continue with deletion even if Cloudinary fails
        }
      }
    }
    
    // Delete videos from Cloudinary
    for (const videoUrl of videosToDelete) {
      const publicId = getPublicIdFromUrl(videoUrl);
      if (publicId) {
        try {
          console.log(`Deleting video: ${publicId}`);
          await deleteFromCloudinary(publicId, { resource_type: 'video' });
        } catch (error) {
          console.error(`Failed to delete video ${publicId}:`, error);
          // Continue with deletion even if Cloudinary fails
        }
      }
    }
    
    console.log('Starting database deletion...');
    
    // Delete the product from database
    await product.deleteOne();
    
    console.log(`Product ${req.params.id} deleted successfully`);
    
    // Clear cache again after deleting product to ensure fresh data on next fetch
    cache.clear();
    
    res.status(200).json({ 
      success: true,
      message: 'Product removed successfully',
      deletedProductId: req.params.id 
    });
    
  } catch (error) {
    console.error(`Error deleting product ${req.params.id}:`, error);
    
    // Clear cache even on error to prevent stale data
    cache.clear();
    
    // More specific error handling
    if (error.name === 'CastError') {
      res.status(400);
      throw new Error('Invalid product ID format');
    }
    
    if (error.name === 'ValidationError') {
      res.status(400);
      throw new Error('Validation error during deletion');
    }
    
    // Re-throw the error to be handled by asyncHandler
    throw error;
  }
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
  
  // Track if this is a new discount being applied
  const isNewDiscount = (!product.discount?.type || product.cancelOffer) && type && value > 0 && !cancelOffer;
  
  // Update discount
  if (type && value !== undefined) {
    product.discount = { type, value };
  }
  
  // Update cancelOffer flag if provided
  if (cancelOffer !== undefined) {
    product.cancelOffer = cancelOffer;
  }
  
  const updatedProduct = await product.save();
  
  // Populate category for newsletter
  const populatedProduct = await Product.findById(updatedProduct._id).populate('category', 'name');
  
  // Clear cache after updating product discount to ensure fresh data on next fetch
  cache.clear();
  
  // Send newsletter if a new discount is applied
  if (isNewDiscount && populatedProduct.isActive) {
    const discountData = {
      ...populatedProduct.toObject(),
      discountPercentage: type === 'percentage' ? value : Math.round((value / populatedProduct.variants[0]?.price) * 100),
      originalPrice: populatedProduct.variants[0]?.price || 0,
      discountedPrice: type === 'percentage' 
        ? populatedProduct.variants[0]?.price * (1 - value / 100)
        : populatedProduct.variants[0]?.price - value
    };
    
    sendDiscountNewsletter(discountData).catch(err => {
      console.error('Failed to send discount newsletter:', err);
    });
  }
  
  res.status(200).json(updatedProduct);
});

// @desc    Get product order statistics
// @route   GET /api/products/stats/orders
// @access  Admin
export const getProductOrderStats = asyncHandler(async (req, res) => {
  const { 
    sortBy = 'totalOrderCount', 
    order = 'desc', 
    limit = 50, 
    page = 1,
    category,
    minOrders = 0
  } = req.query;

  // Build filter
  const filter = { isActive: true };
  if (category) filter.category = category;
  if (minOrders > 0) filter.totalOrderCount = { $gte: parseInt(minOrders) };

  // Build sort object
  const sortObject = {};
  sortObject[sortBy] = order === 'desc' ? -1 : 1;

  // Calculate pagination
  const skip = (page - 1) * limit;

  try {
    const products = await Product.find(filter)
      .populate('category', 'name')
      .sort(sortObject)
      .skip(skip)
      .limit(parseInt(limit))
      .select('name id totalOrderCount lastOrderCountUpdate category images')
      .lean();

    const total = await Product.countDocuments(filter);

    // Add best seller status to each product
    const enrichedProducts = products.map(product => ({
      ...product,
      bestSeller: product.totalOrderCount >= 4,
      featuredImage: product.images && product.images.length > 0 ? product.images[0] : null
    }));

    res.json({
      products: enrichedProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
        hasNextPage: (page * limit) < total,
        hasPrevPage: page > 1
      },
      stats: {
        totalProductsWithOrders: await Product.countDocuments({ totalOrderCount: { $gt: 0 } }),
        bestSellersCount: await Product.countDocuments({ totalOrderCount: { $gte: 4 } }),
        averageOrderCount: await Product.aggregate([
          { $group: { _id: null, avg: { $avg: "$totalOrderCount" } } }
        ]).then(result => result[0]?.avg || 0)
      }
    });
  } catch (error) {
    console.error('Error fetching product order stats:', error);
    res.status(500).json({ message: 'Server error while fetching product order statistics' });
  }
});

// @desc    Get best selling products
// @route   GET /api/products/bestsellers
// @access  Public
export const getBestSellingProducts = asyncHandler(async (req, res) => {
  const { 
    limit = 20, 
    page = 1, 
    category,
    minOrders = 4 
  } = req.query;

  // Build filter for best sellers
  const filter = { 
    isActive: true, 
    totalOrderCount: { $gte: parseInt(minOrders) } 
  };
  
  if (category) filter.category = category;

  // Calculate pagination
  const skip = (page - 1) * limit;

  try {
    // First check if there are any best sellers at all
    const totalBestSellers = await Product.countDocuments(filter);
    
    // If no best sellers exist, return empty response with flag
    if (totalBestSellers === 0) {
      return res.json({
        products: [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: 0,
          totalProducts: 0,
          hasNextPage: false,
          hasPrevPage: false
        },
        meta: {
          minOrdersThreshold: parseInt(minOrders),
          resultCount: 0,
          hasBestSellers: false,
          message: 'No best sellers found. Products need at least ' + minOrders + ' orders to qualify.'
        }
      });
    }

    const products = await Product.find(filter)
      .populate('category', 'name')
      .sort({ totalOrderCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Add best seller status and process variants
    const enrichedProducts = products.map(product => {
      const processedProduct = {
        ...product,
        bestSeller: true, // All products in this query are best sellers
        featuredImage: product.images && product.images.length > 0 ? product.images[0] : null
      };

      // Process variants to include pricing information
      if (product.variants && product.variants.length > 0) {
        processedProduct.variants = product.variants.map(variant => ({
          ...variant,
          hasDiscount: variant.discount && variant.discount.type && !product.cancelOffer
        }));
      }

      return processedProduct;
    });

    res.json({
      products: enrichedProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalBestSellers / limit),
        totalProducts: totalBestSellers,
        hasNextPage: (page * limit) < totalBestSellers,
        hasPrevPage: page > 1
      },
      meta: {
        minOrdersThreshold: parseInt(minOrders),
        resultCount: enrichedProducts.length,
        hasBestSellers: true
      }
    });
  } catch (error) {
    console.error('Error fetching best selling products:', error);
    res.status(500).json({ message: 'Server error while fetching best selling products' });
  }
});

// @desc    Check if there are any best sellers
// @route   GET /api/products/bestsellers/check
// @access  Public
export const checkBestSellers = asyncHandler(async (req, res) => {
  const { minOrders = 4, category } = req.query;

  try {
    // Build filter for best sellers
    const filter = { 
      isActive: true, 
      totalOrderCount: { $gte: parseInt(minOrders) } 
    };
    
    if (category) filter.category = category;

    // Count best sellers
    const bestSellersCount = await Product.countDocuments(filter);
    
    res.json({
      hasBestSellers: bestSellersCount > 0,
      bestSellersCount,
      minOrdersThreshold: parseInt(minOrders),
      message: bestSellersCount > 0 
        ? `Found ${bestSellersCount} best selling products`
        : `No best sellers found. Products need at least ${minOrders} orders to qualify.`
    });
  } catch (error) {
    console.error('Error checking best sellers:', error);
    res.status(500).json({ message: 'Server error while checking best sellers' });
  }
});

// @desc    Update product order count (internal use)
// @route   PUT /api/products/:id/order-count
// @access  Admin
export const updateProductOrderCount = asyncHandler(async (req, res) => {
  const { increment = 1, reset = false } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (reset) {
    product.totalOrderCount = 0;
  } else {
    product.totalOrderCount = (product.totalOrderCount || 0) + parseInt(increment);
  }
  
  product.lastOrderCountUpdate = new Date();
  
  const updatedProduct = await product.save();

  // Clear cache after updating product order count to ensure fresh data on next fetch
  cache.clear();

  res.json({
    _id: updatedProduct._id,
    name: updatedProduct.name,
    totalOrderCount: updatedProduct.totalOrderCount,
    bestSeller: updatedProduct.isBestSeller(),
    lastOrderCountUpdate: updatedProduct.lastOrderCountUpdate
  });
});

// @desc    Bulk update product order counts from order data
// @route   POST /api/products/bulk-update-order-counts
// @access  Admin
export const bulkUpdateOrderCounts = asyncHandler(async (req, res) => {
  try {
    // Import Order model
    const Order = (await import('../models/orderModel.js')).default;
    
    console.log('Starting bulk update of product order counts...');
    
    // Get all completed orders
    const orders = await Order.find({ 
      orderStatus: { $in: ['delivered', 'confirmed', 'preparing', 'ready', 'out_for_delivery'] } 
    }).select('cartItems orderStatus');

    console.log(`Found ${orders.length} completed orders`);

    // Count orders per product
    const productOrderCounts = {};
    
    orders.forEach(order => {
      order.cartItems.forEach(item => {
        const productId = item.productId.toString();
        productOrderCounts[productId] = (productOrderCounts[productId] || 0) + item.quantity;
      });
    });

    console.log(`Updating order counts for ${Object.keys(productOrderCounts).length} products`);

    // Update each product's order count
    const updatePromises = Object.entries(productOrderCounts).map(async ([productId, count]) => {
      try {
        return await Product.findByIdAndUpdate(
          productId,
          { 
            totalOrderCount: count,
            lastOrderCountUpdate: new Date()
          },
          { new: true }
        );
      } catch (error) {
        console.error(`Error updating product ${productId}:`, error.message);
        return null;
      }
    });

    const updatedProducts = await Promise.all(updatePromises);
    const successfulUpdates = updatedProducts.filter(p => p !== null);

    // Clear cache after bulk updating products to ensure fresh data on next fetch
    cache.clear();

    // Get summary statistics
    const totalProducts = await Product.countDocuments();
    const bestSellers = await Product.countDocuments({ totalOrderCount: { $gte: 4 } });

    res.json({
      message: 'Bulk update completed successfully',
      stats: {
        totalOrdersProcessed: orders.length,
        productsUpdated: successfulUpdates.length,
        productOrderCounts: Object.keys(productOrderCounts).length,
        totalProducts,
        bestSellers,
        bestSellerThreshold: 4
      },
      summary: successfulUpdates.slice(0, 10).map(product => ({
        id: product._id,
        name: product.name,
        totalOrderCount: product.totalOrderCount,
        bestSeller: product.totalOrderCount >= 4
      }))
    });

  } catch (error) {
    console.error('Error in bulk update:', error);
    res.status(500).json({ message: 'Server error during bulk update', error: error.message });
  }
});
