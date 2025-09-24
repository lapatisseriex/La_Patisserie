import asyncHandler from 'express-async-handler';
import { uploadToCloudinary, generateSignature, deleteFromCloudinary, getPublicIdFromUrl } from '../utils/cloudinary.js';
import { validateFile } from '../utils/fileValidation.js';

// @desc    Upload image or video to Cloudinary
// @route   POST /api/upload
// @access  Admin only
export const uploadMedia = asyncHandler(async (req, res) => {
  if (!req.body.file) {
    res.status(400);
    throw new Error('No file data provided');
  }

  const { file, folder = 'la_patisserie', resourceType = 'auto' } = req.body;
  
  // Define allowed types based on the resourceType
  const allowedResourceTypes = ['image', 'video', 'auto'];
  if (!allowedResourceTypes.includes(resourceType)) {
    res.status(400);
    throw new Error('Invalid resource type. Must be "image", "video", or "auto"');
  }

  try {
    // Upload to Cloudinary
    const result = await uploadToCloudinary(file, { 
      folder,
      resource_type: resourceType
    });
    
    res.status(200).json({
      url: result.url,
      public_id: result.public_id,
      resource_type: result.resource_type,
      format: result.format
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(400);
    throw new Error(`Upload failed: ${error.message}`);
  }
});

// @desc    Generate signature for direct uploads to Cloudinary
// @route   GET /api/upload/signature
// @access  Admin only
export const getUploadSignature = asyncHandler(async (req, res) => {
  try {
    const { folder = 'la_patisserie', timestamp } = req.query;
    
    // Generate signature for direct upload
    const signature = generateSignature({
      folder,
      timestamp: timestamp || Math.round(new Date().getTime() / 1000)
    });
    
    res.status(200).json(signature);
  } catch (error) {
    console.error('Signature generation error:', error);
    res.status(500);
    throw new Error(`Failed to generate signature: ${error.message}`);
  }
});

// @desc    Test Cloudinary configuration
// @route   GET /api/upload/test
// @access  Private (any authenticated user)
export const testCloudinaryConfig = asyncHandler(async (req, res) => {
  try {
    const config = {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'Configured' : 'Missing',
      api_key: process.env.CLOUDINARY_API_KEY ? 'Configured' : 'Missing',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'Configured' : 'Missing'
    };
    
    res.status(200).json({
      success: true,
      message: 'Cloudinary configuration check',
      config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @desc    Upload user profile photo to Cloudinary
// @route   POST /api/upload/profile
// @access  Private (any authenticated user)
export const uploadProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.body.file) {
    res.status(400);
    throw new Error('No file data provided');
  }

  // Validate that the file is a base64 data URL
  const fileData = req.body.file;
  if (!fileData || typeof fileData !== 'string' || !fileData.startsWith('data:image/')) {
    res.status(400);
    throw new Error('Invalid file format. Expected base64 image data.');
  }

  try {
    console.log('=== PROFILE PHOTO UPLOAD START ===');
    console.log('User ID:', req.user.uid);
    console.log('File data type:', typeof fileData);
    console.log('File data prefix:', fileData.substring(0, 50));
    console.log('File data length:', fileData.length);

    // Check Cloudinary configuration
    console.log('Cloudinary config check:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'Present' : 'Missing',
      api_key: process.env.CLOUDINARY_API_KEY ? 'Present' : 'Missing',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'Present' : 'Missing'
    });

    // Upload to Cloudinary in 'profile_photos' folder
    const result = await uploadToCloudinary(fileData, { 
      folder: 'la_patisserie/profile_photos',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
    });

    console.log('=== PROFILE PHOTO UPLOAD SUCCESS ===');
    console.log('Result:', result);
    
    res.status(200).json({
      url: result.url,
      public_id: result.public_id
    });
  } catch (error) {
    console.error('=== PROFILE PHOTO UPLOAD ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', error);
    
    // Handle specific Cloudinary errors
    if (error.message.includes('Invalid extension')) {
      res.status(400);
      throw new Error('Invalid file format. Please upload a valid image file (JPEG, PNG, GIF, or WebP).');
    } else if (error.message.includes('File size too large')) {
      res.status(413);
      throw new Error('File size too large. Please upload an image smaller than 5MB.');
    } else if (error.message.includes('Invalid image')) {
      res.status(400);
      throw new Error('Invalid image file. Please upload a valid image.');
    } else if (error.message.includes('Must supply api_key')) {
      res.status(500);
      throw new Error('Server configuration error. Please contact support.');
    } else {
      res.status(500);
      throw new Error(`Profile photo upload failed: ${error.message}`);
    }
  }
});

// @desc    Upload and update profile photo in single transaction
// @route   POST /api/upload/profile-complete
// @access  Private (any authenticated user)
export const uploadProfilePhotoComplete = asyncHandler(async (req, res) => {
  if (!req.body.file) {
    res.status(400);
    throw new Error('No file data provided');
  }

  // Validate that the file is a base64 data URL
  const fileData = req.body.file;
  if (!fileData || typeof fileData !== 'string' || !fileData.startsWith('data:image/')) {
    res.status(400);
    throw new Error('Invalid file format. Expected base64 image data.');
  }

  try {
    console.log('=== SINGLE-TRANSACTION PROFILE PHOTO UPLOAD START ===');
    console.log('User ID:', req.user.uid);

    // Comprehensive file validation
    console.log('🔍 Validating file...');
    const validation = await validateFile(fileData, 'PROFILE_IMAGE');
    if (!validation.isValid) {
      console.log('❌ File validation failed:', validation.error);
      res.status(400);
      throw new Error(validation.error);
    }
    console.log('✅ File validation passed');
    console.log('📊 File metadata:', validation.metadata);

    // Import User model dynamically to avoid circular dependency issues
    const { default: User } = await import('../models/userModel.js');
    
    // Find user first
    const user = await User.findOne({ uid: req.user.uid });
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // If user already has a profile photo, prepare to delete the old one
    let oldPublicId = null;
    if (user.profilePhoto && user.profilePhoto.public_id) {
      oldPublicId = user.profilePhoto.public_id;
    }

    // Upload new image to Cloudinary
    const result = await uploadToCloudinary(fileData, { 
      folder: 'la_patisserie/profile_photos',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
    });

    console.log('=== CLOUDINARY UPLOAD SUCCESS ===');
    console.log('New image URL:', result.url);
    console.log('New image public_id:', result.public_id);

    // Update user profile with new photo
    user.profilePhoto = { url: result.url, public_id: result.public_id };
    await user.save();

    console.log('=== USER PROFILE UPDATED ===');

    // Delete old image from Cloudinary if it exists (do this after successful update)
    if (oldPublicId) {
      try {
        const { deleteFromCloudinary } = await import('../utils/cloudinary.js');
        await deleteFromCloudinary(oldPublicId);
        console.log('=== OLD IMAGE DELETED ===', oldPublicId);
      } catch (deleteError) {
        console.error('Warning: Failed to delete old image:', deleteError.message);
        // Don't fail the entire operation if old image deletion fails
      }
    }

    res.status(200).json({
      url: result.url,
      public_id: result.public_id,
      message: 'Profile photo updated successfully'
    });

  } catch (error) {
    console.error('=== SINGLE-TRANSACTION PROFILE PHOTO UPLOAD ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Handle specific errors
    if (error.message.includes('Invalid extension')) {
      res.status(400);
      throw new Error('Invalid file format. Please upload a valid image file (JPEG, PNG, GIF, or WebP).');
    } else if (error.message.includes('File size too large')) {
      res.status(413);
      throw new Error('File size too large. Please upload an image smaller than 5MB.');
    } else if (error.message.includes('Invalid image')) {
      res.status(400);
      throw new Error('Invalid image file. Please upload a valid image.');
    } else if (error.message.includes('Must supply api_key')) {
      res.status(500);
      throw new Error('Server configuration error. Please contact support.');
    } else if (error.message.includes('User not found')) {
      res.status(404);
      throw new Error('User not found');
    } else {
      res.status(500);
      throw new Error(`Profile photo upload failed: ${error.message}`);
    }
  }
});
