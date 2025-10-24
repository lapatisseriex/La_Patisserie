import React, { useState, useEffect, useRef, useCallback } from 'react';

const AdvertisementBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const advertisements = [
    { id: 1, type: 'image', src: '/jk.png' },
    { id: 2, type: 'image', src: '/images/Brown.png' },
    { id: 3, type: 'image', src: '/images/Yellow and Brown Organic Abstract Food YouTube Thumbnail.png' },
  ];
  const intervalRef = useRef(null);

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying && advertisements.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % advertisements.length);
      }, 4000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isAutoPlaying, advertisements.length]);

  // Touch start
  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setIsAutoPlaying(false);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    const diff = currentX - startX;
    const threshold = 50;
    if (Math.abs(diff) > threshold) {
      setCurrentSlide((prev) =>
        diff > 0 ? (prev - 1 + advertisements.length) % advertisements.length : (prev + 1) % advertisements.length
      );
    }
    setIsDragging(false);
    setIsAutoPlaying(true);
  };

  // Mouse drag (for desktop)
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setIsAutoPlaying(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setCurrentX(e.clientX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    const diff = currentX - startX;
    const threshold = 50;
    if (Math.abs(diff) > threshold) {
      setCurrentSlide((prev) =>
        diff > 0 ? (prev - 1 + advertisements.length) % advertisements.length : (prev + 1) % advertisements.length
      );
    }
    setIsDragging(false);
    setIsAutoPlaying(true);
  };

  return (
    <div
      className="relative w-full overflow-hidden select-none bg-white"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => setIsDragging(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Carousel Container */}
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{
          transform: `translateX(-${currentSlide * 100}%)`,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        {advertisements.map((ad, index) => (
          <div key={ad.id} className="w-full flex-shrink-0 relative">
            <div className="w-full h-64 sm:h-80 md:h-96 lg:h-[450px] xl:h-[500px] overflow-hidden">
              {ad.type === 'image' ? (
                <img
                  src={ad.src}
                  alt={`Advertisement ${index + 1}`}
                  className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
                  draggable={false}
                  onError={(e) => {
                    e.target.src = '/placeholder-image.jpg';
                  }}
                />
              ) : (
                <video
                  src={ad.src}
                  className="w-full h-full object-cover object-center"
                  autoPlay
                  muted
                  loop
                  playsInline
                  draggable={false}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Dots Indicator */}
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        {advertisements.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              index === currentSlide ? 'bg-[#733857] scale-125' : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Smooth animation styles */}
      <style>{`
        img,
        video {
          -webkit-user-drag: none;
          user-select: none;
          pointer-events: none;
        }
        
        .cursor-grab:active {
          cursor: grabbing;
        }
        
        .touch-pan-x {
          touch-action: pan-x;
        }
      `}</style>
    </div>
  );
};

export default AdvertisementBanner;
