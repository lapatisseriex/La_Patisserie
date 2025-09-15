import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * MediaDisplay component for rendering images or videos from Cloudinary or local sources
 * 
 * @param {Object} props - Component props
 * @param {string} props.src - Source URL of the media
 * @param {string} props.alt - Alternative text for the media
 * @param {string} props.type - Type of media ('image' or 'video')
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.fallbackSrc - Fallback source if primary source fails
 * @param {string} props.aspectRatio - CSS aspect ratio value (e.g. '1/1', '16/9')
 * @param {string} props.objectFit - CSS object-fit property (e.g. 'cover', 'contain')
 * @param {boolean} props.lazy - Whether to lazy load the media
 */
const MediaDisplay = ({
  src,
  alt = '',
  type = 'image',
  className = '',
  fallbackSrc = '/images/cake1.png',
  aspectRatio = 'auto',
  objectFit = 'cover',
  lazy = true
}) => {
  const [error, setError] = useState(false);
  
  // Function to handle image load errors
  const handleError = () => {
    console.warn(`Failed to load media from ${src}, using fallback`);
    setError(true);
  };
  
  // Common media styles
  const mediaStyles = {
    objectFit,
    aspectRatio
  };
  
  // Use fallback if error occurred or no src is provided
  const mediaSource = (error || !src) ? fallbackSrc : src;
  
  return (
    <div className={`media-display ${className}`} style={{ aspectRatio }}>
      {type === 'video' ? (
        <video
          src={mediaSource}
          controls
          style={mediaStyles}
          className="w-full h-full"
          onError={handleError}
        >
          <source src={mediaSource} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : (
        <img
          src={mediaSource}
          alt={alt}
          style={mediaStyles}
          className="w-full h-full"
          onError={handleError}
          loading={lazy ? "lazy" : "eager"}
        />
      )}
    </div>
  );
};

MediaDisplay.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  type: PropTypes.oneOf(['image', 'video']),
  className: PropTypes.string,
  fallbackSrc: PropTypes.string,
  aspectRatio: PropTypes.string,
  objectFit: PropTypes.string,
  lazy: PropTypes.bool
};

export default MediaDisplay;





