import Banner from '../models/bannerModel.js';
import { validationResult } from 'express-validator';

// Get all banners (public route)
export const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true })
      .sort({ order: 1 })
      .select('-__v');
    
    res.json({
      success: true,
      banners
    });
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch banners'
    });
  }
};

// Get all banners for admin (includes inactive)
export const getAllBannersAdmin = async (req, res) => {
  try {
    const banners = await Banner.find()
      .sort({ order: 1, createdAt: -1 })
      .select('-__v');
    
    const stats = {
      total: banners.length,
      active: banners.filter(b => b.isActive).length,
      inactive: banners.filter(b => !b.isActive).length,
      videos: banners.filter(b => b.type === 'video').length,
      images: banners.filter(b => b.type === 'image').length
    };
    
    res.json({
      success: true,
      banners,
      stats
    });
  } catch (error) {
    console.error('Error fetching admin banners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch banners'
    });
  }
};

// Get single banner
export const getBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id).select('-__v');
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }
    
    res.json({
      success: true,
      banner
    });
  } catch (error) {
    console.error('Error fetching banner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch banner'
    });
  }
};

// Create new banner
export const createBanner = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const bannerData = req.body;
    
    // Get the highest order number and increment
    const lastBanner = await Banner.findOne().sort({ order: -1 });
    bannerData.order = lastBanner ? lastBanner.order + 1 : 0;
    
    const banner = new Banner(bannerData);
    await banner.save();
    
    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      banner
    });
  } catch (error) {
    console.error('Error creating banner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create banner'
    });
  }
};

// Update banner
export const updateBanner = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = req.body;
    
    const banner = await Banner.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Banner updated successfully',
      banner
    });
  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update banner'
    });
  }
};

// Delete banner
export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    
    const banner = await Banner.findByIdAndDelete(id);
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }
    
    // Reorder remaining banners
    await reorderBannersHelper();
    
    res.json({
      success: true,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete banner'
    });
  }
};

// Toggle banner active status
export const toggleBannerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const banner = await Banner.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select('-__v');
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }
    
    res.json({
      success: true,
      message: `Banner ${isActive ? 'activated' : 'deactivated'} successfully`,
      banner
    });
  } catch (error) {
    console.error('Error toggling banner status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update banner status'
    });
  }
};

// Reorder banners
export const reorderBanners = async (req, res) => {
  try {
    const { banners } = req.body;
    
    if (!Array.isArray(banners)) {
      return res.status(400).json({
        success: false,
        message: 'Banners must be an array'
      });
    }
    
    // Update order for each banner
    const updatePromises = banners.map((banner, index) =>
      Banner.findByIdAndUpdate(banner.id || banner._id, { order: index })
    );
    
    await Promise.all(updatePromises);
    
    res.json({
      success: true,
      message: 'Banners reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering banners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder banners'
    });
  }
};

// Helper function to reorder banners after deletion
const reorderBannersHelper = async () => {
  try {
    const banners = await Banner.find().sort({ order: 1 });
    const updatePromises = banners.map((banner, index) =>
      Banner.findByIdAndUpdate(banner._id, { order: index })
    );
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error reordering banners after deletion:', error);
  }
};
