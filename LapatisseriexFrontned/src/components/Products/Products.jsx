import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton';
import { useProduct } from '../../context/ProductContext/ProductContext';
import { useCategory } from '../../context/CategoryContext/CategoryContext';
import CategorySwiper from './CategorySwiper';
import TextCategoryBar from './TextCategoryBar';

const Products = () => {
  const { fetchProducts } = useProduct();
  const { categories, fetchCategories, loading: loadingCategories, error: categoryError } = useCategory();
  const location = useLocation();
  
  // Initialize with category from URL if present
  const initialCategory = new URLSearchParams(location.search).get('category');

  // Products state organized by categories
  const [productsByCategory, setProductsByCategory] = useState({});
  const [allProducts, setAllProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [activeViewCategory, setActiveViewCategory] = useState(initialCategory);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refs for category sections scrolling
  const categorySectionRef = useRef(null);
  const productsSectionRef = useRef(null);
  const categoryRefs = useRef({});
  
  // Observer for scroll tracking
  const observerRef = useRef(null);
  const isScrollingRef = useRef(false);
  const userInteractingRef = useRef(false);

  // Scroll detection for dynamic sticky behavior
  const [scrollDirection, setScrollDirection] = useState('down');
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [isCategoryStickyActive, setIsCategoryStickyActive] = useState(true);
  const [showTextCategoryBar, setShowTextCategoryBar] = useState(false);
  const lastScrollY = useRef(0);

  // Dynamic header height tracking
  const [headerHeight, setHeaderHeight] = useState(window.innerWidth < 768 ? 75 : 130);
  const [isHeaderTransitioning, setIsHeaderTransitioning] = useState(false);

  // Add state for scrollY debug display
  const [scrollY, setScrollY] = useState(0);

  // Track actual category bar height (text or swiper)
  const [categoryBarHeight, setCategoryBarHeight] = useState(48);
  const textBarRef = useRef(null);
  const swiperBarRef = useRef(null);

  // Initial navigation state - for 10-second non-sticky period when coming from home page
  const [isInitialLoad, setIsInitialLoad] = useState(false);
  const [showInitialNonSticky, setShowInitialNonSticky] = useState(false);
  const stickyTimeoutRef = useRef(null);
  const previousCategoryRef = useRef(null);

  // Function to load products for a specific category
  const loadCategoryProducts = useCallback(async (categoryId) => {
    // Skip if we already have products for this category
    if (productsByCategory[categoryId] && productsByCategory[categoryId].length > 0) {
      return;
    }
    
    try {
      const result = await fetchProducts({
        limit: 20,
        category: categoryId,
        sort: 'createdAt:-1',
      });
      
      // Update the products for this category
      setProductsByCategory(prev => ({
        ...prev,
        [categoryId]: result.products || []
      }));
    } catch (err) {
      console.error(`Error loading products for category ${categoryId}:`, err);
    }
  }, [fetchProducts, productsByCategory]);

  // Measure actual header height dynamically
  useEffect(() => {
    const measureHeaderHeight = () => {
      const header = document.querySelector('header') || document.querySelector('[role="banner"]');
      if (header) {
        const newHeight = header.offsetHeight;
        
        // If height is changing, show transition overlay
        if (newHeight !== headerHeight) {
          setIsHeaderTransitioning(true);
          
          // Hide overlay after transition completes
          setTimeout(() => {
            setIsHeaderTransitioning(false);
          }, 300); // Match typical CSS transition duration
        }
        
        setHeaderHeight(newHeight);
      } else {
        // Fallback to default values
        setHeaderHeight(window.innerWidth < 768 ? 75 : 130);
      }
    };

    // Measure on mount
    measureHeaderHeight();

    // Re-measure on window resize
    const handleResize = () => {
      measureHeaderHeight();
    };

    window.addEventListener('resize', handleResize);
    
    // Also listen for any potential header changes (location bar toggle)
    const observer = new MutationObserver(() => {
      // Use setTimeout to ensure DOM has updated
      setTimeout(measureHeaderHeight, 10);
    });
    
    const header = document.querySelector('header') || document.querySelector('[role="banner"]');
    if (header) {
      observer.observe(header, { childList: true, subtree: true, attributes: true });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [headerHeight]);

  // Measure category bar height dynamically to avoid extra space
  useEffect(() => {
    const measure = () => {
      const textBar = textBarRef.current;
  const swiperBar = swiperBarRef.current;
      let h1 = 0;
      let h2 = 0;
      if (textBar) h1 = textBar.getBoundingClientRect().height;
      if (swiperBar) h2 = swiperBar.getBoundingClientRect().height;
      const newH = Math.max(h1, h2) || 48;
      if (newH !== categoryBarHeight) setCategoryBarHeight(newH);
    };
    measure();
    window.addEventListener('resize', measure);
    const id = setInterval(measure, 500); // guard for late font/layout
    return () => { window.removeEventListener('resize', measure); clearInterval(id); };
  }, [showTextCategoryBar, categoryBarHeight]);

  // Initialize Intersection Observer with lazy loading
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '-20% 0px -30% 0px', // Increased visibility area to preload earlier
      threshold: 0.1, // Lower threshold to detect sooner
    };

    const observerInstance = new IntersectionObserver((entries) => {
      // If we're programmatically scrolling, ignore observer callbacks
      if (isScrollingRef.current) return;
      
      let mostVisibleEntry = null;
      let highestRatio = 0;
      
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // For any intersecting category section, load its products
          const categoryId = entry.target.id.replace('category-section-', '');
          if (categoryId !== 'all') {
            // Start loading category products when it comes into view
            loadCategoryProducts(categoryId);
          }
          
          // Track which one is most visible for active category highlight
          if (entry.intersectionRatio > highestRatio) {
            highestRatio = entry.intersectionRatio;
            mostVisibleEntry = entry;
          }
        }
      });
      
      if (mostVisibleEntry) {
        // Extract category ID from element id
        const categoryId = mostVisibleEntry.target.id.replace('category-section-', '');
        setActiveViewCategory(categoryId === 'all' ? null : categoryId);
      }
    }, options);
    
    observerRef.current = observerInstance;
    
    return () => {
      if (observerInstance) {
        observerInstance.disconnect();
      }
    };
  }, [loadCategoryProducts]);

  // Sync category from URL and detect navigation from home page
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryId = params.get('category');
    console.log('URL changed, categoryId:', categoryId, 'previousCategory:', previousCategoryRef.current);
    
    // Check if this is a category change (different from previous selection)
    const isCategoryChange = categoryId && categoryId !== previousCategoryRef.current;
    console.log('Is category change:', isCategoryChange, 'from:', previousCategoryRef.current, 'to:', categoryId);
    
    if (categoryId) {
      // If this is category change, show non-sticky for 10 seconds
      if (isCategoryChange) {
        console.log('Setting initial non-sticky for 10 seconds');
        
    // Only auto-scroll on larger screens or if coming from a different page
        // Avoid aggressive auto-scroll on mobile that interferes with user scrolling
        if (window.innerWidth >= 768 && !userInteractingRef.current) {
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 100);
        }
        
        // Clear any existing timeout
        if (stickyTimeoutRef.current) {
          clearTimeout(stickyTimeoutRef.current);
        }
        
        setIsInitialLoad(true);
        setShowInitialNonSticky(true);
        setIsCategoryStickyActive(false);
        
        // After 10 seconds, make it sticky
        stickyTimeoutRef.current = setTimeout(() => {
          console.log('10 seconds passed, making sticky again');
          setShowInitialNonSticky(false);
          setIsCategoryStickyActive(true);
        }, 10000);
      }
      
      setSelectedCategory(categoryId);
      setActiveViewCategory(categoryId);
      previousCategoryRef.current = categoryId;
    } else {
      setSelectedCategory(null);
      setActiveViewCategory(null);
      setIsInitialLoad(false);
      setShowInitialNonSticky(false);
      previousCategoryRef.current = null;
    }
  }, [location.search]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (stickyTimeoutRef.current) {
        clearTimeout(stickyTimeoutRef.current);
      }
    };
  }, []);

  // Load categories
  useEffect(() => {
    fetchCategories(false).catch(err => console.error(err));
  }, [fetchCategories]);

  // Setup observers on category sections
  useEffect(() => {
    if (observerRef.current && Object.keys(categoryRefs.current).length > 0) {
      // Disconnect all previous observations
      observerRef.current.disconnect();
      
      // Observe each category section
      Object.values(categoryRefs.current).forEach(ref => {
        if (ref) {
          observerRef.current.observe(ref);
        }
      });
      
      console.log('Observers set up for categories:', Object.keys(categoryRefs.current));
    }
  }, [productsByCategory, allProducts]);

  // Load products more efficiently - load all products first, then only selected category if needed
  // Load products in two stages: first a small batch of general products, then specific categories as needed
  useEffect(() => {
    const loadInitialProducts = async () => {
      if (!categories.length) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Load a minimal set of products for initial display (just 20)
        // This speeds up initial page load significantly
        const allProductsResult = await fetchProducts({
          limit: 20,
          sort: 'createdAt:-1',
        });
        setAllProducts(allProductsResult.products || []);
        
        // Initialize an empty products by category object
        const productsByCat = {};
        
        // If we have a selected category, pre-load only that specific category's products
        // This ensures the user's selected category loads first
        if (selectedCategory) {
          console.log(`Pre-loading selected category: ${selectedCategory}`);
          const result = await fetchProducts({
            limit: 20,
            category: selectedCategory,
            sort: 'createdAt:-1',
          });
          productsByCat[selectedCategory] = result.products || [];
          
          // For visible categories near the selected one, prefetch them in the background
          // This will be handled by the intersection observer instead
        }
        
        setProductsByCategory(productsByCat);
        setIsLoading(false);
        
        // Scroll to selected category if any (on all screens, including mobile)
        if (selectedCategory && !userInteractingRef.current) {
          setTimeout(() => {
            const selectedCategoryRef = categoryRefs.current[selectedCategory];
            if (selectedCategoryRef) {
              // Set scrolling flag to prevent observer from firing
              isScrollingRef.current = true;
              
              // Account for fixed header height
              const elementPosition = selectedCategoryRef.getBoundingClientRect().top + window.pageYOffset;
              const offsetPosition = elementPosition - headerHeight - 20; // Extra 20px buffer
              
              window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
              });
              
              // Reset scrolling flag after animation completes
              setTimeout(() => {
                isScrollingRef.current = false;
              }, 1000);
            }
          }, 500);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load products.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialProducts();
  }, [fetchProducts, categories, selectedCategory]);

  // ========================================================================================
  // SCROLL SWITCHING LOGIC - CONTROLS WHEN CATEGORYSWIPER SWITCHES TO TEXTCATEGORYSWIPER
  // ========================================================================================
  // To MODIFY SWITCHING THRESHOLDS:
  // 1. AT_TOP_THRESHOLD: Controls when scrolling up shows categorySwiper (currently: 60)
  // 2. TEXT_BAR_THRESHOLD: Controls when scrolling down shows textCategorySwiper (currently: 200)
  // 3. STICKY_BAR_THRESHOLD: Controls when categorySwiper becomes sticky (currently: 150)
  //
  // RECOMENDED: Always keep AT_TOP_THRESHOLD < STICKY_BAR_THRESHOLD < TEXT_BAR_THRESHOLD
  // ========================================================================================

  useEffect(() => {
    let ticking = false;
    let scrollTimeout;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          setScrollY(currentScrollY); // Update scrollY for debug display

          // ========================================================================================
          // SWITCHING THRESHOLDS - MODIFY THESE VALUES TO CONTROL SWITCHING BEHAVIOR
          // ========================================================================================
          const AT_TOP_THRESHOLD = 90;        // [MODIFY THIS] When scrollY is below this, show categorySwiper
          const TEXT_BAR_THRESHOLD = 90;     // [MODIFY THIS] When scrollY exceeds this, show textCategorySwiper
          const STICKY_BAR_THRESHOLD = 90;   // [MODIFY THIS] When scrollY exceeds this, make categorySwiper sticky
          // ========================================================================================

          // SMOOTH SWITCHING LOGIC - Prevents ghosting and ensures consistent behavior
          const atTop = currentScrollY <= AT_TOP_THRESHOLD;
          const hasScrolledEnoughForTextBar = currentScrollY >= TEXT_BAR_THRESHOLD;
          const shouldBeSticky = currentScrollY >= STICKY_BAR_THRESHOLD && !hasScrolledEnoughForTextBar;

          // KEY SWITCHING LOGIC: Ensure only ONE bar is visible at a time
          if (atTop) {
            // AT TOP: Show categorySwiper, hide textCategorySwiper
            setShowTextCategoryBar(false);
            setIsCategoryStickyActive(false);
          } else if (hasScrolledEnoughForTextBar) {
            // SCROLLED DOWN ENOUGH: Show textCategorySwiper, hide categorySwiper
            setShowTextCategoryBar(true);
            setIsCategoryStickyActive(false);
          } else if (shouldBeSticky) {
            // TRANSITION ZONE: Show categorySwiper as sticky, hide textCategorySwiper
            setShowTextCategoryBar(false);
            setIsCategoryStickyActive(true);
          } else {
            // DEFAULT FALLBACK: Show categorySwiper without sticky, hide text
            setShowTextCategoryBar(false);
            setIsCategoryStickyActive(false);
          }

          // Track scroll direction for potential future use
          const newDirection = currentScrollY > lastScrollY.current ? 'down' : 'up';
          if (newDirection !== scrollDirection) {
            setScrollDirection(newDirection);
          }

          setIsAtTop(atTop);
          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }

      // Debounce scroll end detection
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        // Handle any scroll end cleanup if needed
      }, 100);
    };

    // Touch interaction handlers for faster response
    const handleTouchStart = () => {
      userInteractingRef.current = true;
    };

    const handleTouchEnd = () => {
      setTimeout(() => {
        userInteractingRef.current = false;
      }, 300); // Optimized for smooth touch scrolling
    };

    // Add scroll event listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      clearTimeout(scrollTimeout);
    };
  }, [scrollDirection]); // Track scrollDirection changes

  const handleSelectCategory = (categoryId) => {
    console.log('Category selected:', categoryId);
    setSelectedCategory(categoryId);
    setActiveViewCategory(categoryId);
    
    // Set scrolling flag to prevent observer from firing
    isScrollingRef.current = true;
    
    // Only auto-scroll on larger screens to avoid interfering with mobile touch scrolling
    if (window.innerWidth >= 768 && !userInteractingRef.current) {
      // Scroll to the selected category section
      setTimeout(() => {
        const targetRef = categoryId 
          ? categoryRefs.current[categoryId]
          : categoryRefs.current['all'];
          
        if (targetRef) {
          const elementPosition = targetRef.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementPosition - headerHeight - 20;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
        
        // Reset scrolling flag after animation completes
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 1000);
      }, 100);
    } else {
      // On mobile, just reset the scrolling flag without auto-scrolling
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 100);
    }
  };
  
  // Function to register category ref
  const setCategoryRef = useCallback((element, categoryId) => {
    if (element) {
      categoryRefs.current[categoryId || 'all'] = element;
      
      // Observe the element if observer exists
      if (observerRef.current) {
        observerRef.current.observe(element);
      }
    }
  }, []);

  // Function to render product row (responsive: vertical on mobile, horizontal on desktop)
  const renderProductRow = (products, title, categoryId) => {
    // If there's no products array yet for this category, it's still loading
    const isLoading = !products;
    
    // If there are no products and we're not loading, don't render anything
    if (!isLoading && (!products || products.length === 0)) return null;
    
    // Create placeholder skeletons for loading state
    const skeletons = Array(4).fill(0).map((_, i) => i);
    
    return (
      <div className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl md:text-2xl font-bold" style={{ 
            background: 'linear-gradient(135deg, #e0a47d 0%, #c17e5b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0px 0px 1px rgba(224, 164, 125, 0.2)'
          }}>{title}</h2>
        </div>
        
        {/* Mobile: 2-Column Grid Layout */}
        <div className="block md:hidden">
          <div className="grid grid-cols-2 gap-3 auto-rows-fr">
            {isLoading ? (
              // Show skeletons when loading
              skeletons.map(index => (
                <div key={`skeleton-${categoryId}-${index}`} className="w-full h-full">
                  <ProductCardSkeleton />
                </div>
              ))
            ) : (
              // Show actual products when loaded
              products.map(product => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full"
                >
                  <ProductCard product={product} className="w-full h-full transition-shadow duration-300 flex flex-col" compact={true} />
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Desktop: Horizontal Scrollable Layout */}
        <div className="hidden md:block">
          <div className="relative">
            <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide scroll-smooth snap-x"
                 style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {isLoading ? (
                // Show skeletons when loading
                skeletons.map(index => (
                  <div key={`skeleton-desktop-${categoryId}-${index}`} className="flex-shrink-0 w-64 md:w-80 snap-start">
                    <ProductCardSkeleton />
                  </div>
                ))
              ) : (
                // Show actual products when loaded
                products.map(product => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0 w-64 md:w-80 snap-start"
                  >
                    <ProductCard product={product} className="w-full transition-shadow duration-300" />
                  </motion.div>
                ))
              )}
            </div>
            {/* Gradient fade effect for scroll indication */}
            <div className="absolute top-0 right-0 w-16 h-full bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none"></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section ref={productsSectionRef} className="bg-white min-h-screen pt-0">{/* Removed any default top padding */}      
      {/* ======================================================================================== */}
      {/* DESKTOP LEFT PADDING CONTROL: Modify the padding values in the className below */}
      {/* Current: md:pl-8 lg:pl-16 xl:pl-24 (increases from 2rem to 3rem to 6rem on larger screens) */}
      {/* NOTE: Mobile (below md) uses px-4 and is not affected */}
      {/* ======================================================================================== */}

      {/* White background overlay during header transitions - covers all content area */}
      {isHeaderTransitioning && (
        <>
          {/* Main overlay to cover content */}
          <div
            className="fixed left-0 right-0 bg-white z-20"
            style={{
              top: `${headerHeight}px`, // Start right at header bottom
              height: '100vh', // Cover entire viewport
              pointerEvents: 'none'
            }}
          />
          {/* Additional overlay for category bar area to ensure smooth transition */}
          <div
            className="fixed left-0 right-0 bg-white z-35"
            style={{
              top: `${headerHeight}px`,
              height: `${categoryBarHeight}px`, // match category bar height
              pointerEvents: 'none',
              opacity: 0.8 // Semi-transparent so category bar shows through slightly
            }}
          />
        </>
      )}

      {/* Always render both bars with smooth opacity transitions */}
      <div
        className="text-category-bar-container fixed top-0 left-0 right-0 bg-white shadow-lg z-40 border-b border-gray-200 w-full"
        style={{
          top: `${headerHeight}px`,
          zIndex: showTextCategoryBar ? 40 : 30,
          opacity: showTextCategoryBar ? 1 : 0,
          transform: 'translateY(0)',
          transition: 'opacity 0.3s ease-out'
        }}
        ref={textBarRef}
      >
        <TextCategoryBar
          categories={categories || []}
          loading={loadingCategories}
          error={categoryError}
          selectedCategory={activeViewCategory}
          onSelectCategory={handleSelectCategory}
        />
      </div>

      {/* Fixed category swiper container - must match text bar spacing */}
      <div
        ref={(el) => { categorySectionRef.current = el; swiperBarRef.current = el; }}
        className="fixed top-0 left-0 right-0 bg-white shadow-lg z-30 border-b border-gray-200"
        style={{
          top: `${headerHeight}px`,
          zIndex: !showTextCategoryBar ? 30 : 25,
          opacity: !showTextCategoryBar ? 1 : 0,
          transform: 'translateY(0)',
          transition: 'opacity 0.3s ease-out',
          pointerEvents: !showTextCategoryBar ? 'auto' : 'none'
        }}
      >
        <div className="px-4 py-2 md:pl-8 lg:pl-16 xl:pl-48 md:pr-4">
          <CategorySwiper
            categories={categories || []}
            loading={loadingCategories}
            error={categoryError}
            selectedCategory={activeViewCategory}
            onSelectCategory={handleSelectCategory}
          />
        </div>
      </div>

      {/* Add padding to content to prevent overlap with fixed bars */}
      <div className="container mx-auto px-4 pt-0 pb-4" style={{
        paddingTop: `${Math.max(0, headerHeight + categoryBarHeight - 1)}px` // subtract 1px to counter border rounding
      }}>

        {/* Main Content */}
        {isLoading ? (
          <div className="flex justify-center items-center min-h-screen bg-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-400 mx-auto"></div>
              <p className="text-black mt-4">Loading delicious products...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-10 bg-white rounded-xl shadow-sm my-6">
            <div className="text-lg font-medium mb-2">Oops! Something went wrong</div>
            <div className="text-sm">{error}</div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              {/* All Products Section with categories */}
              <div className="mt-0">
                {/* Display products by category */}
                <div className="mt-0">
                  <h2 className="text-2xl lg:text-3xl font-bold mb-3 md:mb-4" style={{ 
                    background: 'linear-gradient(135deg, #e0a47d 0%, #c17e5b 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0px 0px 1px rgba(224, 164, 125, 0.2)'
                  }}>
                    All Categories
                  </h2>
                  {categories.map(category => {
                    // Show all categories including selected one
                    const isSelectedCategory = category._id === selectedCategory;
                    return (
                      <div 
                        key={category._id} 
                        ref={(el) => setCategoryRef(el, category._id)}
                        id={`category-section-${category._id}`}
                        className={`mb-12 md:mb-16 ${isSelectedCategory ? 'bg-gray-50 p-4 rounded-xl' : ''}`}
                      >
                        {renderProductRow(productsByCategory[category._id], category.name, category._id)}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </section>
  );
};

export default Products;
