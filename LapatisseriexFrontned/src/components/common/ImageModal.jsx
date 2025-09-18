import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

/**
 * A modern, aesthetic image modal with blur background
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
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset to initial index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsZoomed(false);
      setImageLoaded(false);
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup
    return () => {
      document.body.style.overflow = 'unset';
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
        case ' ':
          e.preventDefault();
          toggleZoom();
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
    setImageLoaded(false);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const handlePrevious = () => {
    if (isZoomed) return;
    setImageLoaded(false);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  // Touch event handlers for swipe
  const handleTouchStart = (e) => {
    if (isZoomed) return;
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    setTouchEnd(null);
  };

  const handleTouchMove = (e) => {
    if (isZoomed) return;
    setTouchEnd({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || isZoomed) return;
    
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Blur Background Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-xl"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div 
        className="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden max-w-4xl max-h-[90vh] w-full mx-auto animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200/50 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900 truncate max-w-xs">
              {productName}
            </h3>
            {images.length > 1 && (
              <span className="text-sm text-gray-500 px-2 py-1 bg-gray-100 rounded-full">
                {currentIndex + 1} / {images.length}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleZoom}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
              title={isZoomed ? "Zoom out" : "Zoom in"}
            >
              {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Image Container */}
        <div className="relative bg-gradient-to-br from-gray-50 to-white">
          {/* Loading Skeleton */}
          {!imageLoaded && (
            <div className="flex items-center justify-center h-96">
              <div className="animate-pulse bg-gray-200 rounded-lg w-full h-full"></div>
            </div>
          )}
          
          <div 
            className={`flex items-center justify-center transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ minHeight: imageLoaded ? 'auto' : '24rem' }}
          >
            {/* Navigation arrows */}
            {images.length > 1 && !isZoomed && (
              <>
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white/90 text-gray-700 hover:text-gray-900 z-10 transition-all duration-200 hover:scale-105"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevious();
                  }}
                  title="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white/90 text-gray-700 hover:text-gray-900 z-10 transition-all duration-200 hover:scale-105"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  title="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
            
            {/* Image */}
            <div 
              className={`cursor-${isZoomed ? 'zoom-out' : 'zoom-in'} p-4 transition-transform duration-300 ${
                isZoomed ? 'overflow-auto' : 'overflow-hidden'
              }`}
              onClick={toggleZoom}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ maxHeight: '70vh' }}
            >
              <img 
                src={images[currentIndex]} 
                alt={`${productName} - Image ${currentIndex + 1}`}
                className={`max-w-full h-auto object-contain rounded-lg transition-transform duration-500 ${
                  isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
                }`}
                style={{ 
                  maxHeight: isZoomed ? 'none' : '60vh',
                  transformOrigin: 'center center'
                }}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
              />
            </div>
          </div>
        </div>
        
        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-gray-200/50">
            <div className="flex justify-center gap-2 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button 
                  key={idx}
                  className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all duration-200 ${
                    idx === currentIndex 
                      ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-white scale-105' 
                      : 'hover:scale-105 hover:ring-2 hover:ring-gray-300 hover:ring-offset-2 hover:ring-offset-white'
                  }`}
                  onClick={() => {
                    setImageLoaded(false);
                    setCurrentIndex(idx);
                    setIsZoomed(false);
                  }}
                >
                  <img 
                    src={img} 
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {idx === currentIndex && (
                    <div className="absolute inset-0 bg-amber-500/20"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Instructions */}
        <div className="px-4 py-2 text-center text-xs text-gray-500 bg-gray-50/80 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <span>{isZoomed ? "Click to zoom out" : "Click to zoom in"}</span>
            {images.length > 1 && (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">Use arrows or swipe to navigate</span>
              </>
            )}
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Press ESC to close</span>
          </div>
        </div>
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