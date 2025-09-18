import React, { useRef, useEffect, useState } from 'react';

const TextCategoryBar = ({
  categories = [],
  loading = false,
  error = null,
  selectedCategory = null,
  onSelectCategory = () => {},
}) => {
  const containerRef = useRef(null);
  const categoryRefs = useRef({});
  const isScrollingRef = useRef(false);
  const userInteractingRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  // Set mounted flag after initial render
  useEffect(() => {
    setMounted(true);
  }, []);

  // Detect user touch interactions to prevent auto-scroll during user interaction
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = () => {
      userInteractingRef.current = true;
    };

    const handleTouchEnd = () => {
      setTimeout(() => {
        userInteractingRef.current = false;
      }, 1000);
    };

    const handleScroll = () => {
      if (!userInteractingRef.current) {
        userInteractingRef.current = true;
        setTimeout(() => {
          userInteractingRef.current = false;
        }, 1000);
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Auto-scroll to active category when selectedCategory changes
  useEffect(() => {
    if (!containerRef.current || !mounted || userInteractingRef.current) return;

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      // Double-check user isn't interacting
      if (userInteractingRef.current) return;
      
      let targetElement = null;
      
      if (selectedCategory === null) {
        // "All Categories" is selected
        targetElement = categoryRefs.current['all'];
      } else {
        // Specific category is selected
        targetElement = categoryRefs.current[selectedCategory];
      }

      if (targetElement && containerRef.current && !isScrollingRef.current && !userInteractingRef.current) {
        // Check if element is already in view
        const container = containerRef.current;
        const elementRect = targetElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        const isInView = elementRect.left >= containerRect.left && 
                        elementRect.right <= containerRect.right;

        // Only scroll if element is not in view
        if (!isInView) {
          const scrollLeft = targetElement.offsetLeft - (container.clientWidth / 2) + (targetElement.clientWidth / 2);
          container.scrollTo({
            left: scrollLeft,
            behavior: 'smooth'
          });
        }
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selectedCategory, mounted]);

  const handleAllCategories = () => {
    onSelectCategory(null);
  };

  return (
    <div className="w-full bg-white relative">
      {/* Scrollable categories container - responsive layout */}
      <div
        ref={containerRef}
        className="flex overflow-x-auto space-x-4 md:space-x-6 lg:space-x-8 xl:space-x-10 px-4 py-4 scrollbar-hide scroll-smooth relative z-10 justify-start md:justify-center"
        style={{
          scrollbarWidth: 'none', /* Firefox */
          msOverflowStyle: 'none', /* IE and Edge */
        }}
      >
        {/* "All Categories" button as the first item */}
        {!loading && (
          <div
            ref={(el) => categoryRefs.current['all'] = el}
            className={`flex-shrink-0 cursor-pointer transition-all duration-300 relative group ${
              selectedCategory === null 
                ? 'text-black font-semibold' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={handleAllCategories}
          >
            <span className="text-sm md:text-base whitespace-nowrap py-3 px-1 relative">
              All Categories
              {/* Hover effect underline */}
              <div className={`absolute bottom-1 left-1 right-1 h-0.5 bg-gray-300 transition-all duration-300 ${
                selectedCategory === null ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
              }`} />
            </span>
            {/* Active state underline */}
            <div 
              className={`absolute bottom-1 left-1 right-1 h-0.5 bg-black transition-all duration-300 ${
                selectedCategory === null ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
              }`}
            />
          </div>
        )}

        {loading
          ? Array(5)
              .fill(0)
              .map((_, index) => (
                <div key={`loading-${index}`} className="flex-shrink-0">
                  <div className="w-16 md:w-20 lg:w-24 h-6 md:h-7 bg-gray-200 animate-pulse rounded-md"></div>
                </div>
              ))
          : categories.length > 0
          ? categories.map((category) => (
              <div
                key={category._id || category.id}
                ref={(el) => categoryRefs.current[category._id || category.id] = el}
                className={`flex-shrink-0 cursor-pointer transition-all duration-300 relative group ${
                  selectedCategory === (category._id || category.id) 
                    ? 'text-black font-semibold' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => onSelectCategory(category._id || category.id)}
              >
                <span className="text-sm md:text-base whitespace-nowrap py-3 px-1 relative">
                  {category.name}
                  {/* Hover effect underline */}
                  <div className={`absolute bottom-1 left-1 right-1 h-0.5 bg-gray-300 transition-all duration-300 ${
                    selectedCategory === (category._id || category.id) ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                  }`} />
                </span>
                {/* Active state underline */}
                <div 
                  className={`absolute bottom-1 left-1 right-1 h-0.5 bg-black transition-all duration-300 ${
                    selectedCategory === (category._id || category.id) ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                  }`}
                />
              </div>
            ))
          : error ? (
            <div className="flex-shrink-0">
              <div className="text-center text-sm text-red-500 py-3 px-4">Failed to load categories</div>
            </div>
          ) : (
            <div className="flex-shrink-0">
              <div className="text-center text-sm text-gray-500 py-3 px-4">No categories available</div>
            </div>
          )}
      </div>
      
      {/* Subtle scroll indicators */}
      <div className="absolute top-0 left-0 w-6 h-full bg-gradient-to-r from-white to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-6 h-full bg-gradient-to-l from-white to-transparent pointer-events-none" />
    </div>
  );
};

TextCategoryBar.displayName = 'TextCategoryBar';

export default TextCategoryBar;
