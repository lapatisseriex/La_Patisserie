import React, { useState, useEffect, useRef } from 'react'; // Import useRef
import ProductCard from './ProductCard';
import { useProduct } from '../../context/ProductContext/ProductContext';
import { useCategory } from '../../context/CategoryContext/CategoryContext';
import CategorySwiper from './CategorySwiper';

const Products = () => {
  const { fetchProducts } = useProduct();
  const { categories, fetchCategories, loading: loadingCategories, error: categoryError } = useCategory();
  const [regularProducts, setRegularProducts] = useState([]);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryTotalPages, setCategoryTotalPages] = useState(1);

  const PRODUCTS_PER_PAGE = 12;

  const categorySectionRef = useRef(null); // Ref for category products section

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        await fetchCategories(false);

        const regularResult = await fetchProducts({
          limit: 12,
          sort: 'createdAt:-1',
        });
        setRegularProducts(regularResult.products || []);
      } catch (err) {
        console.error("Error loading products:", err);
        setError("Failed to load products. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [fetchProducts, fetchCategories]);

  useEffect(() => {
    if (!selectedCategory) {
      setCategoryProducts([]);
      return;
    }

    const loadCategoryProducts = async () => {
      try {
        const result = await fetchProducts({
          category: selectedCategory,
          limit: PRODUCTS_PER_PAGE,
          page: categoryPage,
          sort: 'createdAt:-1',
        });

        setCategoryProducts(result.products || []);
        setCategoryTotalPages(result.totalPages || 1);
      } catch (err) {
        console.error("Error loading category products:", err);
      }
    };

    loadCategoryProducts();
  }, [selectedCategory, categoryPage, fetchProducts]);

  const handleSelectCategory = (categoryId) => {
    setSelectedCategory(categoryId);
    setCategoryPage(1);
  
    setTimeout(() => {
      if (categorySectionRef.current) {
        const headerOffset = 200; 
        const elementPosition = categorySectionRef.current.getBoundingClientRect().top;
        const offsetPosition = window.scrollY + elementPosition - headerOffset;
  
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  const handleCategoryPageChange = (newPage) => {
    setCategoryPage(newPage);
  };

  return (
    <section className="bg-gradient-to-b from-white to-cakePink-light/20 py-1 mt-2" id="product">
      <div className="sticky top-[100px] bg-white z-50 shadow-sm">
        <CategorySwiper
          categories={categories || []}
          loading={loadingCategories}
          error={categoryError}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
        />
      </div>
      <div className="container mx-auto px-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cakePink"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-10">
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-cakePink text-white rounded-md"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {regularProducts.length > 0 ? (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-cakeBrown mb-6 text-center">All Products</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {regularProducts.map(product => (
                    <div key={product._id}>
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No products found.</p>
              </div>
            )}

            {selectedCategory && (
              <div ref={categorySectionRef} className="mb-8">
                <h2 className="text-2xl font-bold text-cakeBrown mb-6 text-center"> 
                  {categories.find(cat => (cat._id || cat.id) === selectedCategory)?.name || 'Category'} Products
                </h2>

                {categoryProducts.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {categoryProducts.map(product => (
                        <div key={product._id}>
                          <ProductCard product={product} />
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-center items-center mt-4 space-x-4">
                      <button
                        onClick={() => handleCategoryPageChange(categoryPage - 1)}
                        disabled={categoryPage <= 1}
                        className={`px-4 py-2 rounded-md ${categoryPage <= 1 ? 'bg-gray-300' : 'bg-cakePink text-white'}`}
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-700">
                        Page {categoryPage} of {categoryTotalPages}
                      </span>
                      <button
                        onClick={() => handleCategoryPageChange(categoryPage + 1)}
                        disabled={categoryPage >= categoryTotalPages}
                        className={`px-4 py-2 rounded-md ${categoryPage >= categoryTotalPages ? 'bg-gray-300' : 'bg-cakePink text-white'}`}
                      >
                        Next
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No products found in this category.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default Products;
