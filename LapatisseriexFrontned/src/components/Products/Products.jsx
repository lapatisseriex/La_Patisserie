import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import ProductGrid from './ProductGrid';
import ProductCard from './ProductCard';
import { useProduct } from '../../context/ProductContext/ProductContext';
import { useCategory } from '../../context/CategoryContext/CategoryContext';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const Products = () => {
  const { fetchProducts } = useProduct();
  const { fetchCategories } = useCategory();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [regularProducts, setRegularProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Define an async function to load everything
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Load categories first to ensure they're available
        console.log("Loading categories for Products component");
        await fetchCategories(false); // Only load active categories
        
        // Then load products
        console.log("Loading products");
        
        // Fetch featured products (products with featured=true)
        const featuredResult = await fetchProducts({ 
          featured: true, 
          limit: 10
        });
        
        // Fetch regular products
        const regularResult = await fetchProducts({ 
          limit: 12,
          sort: 'createdAt:-1' // Sort by newest first
        });
        
        setFeaturedProducts(featuredResult.products || []);
        setRegularProducts(regularResult.products || []);
        
        console.log(`Loaded ${featuredResult.products?.length || 0} featured products`);
        console.log(`Loaded ${regularResult.products?.length || 0} regular products`);
      } catch (err) {
        console.error("Error loading products:", err);
        setError("Failed to load products. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [fetchProducts, fetchCategories]);

  return (
    <section className="bg-gradient-to-b from-white to-cakePink-light/20 py-20 mt-8 pt-6" id="product">
      <div className="container mx-auto px-4">
        
        {/* Section Heading */}
       
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cakePink"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-10">
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-cakePink text-white rounded-md hover:bg-cakePink-dark"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Featured Products Carousel */}
            {featuredProducts.length > 0 && (
              <div className="mb-16">
                <h2 className="text-2xl font-bold text-cakeBrown mb-8">Featured Products</h2>
                <Swiper
                  modules={[Pagination, Autoplay]}
                  pagination={{ clickable: true }}
                  autoplay={{ delay: 5000, disableOnInteraction: false }}
                  slidesPerView={1}
                  spaceBetween={20}
                  loop={true}
                  breakpoints={{
                    640: { slidesPerView: 2 },
                    768: { slidesPerView: 3 },
                    1024: { slidesPerView: 4 }
                  }}
                  className="products-swiper"
                >
                  {featuredProducts.map(product => (
                    <SwiperSlide key={product._id}>
                      <ProductCard product={product} />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            )}
            
            {/* Regular Products Grid */}
            {regularProducts.length > 0 ? (
              <ProductGrid products={regularProducts} title="All Cakes & Desserts" />
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">No products found.</p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default Products;
