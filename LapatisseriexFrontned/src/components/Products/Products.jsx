import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from './ProductCard';
import { useProduct } from '../../context/ProductContext/ProductContext';
import { useCategory } from '../../context/CategoryContext/CategoryContext';
import CategorySwiper from './CategorySwiper';

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
  const [observer, setObserver] = useState(null);

  // Initialize Intersection Observer
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.3, // Trigger when 30% of element is visible
    };

    const observerInstance = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Extract category ID from element id
          const categoryId = entry.target.id.replace('category-section-', '');
          setActiveViewCategory(categoryId === 'all' ? null : categoryId);
        }
      });
    }, options);
    
    setObserver(observerInstance);
    
    return () => {
      if (observerInstance) {
        observerInstance.disconnect();
      }
    };
  }, []);

  // Sync category from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryId = params.get('category');
    if (categoryId) {
      setSelectedCategory(categoryId);
      setActiveViewCategory(categoryId);
    } else {
      setSelectedCategory(null);
      setActiveViewCategory(null);
    }
  }, [location.search]);

  // Load categories
  useEffect(() => {
    fetchCategories(false).catch(err => console.error(err));
  }, [fetchCategories]);

  // Setup observers on category sections
  useEffect(() => {
    if (observer && Object.keys(categoryRefs.current).length > 0) {
      // Disconnect all previous observations
      observer.disconnect();
      
      // Observe each category section
      Object.values(categoryRefs.current).forEach(ref => {
        if (ref) {
          observer.observe(ref);
        }
      });
    }
  }, [observer, productsByCategory, allProducts]);

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
        
        // Scroll to selected category if any
        if (selectedCategory) {
          setTimeout(() => {
            const selectedCategoryRef = categoryRefs.current[selectedCategory];
            if (selectedCategoryRef) {
              selectedCategoryRef.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  const handleSelectCategory = (categoryId) => {
    setSelectedCategory(categoryId);
    setActiveViewCategory(categoryId);
    
    // Scroll to the selected category section
    setTimeout(() => {
      const targetRef = categoryId 
        ? categoryRefs.current[categoryId]
        : categoryRefs.current['all'];
        
      if (targetRef) {
        targetRef.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };
  
  // Function to register category ref
  const setCategoryRef = useCallback((element, categoryId) => {
    if (element) {
      categoryRefs.current[categoryId || 'all'] = element;
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
        
        {/* Mobile: Vertical Stack Layout */}
        <div className="block md:hidden">
          <div className="space-y-3">
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

  // Function to render featured products (larger display)
  const renderFeaturedProducts = (products, title) => {
    if (!products || products.length === 0) return null;
    
    // Take up to 3 featured products
    const featuredItems = products.slice(0, 3);
    
    return (
      <div className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-black">{title}</h2>
        </div>
        
        {/* Mobile: Vertical Stack Layout */}
        <div className="block md:hidden">
          <div className="space-y-4">
            {featuredItems.map(product => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <ProductCard product={product} className="w-full h-auto transition-shadow duration-300" compact={false} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Desktop: Grid Layout */}
        <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-6">
          {featuredItems.map(product => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <ProductCard product={product} className="w-full h-full transition-shadow duration-300" featured={true} />
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section ref={productsSectionRef} className="bg-gradient-to-b from-white to-gray-100/20 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        {/* Category Swiper - Sticky Navigation */}
        <div ref={categorySectionRef} className="sticky top-[100px] md:top-[120px] bg-white/95 backdrop-blur-sm z-40 shadow-sm mb-4 lg:mb-6 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3">
          <CategorySwiper
            categories={categories || []}
            loading={loadingCategories}
            error={categoryError}
            selectedCategory={activeViewCategory}
            onSelectCategory={handleSelectCategory}
          />
        </div>

        {/* Main Content */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64 lg:h-96">
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
              {/* Selected Category Section (displayed at the top if a category is selected) */}
              {selectedCategory && categories.map(category => {
                if (category._id !== selectedCategory) return null;
                const categoryProducts = productsByCategory[category._id];
                
                return (
                  <div 
                    key={`selected-${category._id}`}
                    ref={(el) => setCategoryRef(el, category._id)}
                    id={`category-section-${category._id}`}
                    className="mb-16"
                  >
                    {/* Category Header */}
                    <div className="mb-8">
                      <h1 className="text-2xl lg:text-3xl font-bold text-black">
                        {category.name}
                      </h1>
                      <p className="text-black text-sm lg:text-base mt-1">
                        {categoryProducts?.length || 0} delicious treats
                      </p>
                    </div>
                    
                    {/* Featured Products from selected category */}
                 
                  </div>
                );
              })}
              
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
