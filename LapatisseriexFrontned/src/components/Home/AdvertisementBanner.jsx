import React, { useState, useEffect, useRef, useCallback } from 'react';

const AdvertisementBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const intervalRef = useRef(null);
  const carouselRef = useRef(null);

  // Advertisement data with multiple banners
  const advertisements = [
    {
      id: 1,
    
       type: 'image',
      src: "/jk.png",
     
    },
    {
      id: 2,
      type: 'image',
      src: '/images/Brown.png',
      
    },{
      id:3,
       type: 'image',
      src: '/images/Yellow and Brown Organic Abstract Food YouTube Thumbnail.png',
    }
  ];

  // Auto-slide functionality
  useEffect(() => {
    if (isAutoPlaying && !isDragging && advertisements.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % advertisements.length);
      }, 4000); // 4 seconds per slide
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoPlaying, isDragging, advertisements.length]);

  // Navigation functions
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % advertisements.length);
  }, [advertisements.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + advertisements.length) % advertisements.length);
  }, [advertisements.length]);

  const goToSlide = useCallback((index) => {
    setCurrentSlide(index);
  }, []);

  // Simplified touch/swipe handlers
  const handleTouchStart = useCallback((e) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setIsAutoPlaying(false);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    setCurrentX(e.touches[0].clientX);
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    
    const diff = currentX - startX;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        prevSlide();
      } else {
        nextSlide();
      }
    }

    setIsDragging(false);
    setDragOffset(0);
    setTimeout(() => setIsAutoPlaying(true), 100);
  }, [isDragging, currentX, startX, nextSlide, prevSlide]);

  // Simple click handlers for navigation
  const handlePrevClick = (e) => {
    e.stopPropagation();
    prevSlide();
  };

  const handleNextClick = (e) => {
    e.stopPropagation();
    nextSlide();
  };

  // Pause autoplay on hover
  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
  };

  const handleMouseLeave = () => {
    if (!isDragging) {
      setIsAutoPlaying(true);
    }
  };



  return (
    <div 
      className="relative w-full max-w-full overflow-hidden select-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Carousel Container */}
      <div 
        ref={carouselRef}
        className="flex transition-transform duration-500 ease-out"
        style={{ 
          transform: `translateX(-${currentSlide * 100}%)`,
          transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {advertisements.map((ad, index) => (
          <div key={ad.id} className="w-full flex-shrink-0 relative">
            {/* Fixed height banner for consistent display */}
            <div className="relative w-full h-64 sm:h-72 md:h-80 lg:h-96 xl:h-[450px] overflow-hidden">
              {ad.type === 'image' ? (
                <img
                  src={ad.src}
                  alt={ad.alt}
                  className="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-105"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  draggable={false}
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    e.target.src = '/placeholder-image.jpg';
                  }}
                />
              ) : ad.type === 'video' ? (
                <video
                  src={ad.src}
                  className="w-full h-full object-cover object-center"
                  autoPlay
                  muted
                  loop
                  playsInline
                  draggable={false}
                />
              ) : null}
            
              {/* Conditional overlay - lighter for sale banner, darker for others */}
              {ad.id !== 1 && (
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                  <div className="text-center text-white px-2 sm:px-4">
                    <h2 className="text-lg sm:text-2xl md:text-4xl lg:text-5xl font-light mb-2 text-white">
                      {ad.title}
                    </h2>
                    <p className="text-xs sm:text-sm md:text-lg lg:text-xl text-white/90">
                      {ad.subtitle}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Light overlay for the sale banner to preserve readability */}
              {ad.id === 1 && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent flex items-end justify-center pb-4 sm:pb-6 md:pb-8">
                  <div className="text-center text-white px-2 sm:px-4">
                    <p className="text-xs sm:text-sm md:text-base lg:text-lg text-white/90 bg-black/40 px-2 sm:px-4 py-1 sm:py-2 rounded-lg backdrop-blur-sm">
                      {ad.subtitle}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Minimal Navigation Arrows */}
      <button
        onClick={handlePrevClick}
        className="absolute left-1 sm:left-2 top-1/2 transform -translate-y-1/2 bg-white/70 hover:bg-white/90 text-gray-700 p-1.5 sm:p-2 rounded-full shadow-sm hover:shadow-md transition-all duration-200 group z-20 backdrop-blur-sm opacity-80 hover:opacity-100"
        aria-label="Previous slide"
      >
        <svg className="w-3 h-3 sm:w-4 sm:h-4 transform group-hover:-translate-x-0.5 transition-transform duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <button
        onClick={handleNextClick}
        className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 bg-white/70 hover:bg-white/90 text-gray-700 p-1.5 sm:p-2 rounded-full shadow-sm hover:shadow-md transition-all duration-200 group z-20 backdrop-blur-sm opacity-80 hover:opacity-100"
        aria-label="Next slide"
      >
        <svg className="w-3 h-3 sm:w-4 sm:h-4 transform group-hover:translate-x-0.5 transition-transform duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        {advertisements.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'bg-white scale-125 shadow-lg'
                : 'bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>



      {/* Smooth animation styles */}
      <style jsx>{`        
        .cursor-grab:active {
          cursor: grabbing;
        }
        
        @media (max-width: 640px) {
          .touch-pan-y {
            touch-action: pan-y;
          }
        }
      `}</style>
    </div>
  );
};

export default AdvertisementBanner;