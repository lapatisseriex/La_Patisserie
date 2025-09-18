import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from './ProductCard';
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

  // Initial navigation state - for 10-second non-sticky period when coming from home page
  const [isInitialLoad, setIsInitialLoad] = useState(false);
  const [showInitialNonSticky, setShowInitialNonSticky] = useState(false);
  const stickyTimeoutRef = useRef(null);
  const previousCategoryRef = useRef(null);

  // Initialize Intersection Observer
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '-30% 0px -40% 0px', // Adjusted for better detection
      threshold: 0.2, // Increased threshold for more reliable detection
    };

    const observerInstance = new IntersectionObserver((entries) => {
      // If we're programmatically scrolling, ignore observer callbacks
      if (isScrollingRef.current) return;
      
      let mostVisibleEntry = null;
      let highestRatio = 0;
      
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > highestRatio) {
          highestRatio = entry.intersectionRatio;
          mostVisibleEntry = entry;
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
  }, []);

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

  // Load products for all categories
  useEffect(() => {
    const loadAllCategoryProducts = async () => {
      if (!categories.length) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // First get all products
        const allProductsResult = await fetchProducts({
          limit: 100,
          sort: 'createdAt:-1',
        });
        setAllProducts(allProductsResult.products || []);
        
        // Then get products for each category
        const productsByCat = {};
        for (const category of categories) {
          const result = await fetchProducts({
            limit: 20,
            category: category._id,
            sort: 'createdAt:-1',
          });
          productsByCat[category._id] = result.products || [];
        }
        
        setProductsByCategory(productsByCat);
        
        // Scroll to selected category if any (only on larger screens)
        if (selectedCategory && window.innerWidth >= 768 && !userInteractingRef.current) {
          setTimeout(() => {
            const selectedCategoryRef = categoryRefs.current[selectedCategory];
            if (selectedCategoryRef) {
              // Set scrolling flag to prevent observer from firing
              isScrollingRef.current = true;
              
              // Account for fixed header height
              const headerHeight = window.innerWidth < 768 ? 140 : 130; // Mobile vs Desktop header height
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
    
    loadAllCategoryProducts();
  }, [fetchProducts, categories, selectedCategory]);

  // Scroll detection for dynamic sticky behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Simple logic: show text bar when scrolled past 200px
      const shouldShowTextBar = currentScrollY > 200;
      setShowTextCategoryBar(shouldShowTextBar);
      
      // Update other scroll states for debugging
      const direction = currentScrollY > lastScrollY.current ? 'down' : 'up';
      setScrollDirection(direction);
      
      const atTop = currentScrollY <= 10;
      setIsAtTop(atTop);
      
      // For the full swiper, only make it sticky when scrolling down
      const shouldBeSticky = direction === 'down' && currentScrollY > 150 && !shouldShowTextBar;
      setIsCategoryStickyActive(shouldBeSticky);
      
      lastScrollY.current = currentScrollY;
    };

    // Touch event handlers to detect user interaction
    const handleTouchStart = () => {
      userInteractingRef.current = true;
    };

    const handleTouchEnd = () => {
      setTimeout(() => {
        userInteractingRef.current = false;
      }, 1000); // Wait 1 second after touch ends
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []); // Empty dependency array - set up once

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
          const headerHeight = window.innerWidth < 768 ? 140 : 130;
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
  const renderProductRow = (products, title) => {
    if (!products || products.length === 0) return null;
    
    return (
      <div className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-black">{title}</h2>
        </div>
        
        {/* Mobile: 2-Column Grid Layout */}
        <div className="block md:hidden">
          <div className="grid grid-cols-2 gap-3">
            {products.map(product => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <ProductCard product={product} className="w-full h-auto transition-shadow duration-300" compact={true} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Desktop: Horizontal Scrollable Layout */}
        <div className="hidden md:block">
          <div className="relative">
            <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide scroll-smooth snap-x"
                 style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {products.map(product => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0 w-64 md:w-80 snap-start"
                >
                  <ProductCard product={product} className="w-full transition-shadow duration-300" />
                </motion.div>
              ))}
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
      {/* Debug indicator - remove this in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-2 right-2 bg-black text-white p-2 rounded text-xs z-50">
          <div>ScrollY: {typeof window !== 'undefined' ? window.scrollY : 0}</div>
          <div>ShowTextBar: {showTextCategoryBar ? 'ON' : 'OFF'}</div>
          <div>Sticky: {isCategoryStickyActive ? 'ON' : 'OFF'}</div>
          <div>Selected: {selectedCategory || 'None'}</div>
        </div>
      )}
      
      {/* Text Category Bar - Outside container for better sticky behavior */}
      {showTextCategoryBar && (
        <div 
          className="text-category-bar-container sticky bg-red-500 shadow-lg z-40 border-b border-gray-200 w-full"
          style={{ 
            position: 'sticky', 
            top: '110px',
            zIndex: 40,
            minHeight: '50px'
          }}
        >
          {/* Simple Image Background Banner */}
          <div 
            className="relative overflow-hidden" 
            style={{ 
              height: '80px',
              backgroundImage: 'url(/images/cake1.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-black/40"></div>
            
            {/* Content */}
            <div className="relative z-10 flex items-center justify-center h-full px-4">
              <div className="text-center">
                <h3 className="text-white font-medium text-lg md:text-xl">
                  Browse Our Categories
                </h3>
                <p className="text-white/90 text-sm mt-1">
                  Discover amazing cakes and treats
                </p>
              </div>
            </div>
          </div>
          
          <TextCategoryBar
            categories={categories || []}
            loading={loadingCategories}
            error={categoryError}
            selectedCategory={activeViewCategory}
            onSelectCategory={handleSelectCategory}
          />
        </div>
      )}

      <div className="container mx-auto px-4 pt-0 pb-4">{/* Removed top padding */}
        {/* Category Navigation - Only show full swiper when not showing text bar */}
        {!showTextCategoryBar && (
          <div 
            ref={categorySectionRef} 
            className={`category-swiper-container transition-all duration-300 shadow-sm z-30 mb-4 lg:mb-6 -mx-4 px-4 py-3 ${
              isCategoryStickyActive 
                ? 'sticky bg-white' 
                : 'relative bg-blue-50'
            }`}
            style={isCategoryStickyActive ? { 
              position: 'sticky', 
              top: scrollDirection === 'up' ? '110px' : '120px',
              zIndex: 30
            } : {}}
          >
            <CategorySwiper
              categories={categories || []}
              loading={loadingCategories}
              error={categoryError}
              selectedCategory={activeViewCategory}
              onSelectCategory={handleSelectCategory}
            />
          </div>
        )}

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
              <div className="mt-8">
                {/* Display products by category */}
                <div className="mt-16">
                  <h2 className="text-2xl lg:text-3xl font-bold text-black mb-8">
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
                        className={`mb-16 ${isSelectedCategory ? 'bg-gray-50 p-4 rounded-xl' : ''}`}
                      >
                        {renderProductRow(productsByCategory[category._id], category.name)}
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