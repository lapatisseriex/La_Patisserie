import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';

dotenv.config();

// Configure Cloudinary with credentials from .env file
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Upload a file to Cloudinary
 * @param {string} filePath - The path or base64 data of the file to upload
 * @param {object} options - Upload options
 * @returns {Promise} - The upload result
 */
export const uploadToCloudinary = async (filePath, options = {}) => {
  // Set default folder if not provided
  const folder = options.folder || 'la_patisserie';
  
  // Log the options for debugging
  console.log('Cloudinary upload options:', {
    folder,
    resource_type: options.resource_type || 'auto',
    format: options.format || 'auto',
    type: options.type || 'upload'
  });
  
  try {
    const uploadOptions = {
      folder,
      resource_type: options.resource_type || 'auto',
      format: options.format || 'auto',
      type: options.type || 'upload',
      ...options
    };
    
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    
    console.log('Cloudinary upload successful:', {
      url: result.secure_url,
      format: result.format,
      resource_type: result.resource_type
    });
    
    return {
      url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
      format: result.format
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

/**
 * Generate a signature for client-side direct uploads
 * @param {object} params - Parameters to include in the signature
 * @returns {object} - Signature and other required parameters
 */
export const generateSignature = (params = {}) => {
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!apiSecret) {
    throw new Error('Cloudinary API secret not configured');
  }
  
  const timestamp = params.timestamp || Math.round(new Date().getTime() / 1000);
  
  // Prepare parameters for signature
  const signatureParams = {
    timestamp,
    folder: params.folder || 'la_patisserie',
    upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET
  };
  
  // Create signature string by sorting parameters alphabetically
  const signatureString = Object.keys(signatureParams)
    .sort()
    .map(key => `${key}=${signatureParams[key]}`)
    .join('&') + apiSecret;
  
  // Generate SHA-1 hash of the signature string
  const signature = crypto
    .createHash('sha1')
    .update(signatureString)
    .digest('hex');
  
  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder: signatureParams.folder,
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET
  };
};

/**
 * Delete a file from Cloudinary by public_id
 * @param {string} publicId - The public ID of the file to delete
 * @param {object} options - Delete options
 * @returns {Promise} - The deletion result
 */
export const deleteFromCloudinary = async (publicId, options = {}) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, options);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} - Public ID or null if not extractable
 */
export const getPublicIdFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  try {
    // Extract the public ID from the URL format: cloudinary.com/folder/public_id.ext
    const matches = url.match(/\/v\d+\/(.+?)\.\w+$/);
    
    if (matches && matches[1]) {
      return matches[1];
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

export default cloudinary;
