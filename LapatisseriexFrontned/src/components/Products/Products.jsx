import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton';
import { fetchProducts } from '../../redux/productsSlice';
import { selectCartItems } from '../../redux/cartSlice';
import { useCategory } from '../../context/CategoryContext/CategoryContext';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import CategorySwiper from './CategorySwiper';
import TextCategoryBar from './TextCategoryBar';
import SearchBar from '../Home/SearchBar';

const Products = () => {
  const dispatch = useDispatch();
  
  const reduxCartItems = useSelector(selectCartItems);
  // Get Redux products cache to prevent loading state on page refresh
  const reduxProductsCache = useSelector((state) => state.products.listsByKey || {});
  const { categories, fetchCategories, loading: loadingCategories, error: categoryError } = useCategory();
  const { cartItems, refreshCart } = useCart();
  const { user } = useAuth();
  const location = useLocation();
  
  // Initialize with category from URL if present
  const initialCategory = new URLSearchParams(location.search).get('category');
  const isSelectingFreeProduct = new URLSearchParams(location.search).get('selectFreeProduct') === 'true';

  // Force cart refresh when entering free product selection mode
  useEffect(() => {
    if (isSelectingFreeProduct && user) {
      console.log('🔄 Entering free product selection mode - refreshing cart');
      refreshCart();
    }
  }, [isSelectingFreeProduct, user, refreshCart]);

  // Products state organized by categories
  const [productsByCategory, setProductsByCategory] = useState({});
  // Use null to show skeletons before data arrives
  const [allProducts, setAllProducts] = useState(null);
  // Search state for filtering on products page
  const [searchQuery, setSearchQuery] = useState('');
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
  // Guard refs to prevent unnecessary repeated initial loads
  const initialLoadRef = useRef(false); // Tracks if the first full load has completed
  const lastSelectedCategoryRef = useRef(initialCategory || null); // Tracks last category for conditional preloads

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

  // Function to filter products that are already in cart when selecting free product
  const filterProductsForFreeSelection = useCallback((products) => {
    if (!isSelectingFreeProduct) {
      return products;
    }
    
    // Use cartItems from hook first, then fallback to Redux
    const activeCartItems = cartItems || reduxCartItems || [];
    
    if (!activeCartItems || activeCartItems.length === 0) {
      return products;
    }
    
    // Get list of product IDs already in cart
    const cartProductIds = activeCartItems.map(item => item.productId);
    
    // Filter out products that are already in cart
    return products.filter(product => !cartProductIds.includes(product._id));
  }, [isSelectingFreeProduct, cartItems, reduxCartItems]);

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
    // Skip if we already have products for this category or if it's currently loading
    if ((productsByCategory[categoryId] && productsByCategory[categoryId].length > 0) ||
        (productsByCategory[categoryId] === null)) { // null means loading
      return;
    }

    // Don't set to null (loading state) - let fallback from allProducts show instead
    // This prevents loading skeleton flicker since renderProductRow will use allProducts as fallback

    try {
      // Use Redux action to fetch products
      const result = await dispatch(fetchProducts({
        key: `category_${categoryId}`,
        limit: 20,
        category: categoryId,
        sort: 'createdAt:-1'})).unwrap();

      // Update the products for this category
      const filteredProducts = filterProductsForFreeSelection(result.products || []);
      setProductsByCategory(prev => ({
        ...prev,
        [categoryId]: filteredProducts
      }));
    } catch (err) {
      console.error(`Error loading products for category ${categoryId}:`, err);
      // Set empty array on error to prevent retry loops
      setProductsByCategory(prev => ({
        ...prev,
        [categoryId]: []
      }));
    }
  }, [dispatch, filterProductsForFreeSelection]);

  // Initialize productsByCategory from Redux cache on mount (prevents loading state on refresh)
  useEffect(() => {
    if (!initialLoadRef.current && reduxProductsCache && Object.keys(reduxProductsCache).length > 0) {
      const cachedProducts = {};
      let hasAnyCache = false;
      
      // Check if we have 'allProducts' cache
      if (reduxProductsCache['allProducts'] && reduxProductsCache['allProducts'].length > 0) {
        setAllProducts(filterProductsForFreeSelection(reduxProductsCache['allProducts']));
        hasAnyCache = true;
        // If we have cached allProducts, we're not in loading state
        setIsLoading(false);
      }
      
      // Check for category-specific caches
      Object.keys(reduxProductsCache).forEach(key => {
        if (key.startsWith('category_')) {
          const categoryId = key.replace('category_', '');
          const products = reduxProductsCache[key];
          if (products && products.length > 0) {
            cachedProducts[categoryId] = filterProductsForFreeSelection(products);
            hasAnyCache = true;
          }
        }
      });
      
      if (hasAnyCache && Object.keys(cachedProducts).length > 0) {
        setProductsByCategory(cachedProducts);
        console.log('✅ Initialized from Redux cache:', Object.keys(cachedProducts));
      }
      
      // If we have any cache, mark as initially loaded to skip loading state
      if (hasAnyCache) {
        initialLoadRef.current = true;
      }
    }
  }, [reduxProductsCache, filterProductsForFreeSelection]);

  // Measure actual header height dynamically (use ResizeObserver for stability)
  useEffect(() => {
    const measureHeaderHeight = () => {
      const header = document.querySelector('header') || document.querySelector('[role="banner"]');
      if (header) {
        const newHeight = header.offsetHeight;
        if (newHeight !== headerHeight) {
          setIsHeaderTransitioning(true);
          setTimeout(() => setIsHeaderTransitioning(false), 300);
        }
        setHeaderHeight(newHeight);
        return;
      }
      setHeaderHeight(window.innerWidth < 768 ? 75 : 130);
    };

    measureHeaderHeight();

    const resizeObserver = new ResizeObserver(() => requestAnimationFrame(measureHeaderHeight));
    const headerEl = document.querySelector('header') || document.querySelector('[role="banner"]');
    if (headerEl) resizeObserver.observe(headerEl);
    window.addEventListener('resize', measureHeaderHeight);
    return () => {
      window.removeEventListener('resize', measureHeaderHeight);
      resizeObserver.disconnect();
    };
  }, [headerHeight]);

  // Measure category bar height dynamically (no polling) using ResizeObserver for better performance
  useEffect(() => {
    const measure = () => {
      const textBar = textBarRef.current;
      const swiperBar = swiperBarRef.current;
      let h1 = textBar ? textBar.getBoundingClientRect().height : 0;
      let h2 = swiperBar ? swiperBar.getBoundingClientRect().height : 0;
      const newH = Math.max(h1, h2) || 48;
      if (newH !== categoryBarHeight) setCategoryBarHeight(newH);
    };
    measure();

    const resizeObserver = new ResizeObserver(() => {
      // Batch with rAF to avoid layout thrash on rapid changes
      requestAnimationFrame(measure);
    });
    if (textBarRef.current) resizeObserver.observe(textBarRef.current);
    if (swiperBarRef.current) resizeObserver.observe(swiperBarRef.current);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      resizeObserver.disconnect();
    };
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
        // Avoid redundant state updates to reduce re-renders
        const next = categoryId === 'all' ? null : categoryId;
        setActiveViewCategory((prev) => (prev === next ? prev : next));
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
    
    // Check if this is a category change (different from previous selection)
    const isCategoryChange = categoryId && categoryId !== previousCategoryRef.current;
    
    if (categoryId) {
      // If this is category change, show non-sticky for 10 seconds
      if (isCategoryChange) {
        
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
      
      // Removed debug logging to reduce console noise
      // console.log('Observers set up for categories:', Object.keys(categoryRefs.current));
    }
  }, [productsByCategory, allProducts]);

  // Load products more efficiently - load all products first, then only selected category if needed
  // Load products in two stages: first a small batch of general products, then specific categories as needed
  useEffect(() => {
    // Avoid re-running full initial fetch repeatedly when its dependencies (like cart or categories) change.
    // Only run if we haven't loaded yet OR if the selected category changed (to warm its cache).
    const selectedChanged = selectedCategory && selectedCategory !== lastSelectedCategoryRef.current;
    if (initialLoadRef.current && !selectedChanged) {
      return; // Skip redundant initial load
    }

    const loadInitialProducts = async () => {
      // Don't show loading state if we already have cached data
      if (!initialLoadRef.current && (!allProducts || allProducts.length === 0)) {
        setIsLoading(true);
      }
      setError(null);

      try {
        // Always load a minimal set of products for initial display (just 20)
        const allProductsResult = await dispatch(fetchProducts({
          key: 'allProducts',
          limit: 20,
          sort: 'createdAt:-1'})).unwrap();
        const filteredAllProducts = filterProductsForFreeSelection(allProductsResult.products || []);
        setAllProducts(filteredAllProducts);

        // Preserve previously cached category products unless we need to add new ones
        const productsByCat = initialLoadRef.current ? { ...productsByCategory } : {};

        // Preload first 3 categories immediately to avoid loading state on initial page load
        if (!initialLoadRef.current && (categories || []).length > 0) {
          try {
            const candidateCategories = (categories || [])
              .filter(c => c && c._id && c.name !== '__SPECIAL_IMAGES__' && !c.name?.includes('__SPECIAL_IMAGES__') && !c.name?.includes('_SPEC'))
              .map(c => c._id)
              .slice(0, 3); // Load first 3 categories

            await Promise.all(candidateCategories.map(async (catId) => {
              try {
                const res = await dispatch(fetchProducts({
                  key: `category_${catId}`,
                  limit: 20,
                  category: catId,
                  sort: 'createdAt:-1'})).unwrap();
                const filteredCatProducts = filterProductsForFreeSelection(res.products || []);
                productsByCat[catId] = filteredCatProducts;
              } catch (e) {
                console.warn('Prefetch category failed:', catId, e?.message || e);
                productsByCat[catId] = []; // Set empty array to prevent loading state
              }
            }));
          } catch (e) {
            console.warn('Category prefetch skipped due to error:', e?.message || e);
          }
        }

        // If we have a newly selected category and it wasn't preloaded, load it now
        if (selectedCategory && selectedChanged && !productsByCat[selectedCategory]) {
          try {
            const result = await dispatch(fetchProducts({
              key: `category_${selectedCategory}`,
              limit: 20,
              category: selectedCategory,
              sort: 'createdAt:-1'})).unwrap();
            const filteredCategoryProducts = filterProductsForFreeSelection(result.products || []);
            productsByCat[selectedCategory] = filteredCategoryProducts;
          } catch (e) {
            console.warn('Preload selected category failed:', selectedCategory, e?.message || e);
            productsByCat[selectedCategory] = []; // Set empty array to prevent loading state
          }
        }

        setProductsByCategory(productsByCat);

        // Scroll to selected category if any (on all screens, including mobile)
        if (selectedCategory && selectedChanged && !userInteractingRef.current) {
          setTimeout(() => {
            const selectedCategoryRef = categoryRefs.current[selectedCategory];
            if (selectedCategoryRef) {
              isScrollingRef.current = true;
              const elementPosition = selectedCategoryRef.getBoundingClientRect().top + window.pageYOffset;
              const stickyOffset = (headerHeight || 0) + (categoryBarHeight || 0) + 8;
              const offsetPosition = Math.max(0, elementPosition - stickyOffset);
              window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
              setTimeout(() => { isScrollingRef.current = false; }, 1000);
            }
          }, 500);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load products.');
      } finally {
        setIsLoading(false);
        initialLoadRef.current = true;
        if (selectedChanged) {
          lastSelectedCategoryRef.current = selectedCategory;
        }
      }
    };

    loadInitialProducts();
  }, [dispatch, selectedCategory, categories, filterProductsForFreeSelection, headerHeight]);

  // Re-filter products (e.g. when entering/exiting free product selection) without re-triggering network requests
  useEffect(() => {
    if (!initialLoadRef.current) return; // Skip until initial data loaded
    setAllProducts(prev => prev ? filterProductsForFreeSelection(prev) : prev);
    setProductsByCategory(prev => {
      const updated = {};
      Object.entries(prev).forEach(([catId, list]) => {
        updated[catId] = filterProductsForFreeSelection(list || []);
      });
      return updated;
    });
  }, [filterProductsForFreeSelection, isSelectingFreeProduct]);

  // Scroll handling effect kept intact (was above; ensure not accidentally removed)

  const handleSelectCategory = (categoryId) => {
    setSelectedCategory(categoryId);
    setActiveViewCategory(categoryId);
    
    // Set scrolling flag to prevent observer from firing
    isScrollingRef.current = true;
    
    // Auto-scroll to the selected category on all screens, accounting for sticky headers
    if (!userInteractingRef.current) {
      setTimeout(() => {
        const targetRef = categoryId 
          ? categoryRefs.current[categoryId]
          : categoryRefs.current['all'];
          
        if (targetRef) {
          const elementPosition = targetRef.getBoundingClientRect().top + window.pageYOffset;
          const stickyOffset = (headerHeight || 0) + (categoryBarHeight || 0) + 8; // small breathing room
          const offsetPosition = Math.max(0, elementPosition - stickyOffset);
          
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
  const renderProductRow = (products, title, categoryId, isSearching = false) => {
    // Use fallback products from allProducts filtered by category if specific category products aren't loaded yet
    let displayProducts = products;
    let isUsingFallback = false;
    
    // If category-specific products aren't loaded yet, use filtered allProducts as fallback
    if (!products && allProducts && allProducts.length > 0 && categoryId !== 'all') {
      displayProducts = allProducts.filter(p => {
        // Handle both string categoryId and object with _id
        const productCategoryId = typeof p.category === 'object' ? p.category?._id : p.category;
        return productCategoryId === categoryId;
      }).slice(0, 20);
      isUsingFallback = true;
    }
    
    // Only show loading skeleton if we have no products AND no fallback
    const isLoading = !displayProducts || displayProducts.length === 0;
    
    // When searching, hide empty sections entirely (no skeletons)
    if (isSearching && (!displayProducts || displayProducts.length === 0)) return null;
    // If there are no products and we're not loading, don't render anything
    if (!isSearching && !isLoading && (!displayProducts || displayProducts.length === 0)) return null;
    
    // Create placeholder skeletons for loading state
    const skeletons = Array(4).fill(0).map((_, i) => i);
    
    return (
      <div className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent" style={{ 
            
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
              // Show actual products when loaded (either category-specific or fallback from allProducts)
              displayProducts.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full"
                >
                  <ProductCard 
                    product={product} 
                    className="w-full h-full transition-shadow duration-300 flex flex-col" 
                    compact={true} 
                    isSelectingFreeProduct={isSelectingFreeProduct}
                    imagePriority={categoryId === 'all' || activeViewCategory === categoryId ? index < 6 : false}
                  />
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
                // Show actual products when loaded (either category-specific or fallback from allProducts)
                displayProducts.map((product, index) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0 w-64 md:w-80 snap-start"
                  >
                    <ProductCard 
                      product={product} 
                      className="w-full transition-shadow duration-300" 
                      isSelectingFreeProduct={isSelectingFreeProduct}
                      imagePriority={categoryId === 'all' || activeViewCategory === categoryId ? index < 6 : false}
                    />
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
      {/* Free Product Selection Banner */}
      {isSelectingFreeProduct && (
        <div className="py-6 px-4 md:px-6 text-center">
          <p className="text-base md:text-lg font-medium text-[#733857] tracking-wide" style={{
            fontWeight: '500',
            letterSpacing: '0.025em'
          }}>
            Select Your Free Product! Choose any item below to add it FREE to your cart.
          </p>
        </div>
      )}

      {/* (moved) Products Search Bar will appear below the category bar */}
      
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
        className="text-category-bar-container sticky top-0 left-0 right-0 bg-white shadow-lg z-40 border-b border-gray-200 w-full"
        style={{
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

      {/* Sticky category swiper container - must match text bar spacing */}
      <div
        ref={(el) => { categorySectionRef.current = el; swiperBarRef.current = el; }}
        className="sticky top-0 left-0 right-0 bg-white shadow-lg z-30 border-b border-gray-200"
        style={{
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

      {/* Content container - search bar placed at top, below sticky category bar */}
      <div className="container mx-auto px-4 pt-3 pb-4">

        {/* Products Search Bar (same as Home), now below category bar */}
        <div className="mt-4 md:mt-6 lg:mt-8 mb-4">
          <SearchBar
            bestSellers={(allProducts || []).slice(0, 8)}
            newLaunches={(allProducts || []).slice(0, 8)}
            cartPicks={[]}
            onQueryChange={setSearchQuery}
            disableSuggestions={true}
            // Lower z-index on Products page so it doesn't overlap sticky category bars on mobile
            baseZIndex={10}
            onProductClick={() => { /* optional: could scroll to product or open details */ }}
          />
        </div>

        {/* Main Content */}
        {error && (
          <div className="text-center py-6 bg-white rounded-xl shadow-sm my-4">
            <div className="text-sm bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">{error}</div>
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* All Products row always visible (filtered when searching) */}
            <div 
              key="all-products-section"
              ref={(el) => setCategoryRef(el, 'all')}
              id="category-section-all"
              className="mb-8 md:mb-10"
            >
              {renderProductRow(
                (allProducts || []) && searchQuery.trim() !== ''
                  ? (allProducts || []).filter(p => {
                      const q = searchQuery.trim().toLowerCase();
                      if (!q) return true;
                      const name = (p.name || '').toLowerCase();
                      const desc = (p.description || '').toLowerCase();
                      return name.includes(q) || desc.includes(q);
                    })
                  : allProducts,
                searchQuery.trim() !== '' ? 'Search Results' : 'All Products',
                'all',
                searchQuery.trim() !== ''
              )}
            </div>

            {/* Categories below, when available */}
            <div className="mt-0">
              <h2 className="text-2xl lg:text-3xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent" style={{ 
                
              }}>
                All Categories
              </h2>
              {(categories || [])
                .filter(category => 
                  category.name !== '__SPECIAL_IMAGES__' && 
                  !category.name?.includes('__SPECIAL_IMAGES__') &&
                  !category.name?.includes('_SPEC')
                ).map(category => {
                  const isSelectedCategory = category._id === selectedCategory;
                  const q = searchQuery.trim().toLowerCase();
                  const filteredList = q
                    ? (productsByCategory[category._id] || []).filter(p => {
                        const name = (p?.name || '').toLowerCase();
                        const desc = (p?.description || '').toLowerCase();
                        return name.includes(q) || desc.includes(q);
                      })
                    : productsByCategory[category._id];
                  return (
                    <div 
                      key={category._id} 
                      ref={(el) => setCategoryRef(el, category._id)}
                      id={`category-section-${category._id}`}
                      className={`mb-12 md:mb-16 ${isSelectedCategory ? 'p-4 rounded-xl' : ''}`}
                    >
                      {renderProductRow(filteredList, category.name, category._id, q !== '')}
                    </div>
                  );
                })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default Products;
