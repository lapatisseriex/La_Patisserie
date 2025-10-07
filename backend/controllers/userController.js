import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import firebaseAdmin from '../config/firebase.js';
import { deleteFromCloudinary } from '../utils/cloudinary.js';

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
export const getCurrentUser = asyncHandler(async (req, res) => {
  // Fetch user with populated location and hostel
  const user = await User.findOne({ uid: req.user.uid })
    .populate('location')
    .populate('hostel');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Ensure we're getting the latest data from the database
  // This helps avoid any cached data issues
  await user.save();

  // Format dates for the response
  const formattedDob = user.dob ? user.dob.toISOString().split('T')[0] : null;
  const formattedAnniversary = user.anniversary ? user.anniversary.toISOString().split('T')[0] : null;

  res.status(200).json({
    success: true,
    user: {
      uid: user.uid,
      name: user.name,
      role: user.role,
      dob: formattedDob,
      anniversary: formattedAnniversary,
      gender: user.gender || '',
      city: user.city,
      pincode: user.pincode,
      country: user.country,
      location: user.location,
      hostel: user.hostel,
      profilePhoto: user.profilePhoto || { url: '', public_id: '' },
      createdAt: user.createdAt,
      email: user.email || '',
      emailVerified: user.emailVerified || false,
      emailVerifiedAt: user.emailVerifiedAt || null,
      phone: user.phone || '',
      phoneVerified: user.phoneVerified || false,
      phoneVerifiedAt: user.phoneVerifiedAt || null
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
  
  // Update fields - including all the new profile fields
  const { 
    name, 
    dob, 
    anniversary, 
    gender,
    city, 
    pincode, 
    country, 
    location, 
    hostel, 
    role,
    email,
    phone
  } = req.body;
  
  if (name) user.name = name;
  if (dob) {
    try {
      user.dob = new Date(dob);
    } catch (err) {
      console.error("Invalid date format:", err);
      user.dob = dob;
    }
  }
  if (gender !== undefined) user.gender = gender;
  if (anniversary) {
    try {
      user.anniversary = new Date(anniversary);
    } catch (err) {
      console.error("Invalid anniversary date format:", err);
      user.anniversary = anniversary;
    }
  }
  if (city !== undefined) user.city = city || null;
  if (pincode !== undefined) user.pincode = pincode || null;
  if (country !== undefined) user.country = country || 'India';
  if (location) user.location = location;
  if (hostel !== undefined) user.hostel = hostel || null;
  
  // Only admins can update roles
  if (role && req.user.role === 'admin') {
    user.role = role;
  }
  
  // Handle email updates
  if (email !== undefined) {
    user.email = email;
  }
  
  // Handle phone updates
  if (phone !== undefined) {
    user.phone = phone;
  }
  
  // Email verification status removed
  
  // Save updated user
  await user.save();
  
  // Fetch updated user with populated location and hostel
  const updatedUser = await User.findOne({ uid: userId }).populate('location').populate('hostel');
  
  // Format dates for the response
  const formattedDob = updatedUser.dob ? updatedUser.dob.toISOString().split('T')[0] : null;
  const formattedAnniversary = updatedUser.anniversary ? updatedUser.anniversary.toISOString().split('T')[0] : null;
  
  // Check if this update was performed by an admin on another user's account
  // If so, add a flag to indicate it's an admin update
  const isAdminUpdate = req.user.role === 'admin' && userId !== req.user.uid;
  
  res.status(200).json({
    success: true,
    isAdminUpdate,
    user: {
      uid: updatedUser.uid,
      name: updatedUser.name,
      role: updatedUser.role,
      dob: formattedDob,
      anniversary: formattedAnniversary,
      gender: updatedUser.gender || '',
      city: updatedUser.city,
      pincode: updatedUser.pincode,
      country: updatedUser.country,
      location: updatedUser.location,
      hostel: updatedUser.hostel,
      profilePhoto: updatedUser.profilePhoto || { url: '', public_id: '' },
      email: updatedUser.email || '',
      emailVerified: updatedUser.emailVerified || false,
      emailVerifiedAt: updatedUser.emailVerifiedAt || null
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
  const { page = 1, limit = 10, search = '' } = req.query;

  const filter = {};
  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [
      { name: regex },
      { email: regex },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const [users, totalUsers] = await Promise.all([
    User.find(filter).populate('location').populate('hostel').sort('-createdAt').skip(skip).limit(limitNum),
    User.countDocuments(filter)
  ]);
  
  res.status(200).json({
    users,
    page: pageNum,
    pages: Math.ceil(totalUsers / limitNum) || 1,
    totalUsers,
  });
});

// Favorites functionality has been removed

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

  // Add to front of recently viewed (limit to 3 items)
  user.recentlyViewed.unshift({
    productId: productId,
    viewedAt: new Date()
  });

  // Keep only latest 3 recently viewed items
  if (user.recentlyViewed.length > 3) {
    user.recentlyViewed = user.recentlyViewed.slice(0, 3);
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
  
  // Support conditional GET with ETag
  const ifNoneMatch = req.headers['if-none-match'];
  
  // First find user without population to check if data has changed
  const user = await User.findOne({ uid: userId }, 'recentlyViewed');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  // Generate simple ETag from recently viewed count and timestamps
  const recentCount = user.recentlyViewed.length;
  const latestTimestamp = recentCount > 0 ? 
    user.recentlyViewed[0].viewedAt.getTime() : 0;
  const etag = `W/"recent-${recentCount}-${latestTimestamp}"`;
  
  // If ETag matches, return 304 Not Modified
  if (ifNoneMatch && ifNoneMatch === etag) {
    return res.status(304).end();
  }
  
  // Only populate if we need to return the full data
  const populatedUser = await User.findOne({ uid: userId }).populate({
    path: 'recentlyViewed.productId',
    populate: {
      path: 'category',
      select: 'name'
    }
  });

  // Filter out any null products (in case products were deleted)
  let validRecentlyViewed = populatedUser.recentlyViewed.filter(item => item.productId);

  // Ensure we only return the latest 3 items
  if (validRecentlyViewed.length > 3) {
    validRecentlyViewed = validRecentlyViewed.slice(0, 3);
  }

  // Set ETag header for client caching
  res.set('ETag', etag);
  res.set('Cache-Control', 'private, max-age=300'); // 5 minute client cache
  
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

// @desc    Update user's profile photo
// @route   PUT /api/users/me/photo
// @access  Private
export const updateProfilePhoto = asyncHandler(async (req, res) => {
  const { url, public_id } = req.body;
  
  if (!url || !public_id) {
    res.status(400);
    throw new Error('Profile photo URL and public_id are required');
  }
  
  const user = await User.findOne({ uid: req.user.uid });
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  // If user already has a profile photo, delete the old one from Cloudinary
  if (user.profilePhoto && user.profilePhoto.public_id) {
    try {
      await deleteFromCloudinary(user.profilePhoto.public_id);
    } catch (error) {
      console.error('Error deleting old profile photo:', error);
      // Continue anyway even if delete fails
    }
  }
  
  // Update user's profile photo
  user.profilePhoto = { url, public_id };
  await user.save();
  
  res.status(200).json({
    success: true,
    profilePhoto: user.profilePhoto
  });
});

// @desc    Delete user's profile photo
// @route   DELETE /api/users/me/photo
// @access  Private
export const deleteProfilePhoto = asyncHandler(async (req, res) => {
  const user = await User.findOne({ uid: req.user.uid });
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  // If user has a profile photo, delete it from Cloudinary
  if (user.profilePhoto && user.profilePhoto.public_id) {
    try {
      await deleteFromCloudinary(user.profilePhoto.public_id);
    } catch (error) {
      console.error('Error deleting profile photo:', error);
      // Continue anyway even if delete fails
    }
  }
  
  // Remove profile photo data
  user.profilePhoto = { url: '', public_id: '' };
  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'Profile photo deleted successfully'
  });
});