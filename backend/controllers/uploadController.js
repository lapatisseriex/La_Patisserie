import asyncHandler from 'express-async-handler';
import { uploadToCloudinary, generateSignature } from '../utils/cloudinary.js';

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
