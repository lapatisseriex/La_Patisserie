import asyncHandler from 'express-async-handler';
import NGOMedia from '../models/ngoMediaModel.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';

// @desc    Get all NGO media
// @route   GET /api/ngo-media
// @access  Public
export const getNGOMedia = asyncHandler(async (req, res) => {
  const { active } = req.query;
  
  const filter = {};
  if (active !== undefined) {
    filter.isActive = active === 'true';
  }

  const media = await NGOMedia.find(filter)
    .sort({ order: 1, createdAt: -1 })
    .populate('uploadedBy', 'name email');

  res.json(media);
});

// @desc    Get single NGO media
// @route   GET /api/ngo-media/:id
// @access  Public
export const getNGOMediaById = asyncHandler(async (req, res) => {
  const media = await NGOMedia.findById(req.params.id)
    .populate('uploadedBy', 'name email');

  if (media) {
    res.json(media);
  } else {
    res.status(404);
    throw new Error('Media not found');
  }
});

// @desc    Upload NGO media
// @route   POST /api/ngo-media
// @access  Admin
export const uploadNGOMedia = asyncHandler(async (req, res) => {
  const { file, type, title, description, order } = req.body;

  console.log('=== NGO MEDIA UPLOAD REQUEST ===');
  console.log('Body keys:', Object.keys(req.body));
  console.log('Type:', type);
  console.log('File received:', file ? 'YES' : 'NO');
  console.log('File type:', typeof file);
  console.log('File length:', file?.length || 0);
  console.log('File starts with:', file?.substring(0, 50));

  if (!file || !type) {
    res.status(400);
    throw new Error('File and type are required');
  }

  // Check file size (base64 is ~33% larger than original)
  const fileSizeInMB = (file.length * 0.75) / (1024 * 1024);
  console.log(`Estimated file size: ${fileSizeInMB.toFixed(2)} MB`);
  
  // Cloudinary free tier limits: 100MB for videos, 10MB for images
  const maxSize = type === 'video' ? 100 : 10;
  if (fileSizeInMB > maxSize) {
    res.status(400);
    throw new Error(`File size (${fileSizeInMB.toFixed(2)}MB) exceeds ${maxSize}MB limit for ${type}s`);
  }

  try {
    // Upload to Cloudinary
    const result = await uploadToCloudinary(file, {
      folder: 'la_patisserie/ngo',
      resource_type: type === 'video' ? 'video' : 'image'
    });

    // Create media entry
    const media = await NGOMedia.create({
      type,
      url: result.url,
      publicId: result.public_id,
      title: title || '',
      description: description || '',
      order: order || 0,
      uploadedBy: req.user._id
    });

    const populatedMedia = await NGOMedia.findById(media._id)
      .populate('uploadedBy', 'name email');

    res.status(201).json(populatedMedia);
  } catch (error) {
    console.error('NGO Media upload error:', error);
    res.status(400);
    throw new Error(`Upload failed: ${error.message}`);
  }
});

// @desc    Update NGO media
// @route   PUT /api/ngo-media/:id
// @access  Admin
export const updateNGOMedia = asyncHandler(async (req, res) => {
  const { title, description, order, isActive } = req.body;

  const media = await NGOMedia.findById(req.params.id);

  if (media) {
    media.title = title !== undefined ? title : media.title;
    media.description = description !== undefined ? description : media.description;
    media.order = order !== undefined ? order : media.order;
    media.isActive = isActive !== undefined ? isActive : media.isActive;

    const updatedMedia = await media.save();
    const populatedMedia = await NGOMedia.findById(updatedMedia._id)
      .populate('uploadedBy', 'name email');

    res.json(populatedMedia);
  } else {
    res.status(404);
    throw new Error('Media not found');
  }
});

// @desc    Delete NGO media
// @route   DELETE /api/ngo-media/:id
// @access  Admin
export const deleteNGOMedia = asyncHandler(async (req, res) => {
  const media = await NGOMedia.findById(req.params.id);

  if (media) {
    try {
      // Delete from Cloudinary
      await deleteFromCloudinary(media.publicId, media.type);
      
      // Delete from database
      await media.deleteOne();
      
      res.json({ message: 'Media removed' });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(400);
      throw new Error(`Failed to delete media: ${error.message}`);
    }
  } else {
    res.status(404);
    throw new Error('Media not found');
  }
});

// @desc    Reorder NGO media
// @route   PUT /api/ngo-media/reorder
// @access  Admin
export const reorderNGOMedia = asyncHandler(async (req, res) => {
  const { mediaOrder } = req.body; // Array of { id, order }

  if (!Array.isArray(mediaOrder)) {
    res.status(400);
    throw new Error('mediaOrder must be an array');
  }

  try {
    const updatePromises = mediaOrder.map(({ id, order }) =>
      NGOMedia.findByIdAndUpdate(id, { order }, { new: true })
    );

    await Promise.all(updatePromises);

    const media = await NGOMedia.find()
      .sort({ order: 1, createdAt: -1 })
      .populate('uploadedBy', 'name email');

    res.json(media);
  } catch (error) {
    console.error('Reorder error:', error);
    res.status(400);
    throw new Error(`Failed to reorder media: ${error.message}`);
  }
});
