import React, { useState, useEffect, useRef } from 'react';
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

  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const PRODUCTS_PER_PAGE = 12;
  const categorySectionRef = useRef(null);
  const productsSectionRef = useRef(null);

  // Filter state
  const [priceRange, setPriceRange] = useState([0, 1000]); // min-max price
  const [discountRange, setDiscountRange] = useState([0, 100]); // min-max discount %
  const [showFilters, setShowFilters] = useState(false); // For mobile filter toggle
  const [sortBy, setSortBy] = useState('newest'); // New sort option
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Sync category from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryId = params.get('category');
    if (categoryId) {
      setSelectedCategory(categoryId);
    } else {
      setSelectedCategory(null);
    }
    setPage(1);
  }, [location.search]);

  // Load categories
  useEffect(() => {
    fetchCategories(false).catch(err => console.error(err));
  }, [fetchCategories]);

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = {
          limit: PRODUCTS_PER_PAGE,
          page,
          sort: 'createdAt:-1',
        };
        if (selectedCategory) params.category = selectedCategory;
        
        // Debug logs to track the category filtering
        console.log('Loading products with category:', selectedCategory);
        console.log('Request params:', params);

        const result = await fetchProducts(params);
        setAllProducts(result.products || []);
        setFilteredProducts(result.products || []);
        setTotalPages(result.totalPages || 1);
        
        // Scroll to top only when category changes, not on page changes
        if (selectedCategory && productsSectionRef.current) {
          setTimeout(() => {
            window.scrollTo({
              top: productsSectionRef.current.offsetTop - 100,
              behavior: 'smooth'
            });
          }, 100);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load products.');
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, [fetchProducts, page, selectedCategory]);

  // Filter products on price/discount change
  useEffect(() => {
    let filtered = [...allProducts];
    
    // Apply price filter
    filtered = filtered.filter(p => {
      const price = p.variants?.[0]?.price || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });
    
    // Apply discount filter
    filtered = filtered.filter(p => {
      const price = p.variants?.[0]?.price || 0;
      const discount = p.variants?.[0]?.discount?.value
        ? ((p.variants[0].discount.value / price) * 100)
        : 0;
      return discount >= discountRange[0] && discount <= discountRange[1];
    });
    
    // Apply sorting
    if (sortBy === 'price-low') {
      filtered.sort((a, b) => (a.variants?.[0]?.price || 0) - (b.variants?.[0]?.price || 0));
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => (b.variants?.[0]?.price || 0) - (a.variants?.[0]?.price || 0));
    } else if (sortBy === 'discount') {
      filtered.sort((a, b) => {
        const aDiscount = a.variants?.[0]?.discount?.value ? ((a.variants[0].discount.value / a.variants[0].price) * 100) : 0;
        const bDiscount = b.variants?.[0]?.discount?.value ? ((b.variants[0].discount.value / b.variants[0].price) * 100) : 0;
        return bDiscount - aDiscount;
      });
    }
    
    setFilteredProducts(filtered);
    
    // Count active filters
    let count = 0;
    if (priceRange[1] < 1000) count++;
    if (discountRange[0] > 0) count++;
    setActiveFiltersCount(count);
  }, [priceRange, discountRange, allProducts, sortBy]);

  const handleSelectCategory = (categoryId) => {
    setSelectedCategory(categoryId);
    setPage(1);
  };

  const clearFilters = () => {
    setPriceRange([0, 1000]);
    setDiscountRange([0, 100]);
    setSortBy('newest');
  };

  const FilterPanel = () => (
    <div className="bg-white h-full overflow-y-auto">
      {/* Filter Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <span className="bg-cakePink text-white text-xs px-2 py-1 rounded-full">
              {activeFiltersCount}
            </span>
          )}
          <button
            onClick={() => setShowFilters(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Sort Options */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Sort By</h4>
          <div className="space-y-2">
            {[
              { value: 'newest', label: 'Newest First' },
              { value: 'price-low', label: 'Price: Low to High' },
              { value: 'price-high', label: 'Price: High to Low' },
              { value: 'discount', label: 'Highest Discount' }
            ].map(option => (
              <label key={option.value} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="sort"
                  value={option.value}
                  checked={sortBy === option.value}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-cakePink focus:ring-cakePink"
                />
                <span className="ml-2 text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Price Range</h4>
          <div className="space-y-3">
            <input
              type="range"
              min={0}
              max={1000}
              value={priceRange[1]}
              onChange={(e) => setPriceRange([0, Number(e.target.value)])}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span>₹0</span>
              <span className="font-medium text-cakePink">₹{priceRange[1]}</span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-cakePink focus:border-cakePink"
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-cakePink focus:border-cakePink"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Discount Range */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Minimum Discount</h4>
          <div className="space-y-3">
            <input
              type="range"
              min={0}
              max={100}
              value={discountRange[0]}
              onChange={(e) => setDiscountRange([Number(e.target.value), 100])}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span className="font-medium text-cakePink">{discountRange[0]}%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Clear Filters */}
        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Clear All Filters
          </button>
        )}
      </div>
    </div>
  );

  return (
    <section ref={productsSectionRef} className="bg-gradient-to-b from-white to-cakePink-light/20 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        
        {/* Header Section */}
        <div className="mb-4 lg:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-cakeBrown">
                {selectedCategory 
                  ? categories.find(cat => cat._id === selectedCategory)?.name || 'Products'
                  : 'All Products'
                }
              </h1>
              <p className="text-gray-600 text-sm lg:text-base mt-1">
                {isLoading ? 'Loading...' : `${filteredProducts.length} products found`}
              </p>
            </div>
            
            {/* Mobile Filter Button */}
            <button
              onClick={() => setShowFilters(true)}
              className="lg:hidden bg-cakePink text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="bg-white text-cakePink text-xs px-1.5 py-0.5 rounded-full font-medium">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category Swiper */}
        <div ref={categorySectionRef} className="sticky top-16 lg:top-20 bg-white/95 backdrop-blur-sm z-40 shadow-sm mb-4 lg:mb-6 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3">
          <CategorySwiper
            categories={categories || []}
            loading={loadingCategories}
            error={categoryError}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
          />
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-32 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <FilterPanel />
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-64 lg:h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cakePink mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading delicious products...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center text-red-500 py-10 bg-white rounded-xl shadow-sm">
                <div className="text-lg font-medium mb-2">Oops! Something went wrong</div>
                <div className="text-sm">{error}</div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 lg:py-16 bg-white rounded-xl shadow-sm">
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <div className="text-gray-700 text-lg lg:text-xl font-medium mb-2">No products found</div>
                <div className="text-gray-500 text-sm lg:text-base mb-6">Try adjusting your filters or browse different categories</div>
                <button 
                  onClick={clearFilters}
                  className="bg-cakePink text-white px-6 py-3 rounded-lg hover:bg-cakePink-dark transition-colors font-medium"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${selectedCategory || 'all'}-${page}-${sortBy}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6">
                      {filteredProducts.map(product => (
                        <motion.div
                          key={product._id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          className="flex justify-center"
                        >
                          <ProductCard product={product} className="w-full hover:shadow-xl transition-shadow duration-300" />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row justify-center items-center mt-12 gap-4">
                    <button
                      onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                      disabled={page <= 1}
                      className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                        page <= 1 
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                          : 'bg-white text-cakePink border border-cakePink hover:bg-cakePink hover:text-white shadow-md hover:shadow-lg'
                      }`}
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                              page === pageNum 
                                ? 'bg-cakePink text-white shadow-lg' 
                                : 'bg-white text-gray-700 border border-gray-200 hover:border-cakePink hover:text-cakePink'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={page >= totalPages}
                      className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                        page >= totalPages 
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                          : 'bg-white text-cakePink border border-cakePink hover:bg-cakePink hover:text-white shadow-md hover:shadow-lg'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mobile Filter Overlay */}
        <AnimatePresence>
          {showFilters && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowFilters(false)}
                className="fixed inset-0 bg-black/50 z-50 lg:hidden"
              />
              
              {/* Filter Panel */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 bottom-0 w-80 max-w-[90vw] bg-white z-50 lg:hidden shadow-2xl"
              >
                <FilterPanel />
                
                {/* Apply Button */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
                  <button
                    onClick={() => setShowFilters(false)}
                    className="w-full bg-cakePink text-white py-3 rounded-lg font-medium hover:bg-cakePink-dark transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Custom Styles for Range Sliders */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #ec4899;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #ec4899;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </section>
  );
};

export default Products;