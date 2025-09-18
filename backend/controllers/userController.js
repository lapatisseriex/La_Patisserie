import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import firebaseAdmin from '../config/firebase.js';

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
export const getCurrentUser = asyncHandler(async (req, res) => {
  // Fetch user with populated location, hostel, and favorites
  const user = await User.findOne({ uid: req.user.uid })
    .populate('location')
    .populate('hostel')
    .populate({
      path: 'favorites',
      populate: {
        path: 'category',
        select: 'name'
      }
    });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Format the date of birth for the response
  const formattedDob = user.dob ? user.dob.toISOString().split('T')[0] : null;

  res.status(200).json({
    success: true,
    user: {
      uid: user.uid,
      phone: user.phone,
      name: user.name,
      role: user.role,
      dob: formattedDob, // Use formatted date
      email: user.email,
      address: user.address,
      location: user.location,
      hostel: user.hostel,
      favorites: user.favorites || [],
      createdAt: user.createdAt
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
export const updateUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  
  // Check if user is updating their own profile or is an admin
  if (userId !== req.user.uid && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to update this profile');
  }
  
  // Find user to update
  const user = await User.findOne({ uid: userId });
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  // Update fields
  const { name, dob, email, address, location, hostel, role } = req.body;
  
  if (name) user.name = name;
  if (dob) {
    // Ensure date is properly formatted
    try {
      user.dob = new Date(dob);
    } catch (err) {
      console.error("Invalid date format:", err);
      // If parsing fails, use the string as is
      user.dob = dob;
    }
  }
  if (email) user.email = email;
  if (address) user.address = address;
  if (location) user.location = location;
  if (hostel !== undefined) user.hostel = hostel || null; // Allow clearing hostel with empty string
  
  // Only admins can update roles
  if (role && req.user.role === 'admin') {
    user.role = role;
  }
  
  // Save updated user
  await user.save();
  
  // Fetch updated user with populated location and hostel
  const updatedUser = await User.findOne({ uid: userId }).populate('location').populate('hostel');
  
  // Format the date of birth for the response
  const formattedDob = updatedUser.dob ? updatedUser.dob.toISOString().split('T')[0] : null;
  
  res.status(200).json({
    success: true,
    user: {
      uid: updatedUser.uid,
      phone: updatedUser.phone,
      name: updatedUser.name,
      role: updatedUser.role,
      dob: formattedDob, // Use formatted date
      email: updatedUser.email,
      address: updatedUser.address,
      location: updatedUser.location,
      hostel: updatedUser.hostel
    }
  });
});

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Admin
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-__v');
  
  res.status(200).json({
    success: true,
    count: users.length,
    users
  });
});

// @desc    Get user by ID (admin only)
// @route   GET /api/users/:id
// @access  Admin
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findOne({ uid: req.params.id }).select('-__v');
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  res.status(200).json({
    success: true,
    user
  });
});
export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).populate('location').populate('hostel').sort('-createdAt');
  
  res.status(200).json(users);
});

// @desc    Add product to favorites
// @route   POST /api/users/favorites/:productId
// @access  Private
export const addToFavorites = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.uid;

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Find user and update favorites
  const user = await User.findOne({ uid: userId });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check if product is already in favorites
  if (user.favorites.includes(productId)) {
    res.status(400);
    throw new Error('Product already in favorites');
  }

  // Add to favorites
  user.favorites.push(productId);
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Product added to favorites'
  });
});

// @desc    Remove product from favorites
// @route   DELETE /api/users/favorites/:productId
// @access  Private
export const removeFromFavorites = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.uid;

  // Find user and update favorites
  const user = await User.findOne({ uid: userId });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Remove from favorites
  user.favorites = user.favorites.filter(fav => fav.toString() !== productId);
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Product removed from favorites'
  });
});

// @desc    Get user's favorite products
// @route   GET /api/users/favorites
// @access  Private
export const getFavorites = asyncHandler(async (req, res) => {
  const userId = req.user.uid;

  // Find user with populated favorites
  const user = await User.findOne({ uid: userId }).populate({
    path: 'favorites',
    populate: {
      path: 'category',
      select: 'name'
    }
  });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.status(200).json({
    success: true,
    favorites: user.favorites || []
  });
});

// @desc    Add product to recently viewed
// @route   POST /api/users/recently-viewed/:productId
// @access  Private
export const addRecentlyViewed = asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const { productId } = req.params;

  // Find user
  const user = await User.findOne({ uid: userId });
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Verify product exists
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Remove existing entry if it exists (to update timestamp)
  user.recentlyViewed = user.recentlyViewed.filter(
    item => item.productId.toString() !== productId
  );

  // Add to front of recently viewed (limit to 20 items)
  user.recentlyViewed.unshift({
    productId: productId,
    viewedAt: new Date()
  });

  // Keep only latest 20 recently viewed items
  if (user.recentlyViewed.length > 20) {
    user.recentlyViewed = user.recentlyViewed.slice(0, 20);
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Product added to recently viewed'
  });
});

// @desc    Get user's recently viewed products
// @route   GET /api/users/recently-viewed
// @access  Private
export const getRecentlyViewed = asyncHandler(async (req, res) => {
  const userId = req.user.uid;

  // Find user with populated recently viewed products
  const user = await User.findOne({ uid: userId }).populate({
    path: 'recentlyViewed.productId',
    populate: {
      path: 'category',
      select: 'name'
    }
  });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Filter out any null products (in case products were deleted)
  const validRecentlyViewed = user.recentlyViewed.filter(item => item.productId);

  res.status(200).json({
    success: true,
    recentlyViewed: validRecentlyViewed || []
  });
});

// @desc    Delete user (admin only or self)
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  
  // Check if user is deleting their own account or is an admin
  if (userId !== req.user.uid && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this user');
  }
  
  // Find user to delete
  const user = await User.findOne({ uid: userId });
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  try {
    // Delete from Firebase Auth
    await firebaseAdmin.auth().deleteUser(userId);
    
    // Delete from MongoDB
    await User.deleteOne({ uid: userId });
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully from both Firebase and database'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500);
    
    // Provide specific error message based on error type
    if (error.code === 'auth/user-not-found') {
      throw new Error('User not found in Firebase Auth but removed from database');
    } else {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }
});