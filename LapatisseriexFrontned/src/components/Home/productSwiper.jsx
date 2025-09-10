import React, { useState, useEffect, useRef } from 'react';
import ProductCard from './ProductCard';

const ProductSwiperHome = ({ categories = [] }) => {
  const products = categories.map((cat) => cat.firstProduct).filter(Boolean);
  const scrollContainerRef = useRef(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [userInteracted, setUserInteracted] = useState(false);
  const autoScrollRef = useRef(null);

  // Auto-scroll functionality
  useEffect(() => {
    if (!isAutoScrolling || products.length === 0) return;

    const startAutoScroll = () => {
      autoScrollRef.current = setInterval(() => {
        if (scrollContainerRef.current && !userInteracted) {
          const container = scrollContainerRef.current;
          const cardWidth = container.children[0]?.offsetWidth || 0;
          const gap = 16; // 1rem gap
          const scrollAmount = cardWidth + gap;
          
          // Check if we're at the end
          if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 10) {
            // Reset to beginning
            container.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            // Scroll to next item
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
          }
        }
      }, 3000); // 3 seconds
    };

    startAutoScroll();

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, [isAutoScrolling, products.length, userInteracted]);

  // Handle user interaction
  const handleUserInteraction = () => {
    setUserInteracted(true);
    setIsAutoScrolling(false);
    
    // Resume auto-scroll after 5 seconds of no interaction
    setTimeout(() => {
      setUserInteracted(false);
      setIsAutoScrolling(true);
    }, 5000);
  };

  // Handle scroll events
  const handleScroll = () => {
    handleUserInteraction();
  };

  // Handle touch events
  const handleTouchStart = () => {
    handleUserInteraction();
  };

  if (!products.length) {
    return (
      <div className="text-center text-gray-500 py-4">
        No products available.
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-screen-xl mx-auto px-4 sm:px-6 md:px-8">
      {/* Scrollable products container */}
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide scroll-smooth"
        style={{
          scrollbarWidth: 'none', /* Firefox */
          msOverflowStyle: 'none', /* IE and Edge */
        }}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onMouseDown={handleUserInteraction}
      >
        {products.map((product, index) => (
          <div 
            key={`${product._id}-${index}`} 
            className="flex-shrink-0 w-64 sm:w-72"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
      
      {/* Scroll hint for mobile */}
      <p className="text-xs text-gray-500 text-center mt-2 sm:hidden">
        Swipe left or right to explore products • Auto-scrolls every 3 seconds
      </p>
      
      {/* Auto-scroll indicator for desktop */}
      <p className="hidden sm:block text-xs text-gray-500 text-center mt-2">
        Products auto-scroll every 3 seconds • Scroll or click to control manually
      </p>
    </div>
  );
};

export default ProductSwiperHome;