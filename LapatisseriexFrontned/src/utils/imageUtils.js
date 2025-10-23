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

  // Guard against non-string imageUrls (happens occasionally with malformed data)
  if (typeof imageUrl !== 'string') {
    console.warn('Received non-string image URL:', imageUrl);
    return fallbackUrl;
  }

  const lowerUrl = imageUrl.toLowerCase();

  // Do not attempt to transform Cloudinary video URLs
  if (lowerUrl.includes('/video/') || lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.webm') || lowerUrl.endsWith('.ogg')) {
    return imageUrl;
  }
  
  try {
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
  } catch (err) {
    console.error('Error normalizing image URL:', err, imageUrl);
    return fallbackUrl;
  }
};

export const normalizeVideoUrl = (videoUrl) => {
  if (!videoUrl) {
    return videoUrl;
  }

  if (!videoUrl.includes('cloudinary.com') || !videoUrl.includes('/video/upload/')) {
    return videoUrl;
  }

  const [prefix, suffix] = videoUrl.split('/video/upload/');
  if (!suffix) {
    return videoUrl;
  }

  const segments = suffix.split('/');
  if (segments.length === 0) {
    return videoUrl;
  }

  const [firstSegment, ...rest] = segments;
  const isVersionSegment = /^v\d+$/i.test(firstSegment) || firstSegment === '';

  if (isVersionSegment) {
    return `${prefix}/video/upload/f_mp4,vc_auto/${segments.join('/')}`;
  }

  let transformation = firstSegment;
  if (!transformation.includes('f_mp4')) {
    transformation = `f_mp4,${transformation}`;
  }
  if (!/vc_[a-z0-9]+/i.test(transformation)) {
    transformation = `${transformation},vc_auto`;
  }

  return `${prefix}/video/upload/${[transformation, ...rest].join('/')}`;
};