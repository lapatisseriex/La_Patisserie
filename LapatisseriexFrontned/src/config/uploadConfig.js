/**
 * Centralized upload configuration
 * This file consolidates all upload-related constants and settings
 */

export const UPLOAD_CONFIG = {
  // File size limits (in bytes)
  FILE_SIZE_LIMITS: {
    PROFILE_IMAGE: 5 * 1024 * 1024, // 5MB for profile images
    BANNER_IMAGE: 10 * 1024 * 1024, // 10MB for banner images
    BANNER_VIDEO: 100 * 1024 * 1024, // 100MB for banner videos
    PRODUCT_IMAGE: 10 * 1024 * 1024, // 10MB for product images
    GENERAL_IMAGE: 10 * 1024 * 1024, // 10MB for general images
    GENERAL_VIDEO: 100 * 1024 * 1024, // 100MB for general videos
  },

  // Supported file types
  SUPPORTED_FORMATS: {
    PROFILE_IMAGE: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    BANNER_IMAGE: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    BANNER_VIDEO: ['video/mp4', 'video/mov', 'video/avi', 'video/webm'],
    PRODUCT_IMAGE: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    GENERAL_IMAGE: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    GENERAL_VIDEO: ['video/mp4', 'video/mov', 'video/avi', 'video/webm'],
  },

  // Upload timeouts (in milliseconds)
  TIMEOUTS: {
    PROFILE_IMAGE: 120000, // 2 minutes for profile images
    BANNER_UPLOAD: 300000, // 5 minutes for banners (larger files)
    GENERAL_UPLOAD: 180000, // 3 minutes for general uploads
    USER_UPDATE: 10000, // 10 seconds for user profile updates
  },

  // Default fallback images
  DEFAULT_IMAGES: {
    PROFILE_AVATAR: '/images/default-avatar.svg', // Local fallback instead of external URL
    PROFILE_AVATAR_FALLBACK: 'https://res.cloudinary.com/demo/image/upload/v1580294137/samples/people/smiling-man.jpg', // External fallback
    PLACEHOLDER_IMAGE: '/images/placeholder-image.jpg',
  },

  // Cloudinary folders
  FOLDERS: {
    PROFILE_PHOTOS: 'la_patisserie/profile_photos',
    BANNERS: 'la_patisserie/banners',
    PRODUCTS: 'la_patisserie/products',
    CATEGORIES: 'la_patisserie/categories',
  },

  // Progress tracking intervals
  PROGRESS: {
    FILE_READ_START: 25,
    FILE_READ_COMPLETE: 50,
    UPLOAD_START: 50,
    UPLOAD_COMPLETE: 90,
    PROFILE_UPDATE_COMPLETE: 100,
  },

  // Error messages
  ERROR_MESSAGES: {
    FILE_TOO_LARGE: (actualSize, maxSize) => `File size too large (${formatFileSize(actualSize)}). Maximum size is ${formatFileSize(maxSize)}.`,
    INVALID_FORMAT: (supportedFormats) => `Invalid file format. Supported formats: ${supportedFormats.join(', ')}.`,
    NETWORK_ERROR: 'Network error occurred. Please check your connection and try again.',
    TIMEOUT_ERROR: 'Upload timeout. Please try with a smaller file or better connection.',
    GENERIC_ERROR: 'Upload failed. Please try again.',
    SERVER_ERROR: 'Server error occurred. Please try again in a moment.',
    COMPONENT_UNMOUNTED: 'Component unmounted during upload',
  },
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
};

/**
 * Validate file size
 * @param {File} file - File to validate
 * @param {string} uploadType - Type of upload (PROFILE_IMAGE, BANNER_IMAGE, etc.)
 * @returns {boolean} Whether file size is valid
 */
export const validateFileSize = (file, uploadType) => {
  const maxSize = UPLOAD_CONFIG.FILE_SIZE_LIMITS[uploadType];
  return file.size <= maxSize;
};

/**
 * Validate file format
 * @param {File} file - File to validate
 * @param {string} uploadType - Type of upload
 * @returns {boolean} Whether file format is valid
 */
export const validateFileFormat = (file, uploadType) => {
  const supportedFormats = UPLOAD_CONFIG.SUPPORTED_FORMATS[uploadType];
  return supportedFormats.includes(file.type.toLowerCase());
};

/**
 * Get upload configuration for specific type
 * @param {string} uploadType - Type of upload
 * @returns {object} Upload configuration
 */
export const getUploadConfig = (uploadType) => {
  return {
    maxSize: UPLOAD_CONFIG.FILE_SIZE_LIMITS[uploadType],
    supportedFormats: UPLOAD_CONFIG.SUPPORTED_FORMATS[uploadType],
    timeout: UPLOAD_CONFIG.TIMEOUTS[uploadType] || UPLOAD_CONFIG.TIMEOUTS.GENERAL_UPLOAD,
    folder: UPLOAD_CONFIG.FOLDERS[uploadType.split('_')[0]] || UPLOAD_CONFIG.FOLDERS.PRODUCTS,
  };
};