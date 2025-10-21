import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';
import { Readable } from 'stream';

dotenv.config();

// Configure Cloudinary with credentials from .env file
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
  timeout: 120000 // 120 seconds timeout (increased for video uploads)
});

/**
 * Upload a file to Cloudinary using stream (better for large files)
 * @param {string} base64Data - The base64 data of the file
 * @param {object} options - Upload options
 * @returns {Promise} - The upload result
 */
const uploadViaStream = (base64Data, options) => {
  return new Promise((resolve, reject) => {
    // Convert base64 to buffer
    const base64String = base64Data.split(',')[1];
    const buffer = Buffer.from(base64String, 'base64');
    
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    
    // Create a readable stream from buffer
    const bufferStream = Readable.from(buffer);
    bufferStream.pipe(uploadStream);
  });
};

/**
 * Upload a file to Cloudinary
 * @param {string} filePath - The path or base64 data of the file to upload
 * @param {object} options - Upload options
 * @returns {Promise} - The upload result
 */
export const uploadToCloudinary = async (filePath, options = {}) => {
  // Set default folder if not provided
  const folder = options.folder || 'la_patisserie';
  
  // Validate input
  if (!filePath) {
    throw new Error('File path/data is required');
  }

  // Clean up the options to avoid conflicts
  const cleanOptions = {
    folder,
    resource_type: options.resource_type || 'image',
    overwrite: true,
    unique_filename: true,
    use_filename: false,
  };

  // Only add transformations for images, not videos
  if (cleanOptions.resource_type === 'image') {
    cleanOptions.transformation = options.transformation || [
      { fetch_format: 'auto', quality: 'auto' },
      { width: 1600, crop: 'limit' }
    ];
  }

  // Add additional options if provided (but be very careful about format)
  if (options.allowed_formats && Array.isArray(options.allowed_formats)) {
    cleanOptions.allowed_formats = options.allowed_formats;
  }
  
  // Log the options for debugging
  console.log('Cloudinary upload options:', cleanOptions);
  console.log('File data type:', typeof filePath);
  console.log('File data starts with data:video/ or data:image/', 
    filePath.startsWith('data:video/') || filePath.startsWith('data:image/'));
  
  try {
    console.log('=== CLOUDINARY UPLOAD ATTEMPT ===');
    console.log('Upload options:', JSON.stringify(cleanOptions, null, 2));
    
    let result;
    
    // Use chunked upload for videos (more reliable for large files)
    if (cleanOptions.resource_type === 'video') {
      cleanOptions.chunk_size = 6000000; // 6MB chunks
      console.log('Using chunked upload for video with 6MB chunks');
      
      // For videos, use stream upload which is more reliable
      if (filePath.startsWith('data:')) {
        console.log('Using stream upload method for video');
        result = await uploadViaStream(filePath, cleanOptions);
      } else {
        result = await cloudinary.uploader.upload(filePath, cleanOptions);
      }
    } else {
      // For images, use regular upload
      result = await cloudinary.uploader.upload(filePath, cleanOptions);
    }
    
    console.log('=== CLOUDINARY UPLOAD SUCCESS ===');
    console.log('Result details:', {
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      resource_type: result.resource_type,
      width: result.width,
      height: result.height
    });
    
    return {
      url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
      format: result.format,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    console.error('=== CLOUDINARY UPLOAD ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    console.error('HTTP code:', error.http_code);
    console.error('Error details:', error.error);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    
    // Check for specific error types
    if (error.message && error.message.includes('Must supply api_key')) {
      throw new Error('Cloudinary API key is missing or invalid');
    } else if (error.message && error.message.includes('Must supply cloud_name')) {
      throw new Error('Cloudinary cloud name is missing');
    } else if (error.http_code === 401) {
      throw new Error('Cloudinary authentication failed - check API credentials');
    } else if (error.http_code === 400) {
      throw new Error(`Cloudinary request error: ${error.message}`);
    } else if (error.http_code === 499 || error.name === 'TimeoutError' || error.error?.name === 'TimeoutError') {
      throw new Error('Cloudinary upload timeout - file may be too large or network is slow. Try a smaller image or check your internet connection.');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      throw new Error('Network timeout while uploading to Cloudinary. Please check your internet connection and try again.');
    } else if (!error.http_code && error.message?.includes('timeout')) {
      throw new Error('Upload timeout. Please try with a smaller image or check your network connection.');
    }
    
    throw new Error(`Failed to upload file: ${error.message || 'Unknown error'}`);
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
