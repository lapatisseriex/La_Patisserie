import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * ImageSlideshow component for displaying a smooth, infinite slideshow of product images
 * 
 * @param {Object} props - Component props
 * @param {Array} props.images - Array of image URLs
 * @param {string} props.alt - Alternative text for the images
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.fallbackSrc - Fallback source if primary source fails
 * @param {string} props.aspectRatio - CSS aspect ratio value (e.g. '1/1', '16/9')
 * @param {string} props.objectFit - CSS object-fit property (e.g. 'cover', 'contain')
 * @param {number} props.interval - Time between slides in milliseconds
 */
const ImageSlideshow = ({
  images = [],
  alt = '',
  className = '',
  fallbackSrc = '/images/cake1.png',
  aspectRatio = 'auto',
  objectFit = 'cover',
  interval = 3000
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [hasError, setHasError] = useState({});
  const slideIntervalRef = useRef(null);

  // Filter out any empty image URLs
  const validImages = images.filter(img => img);

  // If there are no valid images, use the fallback image
  const displayImages = validImages.length > 0 ? validImages : [fallbackSrc];

  // Set up auto-play functionality
  useEffect(() => {
    // Only set up the slideshow if there are multiple images
    if (displayImages.length > 1 && !isPaused) {
      slideIntervalRef.current = setInterval(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % displayImages.length);
      }, interval);
    }

    // Clean up interval on unmount or when paused
    return () => {
      if (slideIntervalRef.current) {
        clearInterval(slideIntervalRef.current);
      }
    };
  }, [displayImages, interval, isPaused]);

  // Handle image error by marking the specific image as having an error
  const handleImageError = (index) => {
    setHasError(prev => ({
      ...prev,
      [index]: true
    }));
  };

  // Handle navigation to previous slide
  const goToPrevSlide = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? displayImages.length - 1 : prevIndex - 1
    );
  };

  // Handle navigation to next slide
  const goToNextSlide = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % displayImages.length);
  };

  // Pause the slideshow when mouse enters
  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  // Resume the slideshow when mouse leaves
  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  return (
    <div 
      className={`slideshow-container relative ${className}`} 
      style={{ aspectRatio }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Images */}
      <div className="relative w-full h-full overflow-hidden">
        {displayImages.map((src, index) => {
          const imageSource = hasError[index] ? fallbackSrc : src;
          
          return (
            <img
              key={`${src}-${index}`}
              src={imageSource}
              alt={`${alt} ${index + 1}`}
              style={{ 
                objectFit,
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: index === currentImageIndex ? 1 : 0,
                transition: 'opacity 0.5s ease-in-out',
                zIndex: index === currentImageIndex ? 1 : 0
              }}
              onError={() => handleImageError(index)}
              loading={index === 0 ? "eager" : "lazy"}
            />
          );
        })}
      </div>

      {/* Navigation arrows - only show if more than one image */}
      {displayImages.length > 1 && (
        <>
          <button 
            className="absolute left-0 top-0 bottom-0 z-10 w-8 flex items-center justify-center bg-gradient-to-r from-black/10 to-transparent hover:from-black/20 transition-colors"
            onClick={goToPrevSlide}
            aria-label="Previous image"
          >
            <ChevronLeft size={20} className="text-white drop-shadow-md" />
          </button>

          <button 
            className="absolute right-0 top-0 bottom-0 z-10 w-8 flex items-center justify-center bg-gradient-to-l from-black/10 to-transparent hover:from-black/20 transition-colors"
            onClick={goToNextSlide}
            aria-label="Next image"
          >
            <ChevronRight size={20} className="text-white drop-shadow-md" />
          </button>
        </>
      )}

      {/* Navigation dots - only show if more than one image */}
      {displayImages.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center z-10">
          <div className="flex gap-1.5 bg-black/20 backdrop-blur-sm rounded-full px-2 py-1">
            {displayImages.map((_, index) => (
              <button
                key={`dot-${index}`}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/40'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setCurrentImageIndex(index);
                }}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

ImageSlideshow.propTypes = {
  images: PropTypes.arrayOf(PropTypes.string),
  alt: PropTypes.string,
  className: PropTypes.string,
  fallbackSrc: PropTypes.string,
  aspectRatio: PropTypes.string,
  objectFit: PropTypes.string,
  interval: PropTypes.number
};

export default ImageSlideshow;





