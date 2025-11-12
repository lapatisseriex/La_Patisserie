import React, { useRef, useEffect, useState } from 'react';
import { normalizeImageUrl } from '../../utils/imageUtils';

const CategorySwiper = ({
  categories = [],
  loading = false,
  error = null,
  selectedCategory = null,
  onSelectCategory = () => {}}) => {
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
      }, 1000); // Wait 1 second after touch ends
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

    // Function to check if we need auto-scroll (only for very small screens)
    const shouldAutoScroll = () => {
      return window.innerWidth < 640; // Only auto-scroll on mobile phones, not tablets
    };

    // Only auto-scroll on very small devices and only if not currently scrolling
    if (!shouldAutoScroll() || isScrollingRef.current) return;

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

        // Only scroll if element is not in view and use horizontal-only scrolling
        if (!isInView) {
          // Use manual scroll to avoid affecting page scroll
          const scrollLeft = targetElement.offsetLeft - (container.clientWidth / 2) + (targetElement.clientWidth / 2);
          container.scrollTo({
            left: scrollLeft,
            behavior: 'smooth'
          });
        }
      }
    }, 300); // Increased delay to give more time for user interactions

    return () => clearTimeout(timeoutId);
  }, [selectedCategory, mounted]);

  // Handle window resize to re-check if auto-scroll is needed
  useEffect(() => {
    const handleResize = () => {
      // Minimal resize handling - only for very specific cases
      if (window.innerWidth >= 640) {
        // If screen gets larger, no need for auto-scroll
        return;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedCategory]);

  // Handler for "All Categories" selection
  const handleAllCategories = () => {
    onSelectCategory(null); // Passing null to indicate all categories
  };

  // Debug: Log the selected category
  useEffect(() => {
    console.log('CategorySwiper received selectedCategory:', selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="max-w-[95%] mx-auto py-2">
      {/* Keep semantic heading but visually hide to avoid extra height in sticky bar */}
      <h2 className="sr-only">All Categories</h2>

      {/* Scrollable categories container */}
      <div 
        ref={containerRef}
        className="flex overflow-x-auto space-x-3 pb-2 scrollbar-hide scroll-smooth"
        style={{
          scrollbarWidth: 'none', /* Firefox */
          msOverflowStyle: 'none', /* IE and Edge */
        }}
      >
        {/* "All Categories" button as the first item */}
        {!loading && (
          <div
            ref={(el) => categoryRefs.current['all'] = el}
            className={`flex-shrink-0 w-20 cursor-pointer transition-all duration-200 ${
              selectedCategory === null 
                ? 'border-2 border-black rounded-lg shadow-md' 
                : 'border-2 border-transparent'
            }`}
            onClick={handleAllCategories}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white mb-1 border border-gray-200 shadow-sm">
                <span className="text-xs font-medium text-black">All</span>
              </div>
              <span className="text-xs text-center text-black">All Categories</span>
            </div>
          </div>
        )}

        {loading
          ? Array(5)
              .fill(0)
              .map((_, index) => (
                <div key={`loading-${index}`} className="flex-shrink-0 w-20 h-20">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
                    <div className="w-10 h-2 bg-gray-200 animate-pulse rounded mt-2"></div>
                  </div>
                </div>
              ))
          : categories.length > 0
          ? categories.filter(category => 
              category.name !== '__SPECIAL_IMAGES__' && 
              !category.name?.includes('__SPECIAL_IMAGES__') &&
              !category.name?.includes('_SPEC')
            ).map((category) => (
              <div
                key={category._id || category.id}
                ref={(el) => categoryRefs.current[category._id || category.id] = el}
                className={`flex-shrink-0 w-20 cursor-pointer transition-all duration-200 ${
                  selectedCategory === (category._id || category.id) 
                    ? 'border-2 border-black rounded-lg shadow-md' 
                    : 'border-2 border-transparent'
                }`}
                onClick={() => onSelectCategory(category._id || category.id)}
              >
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full overflow-hidden mb-1 bg-transparent">
                    <img
                      src={normalizeImageUrl(category.featuredImage || (category.images?.[0] || ''))}
                      alt={category.name}
                      className="w-full h-full object-contain"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = '/images/logo.png';
                        e.target.onerror = null;
                      }}
                    />
                  </div>
                  <span className="text-xs text-center text-black line-clamp-1">{category.name}</span>
                </div>
              </div>
            ))
          : error ? (
            <div className="flex-shrink-0">
              <div className="text-center text-xs text-red-500 py-2">Failed to load categories</div>
            </div>
          ) : (
            <div className="flex-shrink-0">
              <div className="text-center text-xs text-black py-2">No categories available</div>
            </div>
          )}
      </div>
      
      {/* Scroll hint for mobile */}
     
    </div>
  );
};

CategorySwiper.displayName = 'CategorySwiper';

export default CategorySwiper;