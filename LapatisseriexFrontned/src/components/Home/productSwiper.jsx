import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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
      <div className="text-center text-black py-4">
        No products available.
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-screen-xl mx-auto px-4 sm:px-6 md:px-8">
      {/* Mobile: Vertical Stack Layout */}
      <div className="block md:hidden">
        <div className="space-y-3">
          {products.slice(0, 8).map((product, index) => (
            <div 
              key={`mobile-${product._id}-${index}`} 
              className="w-full"
            >
              <ProductCard product={product} className="w-full h-auto" compact={true} />
            </div>
          ))}
        </div>
        
        {/* Show more products link for mobile */}
        {products.length > 8 && (
          <div className="text-center mt-4">
            <Link to="/products" className="inline-flex items-center px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm">
              View All Products
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        )}
      </div>

      {/* Desktop: Horizontal Scrollable Layout */}
      <div className="hidden md:block">
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
              key={`desktop-${product._id}-${index}`} 
              className="flex-shrink-0 w-64 h-[420px]"
            >
              <ProductCard product={product} className="h-full" />
            </div>
          ))}
        </div>
        
        {/* Auto-scroll indicator for desktop */}
        <p className="text-xs text-black text-center mt-2">
          Products auto-scroll every 3 seconds • Scroll or click to control manually
        </p>
      </div>
    </div>
  );
};

export default ProductSwiperHome;




