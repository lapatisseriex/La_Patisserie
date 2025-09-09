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

  const PRODUCTS_PER_PAGE = 9;
  const categorySectionRef = useRef(null);
  const productsSectionRef = useRef(null);

  // Filter state
  const [priceRange, setPriceRange] = useState([0, 1000]); // min-max price
  const [discountRange, setDiscountRange] = useState([0, 100]); // min-max discount %
  const [showFilters, setShowFilters] = useState(false); // For mobile filter toggle

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
    const filtered = allProducts.filter(p => {
      const price = p.variants?.[0]?.price || 0;
      const discount = p.variants?.[0]?.discount?.value
        ? ((price - p.variants[0].discount.value) / price) * 100
        : 0;
      return (
        price >= priceRange[0] &&
        price <= priceRange[1] &&
        discount >= discountRange[0] &&
        discount <= discountRange[1]
      );
    });
    setFilteredProducts(filtered);
  }, [priceRange, discountRange, allProducts]);

  const handleSelectCategory = (categoryId) => {
    setSelectedCategory(categoryId);
    setPage(1);
  };

  const clearFilters = () => {
    setPriceRange([0, 1000]);
    setDiscountRange([0, 100]);
  };

  return (
    <section ref={productsSectionRef} className="bg-gradient-to-b from-white to-cakePink-light/20 py-6 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-cakeBrown">Products</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-cakePink text-white px-4 py-2 rounded-md flex items-center"
          >
            <span>Filters</span>
            <svg 
              className={`ml-2 w-4 h-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Panel */}
          <div className="w-full lg:w-1/4 bg-white p-4 rounded-lg shadow-md flex-shrink-0 mx-auto lg:mx-0">
            <h3 className="text-lg font-semibold text-cakeBrown mb-4">Filters</h3>

            {/* Price Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
              <input
                type="range"
                min={0}
                max={1000}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                className="w-full"
              />
              <div className="text-sm text-gray-600 mt-1">Up to ${priceRange[1]}</div>
            </div>

            {/* Discount Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
              <input
                type="range"
                min={0}
                max={100}
                value={discountRange[1]}
                onChange={(e) => setDiscountRange([0, Number(e.target.value)])}
                className="w-full"
              />
              <div className="text-sm text-gray-600 mt-1">Up to {discountRange[1]}%</div>
            </div>
          </div>
          {/* Products Section */}
          <div className="w-full lg:w-3/4 mx-auto lg:mx-0">
            {/* Category Swiper */}
            <div ref={categorySectionRef} className="sticky top-[70px] sm:top-[90px] bg-white z-40 shadow-sm mb-6 px-2 sm:px-4 lg:px-6 py-2">
              <CategorySwiper
                categories={categories || []}
                loading={loadingCategories}
                error={categoryError}
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectCategory}
              />
            </div>

            {/* Selected Category Info */}
            {selectedCategory && (
              <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold text-cakeBrown">
                  {categories.find(cat => cat._id === selectedCategory)?.name || 'Category'} Products
                </h2>
                <p className="text-gray-600 mt-1">
                  Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cakePink"></div>
              </div>
            ) : error ? (
              <div className="text-center text-red-500 py-10">
                {error}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-lg shadow-sm">
                <div className="text-gray-500 text-lg mb-4">No products found matching your criteria.</div>
                <button 
                  onClick={clearFilters}
                  className="bg-cakePink text-white px-6 py-2 rounded-md hover:bg-cakePink-dark transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${selectedCategory || 'all'}-${page}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {filteredProducts.map(product => (
                        <motion.div
                          key={product._id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          className="flex justify-center"
                        >
                          <ProductCard product={product} />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row justify-center items-center mt-8 gap-4">
                    <button
                      onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                      disabled={page <= 1}
                      className={`px-4 py-2 rounded-md text-sm sm:text-base ${page <= 1 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-cakePink text-white hover:bg-cakePink-dark'}`}
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-8 h-8 rounded-full text-sm ${page === pageNum ? 'bg-cakePink text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={page >= totalPages}
                      className={`px-4 py-2 rounded-md text-sm sm:text-base ${page >= totalPages ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-cakePink text-white hover:bg-cakePink-dark'}`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Products;