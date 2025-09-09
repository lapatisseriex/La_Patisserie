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

  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const PRODUCTS_PER_PAGE = 9;
  const location = useLocation();
  const categorySectionRef = useRef(null);

  // Filter state
  const [priceRange, setPriceRange] = useState([0, 1000]); // min-max price
  const [discountRange, setDiscountRange] = useState([0, 100]); // min-max discount %

  // Sync category from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryId = params.get('category');
    if (categoryId) setSelectedCategory(categoryId);
    else setSelectedCategory(null);
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

        const result = await fetchProducts(params);
        setAllProducts(result.products || []);
        setFilteredProducts(result.products || []);
        setTotalPages(result.totalPages || 1);
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

  return (
    <section className="bg-gradient-to-b from-white to-cakePink-light/20 py-4 min-h-screen">
      {/* Category Swiper */}
      <div className="sticky top-[100px] bg-white z-50 shadow-sm mb-6">
        <CategorySwiper
          categories={categories || []}
          loading={loadingCategories}
          error={categoryError}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
        />
      </div>

      <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-6">
        {/* Left Filter Panel */}
        <div className="w-full lg:w-1/4 bg-white p-4 rounded-lg shadow-md flex-shrink-0">
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

          {/* Add more filters here if needed */}
        </div>

        {/* Products Grid */}
        <div className="w-full lg:w-3/4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cakePink"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-10">
              {error}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No products found.
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map(product => (
                      <motion.div
                        key={product._id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ProductCard product={product} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Pagination */}
              <div className="flex justify-center items-center mt-6 space-x-4">
                <button
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page <= 1}
                  className={`px-4 py-2 rounded-md ${page <= 1 ? 'bg-gray-300' : 'bg-cakePink text-white'}`}
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={page >= totalPages}
                  className={`px-4 py-2 rounded-md ${page >= totalPages ? 'bg-gray-300' : 'bg-cakePink text-white'}`}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default Products;
