import sharp from 'sharp';
import { Buffer } from 'buffer';

/**
 * File validation utilities for backend
 */

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  PROFILE_IMAGE: 5 * 1024 * 1024, // 5MB
  BANNER_IMAGE: 10 * 1024 * 1024, // 10MB
  BANNER_VIDEO: 100 * 1024 * 1024, // 100MB
};

// Supported MIME types
export const SUPPORTED_MIME_TYPES = {
  PROFILE_IMAGE: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  BANNER_IMAGE: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  BANNER_VIDEO: ['video/mp4', 'video/mov', 'video/avi', 'video/webm'],
};

/**
 * Extract MIME type from base64 data URL
 * @param {string} dataUrl - Base64 data URL
 * @returns {string|null} MIME type or null if invalid
 */
export const extractMimeType = (dataUrl) => {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  
  const match = dataUrl.match(/^data:([^;]+);base64,/);
  return match ? match[1] : null;
};

/**
 * Extract base64 data from data URL
 * @param {string} dataUrl - Base64 data URL
 * @returns {string|null} Base64 data or null if invalid
 */
export const extractBase64Data = (dataUrl) => {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  
  const match = dataUrl.match(/^data:[^;]+;base64,(.+)$/);
  return match ? match[1] : null;
};

/**
 * Calculate file size from base64 data
 * @param {string} base64Data - Base64 encoded data
 * @returns {number} File size in bytes
 */
export const calculateBase64Size = (base64Data) => {
  if (!base64Data) return 0;
  
  // Remove padding characters and calculate size
  const paddingChars = (base64Data.match(/=/g) || []).length;
  return Math.floor((base64Data.length * 3) / 4) - paddingChars;
};

/**
 * Validate file size
 * @param {string} dataUrl - Base64 data URL
 * @param {string} fileType - File type (PROFILE_IMAGE, BANNER_IMAGE, etc.)
 * @returns {object} Validation result
 */
export const validateFileSize = (dataUrl, fileType = 'PROFILE_IMAGE') => {
  const base64Data = extractBase64Data(dataUrl);
  if (!base64Data) {
    return { isValid: false, error: 'Invalid file data' };
  }
  
  const fileSize = calculateBase64Size(base64Data);
  const maxSize = FILE_SIZE_LIMITS[fileType] || FILE_SIZE_LIMITS.PROFILE_IMAGE;
  
  if (fileSize > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `File size too large (${fileSizeMB}MB). Maximum allowed size is ${maxSizeMB}MB.`
    };
  }
  
  return { isValid: true };
};

/**
 * Validate MIME type
 * @param {string} dataUrl - Base64 data URL
 * @param {string} fileType - File type (PROFILE_IMAGE, BANNER_IMAGE, etc.)
 * @returns {object} Validation result
 */
export const validateMimeType = (dataUrl, fileType = 'PROFILE_IMAGE') => {
  const mimeType = extractMimeType(dataUrl);
  if (!mimeType) {
    return { isValid: false, error: 'Unable to determine file type' };
  }
  
  const supportedTypes = SUPPORTED_MIME_TYPES[fileType] || SUPPORTED_MIME_TYPES.PROFILE_IMAGE;
  
  if (!supportedTypes.includes(mimeType.toLowerCase())) {
    return {
      isValid: false,
      error: `Unsupported file type: ${mimeType}. Supported types: ${supportedTypes.join(', ')}`
    };
  }
  
  return { isValid: true, mimeType };
};

/**
 * Validate image content using Sharp (detects malicious files)
 * @param {string} dataUrl - Base64 data URL
 * @returns {Promise<object>} Validation result
 */
export const validateImageContent = async (dataUrl) => {
  try {
    const base64Data = extractBase64Data(dataUrl);
    if (!base64Data) {
      return { isValid: false, error: 'Invalid file data' };
    }
    
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Use Sharp to validate and get image metadata
    const metadata = await sharp(buffer).metadata();
    
    // Check if it's a valid image
    if (!metadata.width || !metadata.height) {
      return { isValid: false, error: 'Invalid image file' };
    }
    
    // Check for reasonable dimensions (prevent extremely large images)
    if (metadata.width > 10000 || metadata.height > 10000) {
      return {
        isValid: false,
        error: `Image dimensions too large (${metadata.width}x${metadata.height}). Maximum allowed: 10000x10000 pixels.`
      };
    }
    
    return {
      isValid: true,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: buffer.length
      }
    };
  } catch (error) {
    console.error('Image validation error:', error);
    return {
      isValid: false,
      error: 'Invalid or corrupted image file'
    };
  }
};

/**
 * Comprehensive file validation
 * @param {string} dataUrl - Base64 data URL
 * @param {string} fileType - File type (PROFILE_IMAGE, BANNER_IMAGE, etc.)
 * @returns {Promise<object>} Validation result
 */
export const validateFile = async (dataUrl, fileType = 'PROFILE_IMAGE') => {
  // Basic format validation
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    return { isValid: false, error: 'Invalid file format' };
  }
  
  // MIME type validation
  const mimeValidation = validateMimeType(dataUrl, fileType);
  if (!mimeValidation.isValid) {
    return mimeValidation;
  }
  
  // File size validation
  const sizeValidation = validateFileSize(dataUrl, fileType);
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }
  
  // For images, validate content
  if (mimeValidation.mimeType && mimeValidation.mimeType.startsWith('image/')) {
    const contentValidation = await validateImageContent(dataUrl);
    if (!contentValidation.isValid) {
      return contentValidation;
    }
    
    return {
      isValid: true,
      mimeType: mimeValidation.mimeType,
      metadata: contentValidation.metadata
    };
  }
  
  return {
    isValid: true,
    mimeType: mimeValidation.mimeType
  };
};

/**
 * Format file size for human reading
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
};