import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * A luxurious, professional full-screen modal for displaying product images
 * Features: fade/scale animations, zoom functionality, elegant navigation
 */
const ProductImageModal = ({ 
  isOpen, 
  onClose, 
  images = [], 
  initialIndex = 0 
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const imageRef = useRef(null);
  const modalRef = useRef(null);

  // Animation and visibility handling
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsZoomed(false);
      document.body.style.overflow = 'hidden';
      // Hide header and floating cart on large screens while modal is open
      document.body.classList.add('image-modal-open');
      
      // Trigger entrance animation
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      document.body.style.overflow = '';
      document.body.classList.remove('image-modal-open');
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('image-modal-open');
    };
  }, [isOpen, initialIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          handleClose();
          break;
        case 'ArrowLeft':
          if (!isZoomed) handlePrevious();
          break;
        case 'ArrowRight':
          if (!isZoomed) handleNext();
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
  }, [isOpen, currentIndex, images.length, isZoomed]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 200); // Wait for exit animation
  };

  const handleNext = () => {
    if (isZoomed || images.length <= 1) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const handlePrevious = () => {
    if (isZoomed || images.length <= 1) return;
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    if (isZoomed) return;
    setTouchStart({ 
      x: e.touches[0].clientX, 
      y: e.touches[0].clientY 
    });
    setTouchEnd(null);
  };

  const handleTouchMove = (e) => {
    if (isZoomed) return;
    setTouchEnd({ 
      x: e.touches[0].clientX, 
      y: e.touches[0].clientY 
    });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || isZoomed) return;
    
    const xDiff = touchStart.x - touchEnd.x;
    const yDiff = touchStart.y - touchEnd.y;
    
    // Only register horizontal swipes
    if (Math.abs(xDiff) > Math.abs(yDiff) && Math.abs(xDiff) > 50) {
      if (xDiff > 0) {
        handleNext();
      } else {
        handlePrevious();
      }
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Handle background click to close
  const handleBackgroundClick = (e) => {
    // Close if clicking on the modal background or any non-interactive area
    if (e.target === modalRef.current || e.target.classList.contains('modal-backdrop')) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Hide bottom navigation on mobile when modal is open */}
      <style>{`
        @media (max-width: 768px) {
          body.image-modal-open .md\\:hidden.fixed.bottom-0.z-50,
          body.image-modal-open div[class*="bottom-0"][class*="z-50"],
          body.image-modal-open nav.fixed.bottom-0 {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
          }
        }
      `}</style>
      
      <div 
        ref={modalRef}
        className={`modal-backdrop fixed inset-0 z-[1000] flex items-center justify-center transition-all duration-300 ease-out ${
          isVisible 
            ? 'bg-black/90 backdrop-blur-sm' 
            : 'bg-black/0 backdrop-blur-none'
        }`}
      onClick={handleBackgroundClick}
    >
      {/* Close Button - Made more visible and prominent */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-black/80 hover:text-black transition-all duration-200 shadow-lg group"
        aria-label="Close modal"
      >
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          className="transform group-hover:rotate-90 transition-transform duration-200"
        >
          <path 
            d="M18 6L6 18M6 6L18 18" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Close hint text */}
      <div className="absolute top-20 right-4 z-10 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium opacity-70">
        Press ESC or click anywhere to close
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && !isZoomed && (
        <>
          {/* Previous Button */}
          <button
            onClick={handlePrevious}
            className="absolute left-6 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all duration-200 backdrop-blur-sm group"
            aria-label="Previous image"
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none"
              className="transform group-hover:-translate-x-0.5 transition-transform duration-200"
            >
              <path 
                d="M15 18L9 12L15 6" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Next Button */}
          <button
            onClick={handleNext}
            className="absolute right-6 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all duration-200 backdrop-blur-sm group"
            aria-label="Next image"
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none"
              className="transform group-hover:translate-x-0.5 transition-transform duration-200"
            >
              <path 
                d="M9 18L15 12L9 6" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </>
      )}

      {/* Main Content Panel: large white card on md+, simple on mobile */}
      <div 
        className={`relative transition-all duration-300 ease-out ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        } max-w-[95vw] max-h-[95vh] md:max-w-[85vw]`}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="md:bg-white md:rounded-2xl md:shadow-2xl md:border md:border-gray-200 md:p-4 flex md:gap-4">
          {/* Big image area */}
          <div className="relative">
            <div className="relative cursor-pointer group overflow-hidden rounded-2xl" onClick={toggleZoom}>
              <img
                ref={imageRef}
                src={images[currentIndex]}
                alt={`Product image ${currentIndex + 1}`}
                className={`block w-auto h-auto max-w-[90vw] max-h-[85vh] md:max-w-[70vw] md:max-h-[75vh] object-contain rounded-2xl transition-all duration-500 ease-out ${
                  isZoomed ? 'scale-150 cursor-grab active:cursor-grabbing' : 'scale-100'
                }`}
                style={{ filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.3))' }}
                draggable={false}
              />
              {!isZoomed && (
                <div className="absolute inset-0 hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/5 rounded-2xl">
                  <div className="bg-black/40 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center space-x-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                      <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2"/>
                      <path d="M8 11h6M11 8v6" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <span>Click to zoom</span>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile counter (hidden on md+) */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/40 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium md:hidden">
                {currentIndex + 1} / {images.length}
              </div>
            )}

            {isZoomed && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/40 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center space-x-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                  <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8 11h6" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span>Click to zoom out</span>
              </div>
            )}
          </div>

          {/* Right-side thumbnails (desktop only) */}
          {images.length > 1 && (
            <div className="hidden md:flex flex-col justify-start items-start pt-2 pr-1">
              <div className="flex gap-3">
                {images.map((thumb, idx) => (
                  <button
                    key={idx}
                    onClick={() => !isZoomed && setCurrentIndex(idx)}
                    className={`w-20 h-20 rounded-md overflow-hidden border-2 transition-all duration-200 ${
                      idx === currentIndex ? 'border-black shadow' : 'border-gray-200 hover:border-gray-400'
                    } ${isZoomed ? 'cursor-default opacity-60' : 'cursor-pointer'}`}
                    aria-label={`View image ${idx + 1}`}
                    title={`Image ${idx + 1}`}
                  >
                    <img src={thumb} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Dots Navigation */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-0.5 md:hidden">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => !isZoomed && setCurrentIndex(idx)}
              className={`w-0.5 h-0.5 rounded-full transition-all duration-300 ${
                idx === currentIndex 
                  ? 'bg-white w-3' 
                  : 'bg-white/20 hover:bg-white/35'
              } ${isZoomed ? 'cursor-default' : 'cursor-pointer'}`}
              aria-label={`Go to image ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
    </>
  );
};

ProductImageModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  images: PropTypes.arrayOf(PropTypes.string).isRequired,
  initialIndex: PropTypes.number,
};

export default ProductImageModal;