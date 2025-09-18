import React, { useRef, useEffect, useState } from 'react';

const CategorySwiper = ({
  categories = [],
  loading = false,
  error = null,
  selectedCategory = null,
  onSelectCategory = () => {},
}) => {
  const containerRef = useRef(null);
  const categoryRefs = useRef({});
  const isScrollingRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  // Set mounted flag after initial render
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-scroll to active category when selectedCategory changes
  useEffect(() => {
    if (!containerRef.current || !mounted) return;

    // Function to check if we need auto-scroll (mobile/tablet devices)
    const shouldAutoScroll = () => {
      return window.innerWidth < 1024; // Auto-scroll for devices smaller than large screens
    };

    // Only auto-scroll on smaller devices
    if (!shouldAutoScroll()) return;

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      let targetElement = null;
      
      if (selectedCategory === null) {
        // "All Categories" is selected
        targetElement = categoryRefs.current['all'];
      } else {
        // Specific category is selected
        targetElement = categoryRefs.current[selectedCategory];
      }

      if (targetElement && containerRef.current) {
        // Set scrolling flag
        isScrollingRef.current = true;
        
        // Check if element is already in view
        const container = containerRef.current;
        const elementRect = targetElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        const isInView = elementRect.left >= containerRect.left && 
                        elementRect.right <= containerRect.right;

        // Only scroll if element is not in view
        if (!isInView) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            inline: 'center',
            block: 'nearest'
          });
        }
        
        // Reset scrolling flag after animation completes
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 1000);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [selectedCategory, mounted]);

  // Handle window resize to re-check if auto-scroll is needed
  useEffect(() => {
    const handleResize = () => {
      // Trigger re-scroll check on resize if there's a selected category
      if (selectedCategory !== null || selectedCategory === null) {
        // Small delay to let resize complete
        setTimeout(() => {
          const shouldAutoScroll = window.innerWidth < 1024;
          if (shouldAutoScroll && containerRef.current) {
            const targetElement = selectedCategory === null 
              ? categoryRefs.current['all'] 
              : categoryRefs.current[selectedCategory];
            
            if (targetElement) {
              isScrollingRef.current = true;
              
              const container = containerRef.current;
              const elementRect = targetElement.getBoundingClientRect();
              const containerRect = container.getBoundingClientRect();
              
              const isInView = elementRect.left >= containerRect.left && 
                              elementRect.right <= containerRect.right;

              if (!isInView) {
                targetElement.scrollIntoView({
                  behavior: 'smooth',
                  inline: 'center',
                  block: 'nearest'
                });
              }
              
              setTimeout(() => {
                isScrollingRef.current = false;
              }, 1000);
            }
          }
        }, 100);
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
      <h2 className="text-lg font-bold text-black mb-2 text-center sm:text-left">All Categories</h2>

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
          ? categories.map((category) => (
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
                  <div className="w-10 h-10 rounded-full overflow-hidden mb-1 border border-gray-200 shadow-sm">
                    <img
                      src={category.featuredImage || (category.images?.[0] || '')}
                      alt={category.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = '/images/cake-logo.png';
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
      {!loading && categories.length > 0 && (
        <div className="text-center text-xs text-gray-500 mt-2 lg:hidden">
          Swipe to see more categories
        </div>
      )}
    </div>
  );
};

CategorySwiper.displayName = 'CategorySwiper';

export default CategorySwiper;