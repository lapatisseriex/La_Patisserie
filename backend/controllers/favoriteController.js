import Favorite from '../models/favoriteModel.js';
import Product from '../models/productModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Get user's favorites
// @route   GET /api/users/favorites
// @access  Private
export const getFavorites = asyncHandler(async (req, res) => {
  try {
    const favorites = await Favorite.getUserFavorites(req.user.uid);
    
    // If favorites exist, populate with product details
    if (favorites.productIds.length > 0) {
      // Get complete product data with all fields including images and variants
      // Use try-catch for the populate in case of missing categories
      let products;
      try {
        products = await Product.find({
          _id: { $in: favorites.productIds }
        })
        .populate('category')
        .lean();
      } catch (populateError) {
        console.warn('Error populating categories, fetching without populate:', populateError);
        // Fallback: fetch products without populating category
        products = await Product.find({
          _id: { $in: favorites.productIds }
        }).lean();
      }
      
      // Create a map of products by id for easier access
      const productsMap = products.reduce((acc, product) => {
        acc[product._id.toString()] = product;
        return acc;
      }, {});
      
      // Add product details to favorites
      const favoritesWithDetails = favorites.productIds.map(id => {
        const idStr = id.toString();
        const product = productsMap[idStr];
        
        if (product) {
          // Ensure compatibility with ProductCard component
          // Convert images array to image object if needed
          if (product.images && product.images.length > 0 && !product.image) {
            product.image = {
              url: product.images[0],
              alt: product.name
            };
          }
          
          // Ensure price is available from variants
          if (product.variants && product.variants.length > 0 && !product.price) {
            product.price = product.variants[0].price;
          }
        }
        
        return {
          productId: id,
          productDetails: product || { 
            _id: id,
            name: 'Product not found',
            price: 0,
            isActive: false 
          }
        };
      }).filter(item => item.productDetails.isActive !== false); // Filter out inactive products
      
      return res.status(200).json({
        success: true,
        data: {
          items: favoritesWithDetails,
          count: favoritesWithDetails.length
        }
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        items: [],
        count: 0
      }
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch favorites',
      error: error.message
    });
  }
});

// @desc    Add product to favorites
// @route   POST /api/users/favorites/:productId
// @access  Private
export const addToFavorites = asyncHandler(async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }
    
    // Check if product exists
    const productExists = await Product.findById(productId);
    if (!productExists) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Add to favorites
    await Favorite.addToFavorites(req.user.uid, productId);
    
    // Get updated favorites
    const updatedFavorites = await Favorite.getUserFavorites(req.user.uid);
    
    res.status(200).json({
      success: true,
      message: 'Product added to favorites',
      data: updatedFavorites
    });
  } catch (error) {
    console.error('Add to favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add product to favorites',
      error: error.message
    });
  }
});

// @desc    Remove product from favorites
// @route   DELETE /api/users/favorites/:productId
// @access  Private
export const removeFromFavorites = asyncHandler(async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }
    
    // Remove from favorites
    await Favorite.removeFromFavorites(req.user.uid, productId);
    
    // Get updated favorites
    const updatedFavorites = await Favorite.getUserFavorites(req.user.uid);
    
    res.status(200).json({
      success: true,
      message: 'Product removed from favorites',
      data: updatedFavorites
    });
  } catch (error) {
    console.error('Remove from favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove product from favorites',
      error: error.message
    });
  }
});

// @desc    Check if product is in favorites
// @route   GET /api/users/favorites/:productId
// @access  Private
export const checkFavoriteStatus = asyncHandler(async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }
    
    // Check if product is in favorites
    const isInFavorites = await Favorite.isProductInFavorites(req.user.uid, productId);
    
    res.status(200).json({
      success: true,
      data: {
        isInFavorites
      }
    });
  } catch (error) {
    console.error('Check favorite status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check favorite status',
      error: error.message
    });
  }
});