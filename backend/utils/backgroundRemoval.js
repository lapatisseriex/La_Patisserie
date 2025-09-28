import axios from 'axios';
import { uploadToCloudinary } from './cloudinary.js';

/**
 * Remove background from an image using remove.bg API
 * @param {string} imageUrl - The URL of the image to process
 * @returns {Promise<string>} - The URL of the processed image
 */
export const removeBackground = async (imageUrl) => {
  try {
    // Skip processing if no URL is provided
    if (!imageUrl) {
      console.warn('No image URL provided for background removal');
      return imageUrl;
    }

    console.log(`Starting background removal for: ${imageUrl}`);
    
    // Remove.bg API key from environment variables
    const apiKey = process.env.REMOVE_BG_API_KEY;
    if (!apiKey) {
      console.warn('REMOVE_BG_API_KEY not set; skipping background removal');
      return imageUrl;
    }
    
    // Make the API request to remove.bg
  // Do not log API keys
    
    // API call using URLSearchParams for form data (per official docs)
    const formData = new URLSearchParams();
    formData.append('image_url', imageUrl);
    formData.append('size', 'auto');
    formData.append('format', 'auto');
    formData.append('type', 'product');  // Optimized for product images
    
    const response = await axios({
      method: 'post',
      url: 'https://api.remove.bg/v1.0/removebg',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      responseType: 'arraybuffer',
      data: formData
    });

    console.log('Received response from remove.bg API:', response.status);
    console.log('Response headers:', JSON.stringify(response.headers));
    
    // Check for successful response
    if (response.status !== 200) {
      throw new Error(`Remove.bg API returned status code ${response.status}`);
    }
    
    // Verify we got a buffer back
    if (!Buffer.isBuffer(response.data) || response.data.length === 0) {
      throw new Error('Invalid or empty response from remove.bg API');
    }
    
    // Get the content type from the response (default to png if not available)
    const contentType = response.headers['content-type'] || 'image/png';
    console.log('Content type:', contentType);
    
    // Convert the response to base64 for Cloudinary upload
    const base64Image = Buffer.from(response.data).toString('base64');
    const base64File = `data:${contentType};base64,${base64Image}`;
    
    console.log('Successfully prepared image for Cloudinary upload');
    
    // Upload the processed image to Cloudinary with proper resource type and format
    const uploadResult = await uploadToCloudinary(base64File, {
      folder: 'la_patisserie/categories/processed',
      resource_type: 'image',
      type: 'upload', // Ensure it's saved as an upload, not raw
      transformation: [
        { fetch_format: 'auto', quality: 'auto' },
        { width: 1600, crop: 'limit' }
      ]
    });
    
    console.log(`Successfully processed image, new URL: ${uploadResult.url}`);
    return uploadResult.url;
  } catch (error) {
  console.error('Background removal error:', error.message);
    
    // Enhanced error logging for better debugging
    if (error.response) {
      console.error('API response status:', error.response.status);
      
      // For error responses, try to parse the body if it's a buffer
      if (error.response.data && Buffer.isBuffer(error.response.data)) {
        try {
          const errorBody = JSON.parse(Buffer.from(error.response.data).toString('utf8'));
          console.error('API error details:', errorBody);
        } catch (parseError) {
          console.error('Could not parse error response:', error.response.data.toString('utf8'));
        }
      } else {
        console.error('API response data:', error.response.data);
      }
    }
    
    // Log the full URL that was sent to the API for debugging
    console.error('Image URL that failed:', imageUrl);
    
    // If background removal fails, return the original URL
    return imageUrl;
  }
};