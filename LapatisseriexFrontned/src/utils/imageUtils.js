/**
 * Utility function to ensure image URLs are correctly formatted for display
 * Fixes issues with raw Cloudinary URLs and adds default placeholder handling
 * 
 * @param {string} imageUrl - The original image URL to normalize
 * @param {string} fallbackUrl - Optional fallback URL if the image is null/undefined
 * @returns {string} - Normalized image URL ready for display
 */
export const normalizeImageUrl = (imageUrl, fallbackUrl = '/images/placeholder-image.jpg') => {
  // If no image provided, use fallback
  if (!imageUrl) {
    return fallbackUrl;
  }
  
  // Handle Cloudinary raw URLs that need to be converted to image URLs
  if (imageUrl.includes('/raw/upload/')) {
    // Convert raw URLs to image URLs and add .png extension
    // Also add format_auto and quality_auto to ensure proper transparency
    return imageUrl.replace('/raw/upload/', '/image/upload/f_auto,q_auto/') + '.png';
  }
  
  // Add Cloudinary transformation parameters to normal image URLs (if Cloudinary URL)
  if (imageUrl.includes('cloudinary.com') && !imageUrl.includes('f_auto')) {
    // Check if URL already has parameters
    if (imageUrl.includes('/upload/v')) {
      return imageUrl.replace('/upload/v', '/upload/f_auto,q_auto/v');
    } else if (imageUrl.includes('/image/upload/')) {
      return imageUrl.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
    }
  }
  
  // Return original URL if it's already properly formatted
  return imageUrl;
};