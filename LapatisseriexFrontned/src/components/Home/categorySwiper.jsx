import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const CategorySwiperHome = ({ 
  categories = [], 
  loading, 
  selectedCategory = null, 
  onSelectCategory 
}) => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoScrollIntervalRef = useRef(null);
  const userScrollTimeoutRef = useRef(null);

  // Auto-scroll functionality
  useEffect(() => {
    if (!categories.length || isUserScrolling) return;

    // Start auto-scroll
    const startAutoScroll = () => {
      autoScrollIntervalRef.current = setInterval(() => {
        if (!isUserScrolling && scrollContainerRef.current) {
          const container = scrollContainerRef.current;
          const cardWidth = 280 + 24; // card width + gap
          const maxScrollLeft = container.scrollWidth - container.clientWidth;
          
          setCurrentIndex(prevIndex => {
            const nextIndex = prevIndex >= categories.length - 1 ? 0 : prevIndex + 1;
            const scrollLeft = nextIndex * cardWidth;
            
            // If we've reached the end, scroll back to start smoothly
            if (scrollLeft >= maxScrollLeft) {
              container.scrollTo({ left: 0, behavior: 'smooth' });
              return 0;
            } else {
              container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
              return nextIndex;
            }
          });
        }
      }, 3000); // 3 seconds
    };

    startAutoScroll();

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, [categories.length, isUserScrolling]);

  // Handle user scroll interaction
  const handleUserScroll = () => {
    setIsUserScrolling(true);
    
    // Clear existing timeout
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }
    
    // Clear auto-scroll interval
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
    }
    
    // Resume auto-scroll after 5 seconds of no user interaction
    userScrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 5000);
  };

  // Clean up timeouts and intervals on unmount
  useEffect(() => {
    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cakePink mx-auto"></div>
      </div>
    );
  }

  if (!categories.length) {
    return (
      <div className="text-center text-gray-500 py-4">
        No categories found.
      </div>
    );
  }

  const handleCategoryClick = (categoryId) => {
    // Update the URL with the selected category and ensure navigation is synchronous
    navigate(`/products?category=${categoryId}`, { replace: true });
    
    // Call the onSelectCategory callback if provided
    if (onSelectCategory) {
      onSelectCategory(categoryId);
    }
  };

  return (
    <div className="relative w-full max-w-screen-xl mx-auto px-4 sm:px-6 md:px-8">
      {/* Scrollable container */}
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto scrollbar-hide"
        onScroll={handleUserScroll}
        onTouchStart={handleUserScroll}
        onMouseDown={handleUserScroll}
      >
        <div className="flex space-x-4 sm:space-x-6 pb-4" style={{ minWidth: 'max-content' }}>
          {categories.map(category => {
            const isSelected = selectedCategory === category._id;
            return (
              <div
                key={category._id}
                onClick={() => handleCategoryClick(category._id)}
                className={`bg-white rounded-xl shadow-md transition-all duration-300 cursor-pointer overflow-hidden flex-shrink-0 ${
                  isSelected ? 'ring-2 ring-cakePink' : 'hover:shadow-xl hover:scale-105'
                }`}
                style={{ 
                  width: '280px',
                  minWidth: '280px'
                }}
              >
                {/* Category Image */}
                <img
                  src={category.images[0] || '/images/default-category.png'}
                  alt={category.name}
                  className="w-full h-44 sm:h-48 md:h-52 object-cover"
                />
                {/* Category Content */}
                <div className="p-4 sm:p-5 h-[110px] flex flex-col justify-between">
                  <h3 className={`text-base sm:text-lg font-semibold ${isSelected ? 'text-cakePink' : 'text-cakeBrown'}`}>
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-sm text-gray-500 overflow-hidden" 
                       style={{
                         display: '-webkit-box',
                         WebkitLineClamp: 2,
                         WebkitBoxOrient: 'vertical',
                       }}>
                      {category.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Scroll hint for desktop */}
      <div className="hidden md:block text-center mt-2">
        <p className="text-xs text-gray-400">
          {isUserScrolling 
            ? "← Scroll horizontally to explore all categories →" 
            : "🔄 Auto-scrolling every 3 seconds • Touch to scroll manually →"
          }
        </p>
      </div>
    </div>
  );
};

export default CategorySwiperHome;