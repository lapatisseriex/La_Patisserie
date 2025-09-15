import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * A full-screen modal for displaying product images with swipe and zoom functionality
 */
const ImageModal = ({ 
  isOpen, 
  onClose, 
  images = [], 
  initialIndex = 0,
  productName = 'Product'
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Reset to initial index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsZoomed(false);
      
      // Add body class to prevent scrolling when modal is open
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    
    // Cleanup
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen, initialIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length, onClose]);

  const handleNext = () => {
    if (isZoomed) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const handlePrevious = () => {
    if (isZoomed) return;
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  // Touch event handlers for swipe
  const handleTouchStart = (e) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    setTouchEnd(null);
  };

  const handleTouchMove = (e) => {
    setTouchEnd({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const xDiff = touchStart.x - touchEnd.x;
    const yDiff = touchStart.y - touchEnd.y;
    
    // Only register as a swipe if movement is primarily horizontal
    if (Math.abs(xDiff) > Math.abs(yDiff) && Math.abs(xDiff) > 50) {
      if (xDiff > 0) {
        handleNext(); // Swipe left
      } else {
        handlePrevious(); // Swipe right
      }
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-95 flex flex-col"
      onClick={onClose}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between text-white" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-medium truncate">{productName}</h3>
        <div className="flex items-center">
          <span className="text-sm mr-4">{currentIndex + 1} / {images.length}</span>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-800 transition-colors"
            aria-label="Close modal"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Image Container */}
      <div 
        className="flex-grow flex items-center justify-center relative"
        onClick={(e) => {
          e.stopPropagation();
          toggleZoom();
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation arrows */}
        {images.length > 1 && !isZoomed && (
          <>
            <button
              className="absolute left-4 p-3 rounded-full bg-black bg-opacity-50 text-white z-10"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              aria-label="Previous image"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              className="absolute right-4 p-3 rounded-full bg-black bg-opacity-50 text-white z-10"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              aria-label="Next image"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </>
        )}
        
        {/* Image */}
        <img 
          src={images[currentIndex]} 
          alt={`${productName} - Image ${currentIndex + 1}`}
          className={`max-h-full max-w-full object-contain transition-transform duration-300 ${isZoomed ? 'scale-150' : ''}`}
        />
      </div>
      
      {/* Thumbnails */}
      {images.length > 1 && (
        <div 
          className="p-4 flex justify-center space-x-2 overflow-x-auto bg-black bg-opacity-50"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, idx) => (
            <div 
              key={idx}
              className={`w-16 h-16 rounded-md overflow-hidden cursor-pointer border-2 ${
                idx === currentIndex ? 'border-white' : 'border-transparent'
              }`}
              onClick={() => setCurrentIndex(idx)}
            >
              <img 
                src={img} 
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Instructions */}
      <div className="p-2 text-white text-xs text-center bg-black bg-opacity-50">
        {isZoomed ? "Tap to zoom out" : "Tap to zoom in"} • {images.length > 1 ? "Swipe or use arrows to navigate" : ""}
      </div>
    </div>
  );
};

ImageModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  images: PropTypes.arrayOf(PropTypes.string).isRequired,
  initialIndex: PropTypes.number,
  productName: PropTypes.string
};

export default ImageModal;