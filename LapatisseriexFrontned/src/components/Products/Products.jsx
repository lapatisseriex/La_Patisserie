import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { useSearchParams } from 'react-router-dom';
import ProductGrid from './ProductGrid';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const Products = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [regularProducts, setRegularProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();

  // Get category from URL parameters
  const categoryParam = searchParams.get('category');

  // Fetch products from backend
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:3000/api/products');
      
      if (response.ok) {
        const data = await response.json();
        const products = data.products || [];
        
        // Separate featured products (first 4) and regular products
        const featured = products.slice(0, 4).map(product => ({
          id: product._id,
          name: product.name,
          images: [product.imageUrl],
          price: product.price,
          badge: product.tags && product.tags.length > 0 ? product.tags[0] : "",
          isVeg: true, // Assuming all products are veg for now
          rating: 4.5, // Default rating
          reviewCount: Math.floor(Math.random() * 30) + 5,
          description: product.description
        }));
        
        const regular = products.map(product => ({
          id: product._id,
          name: product.name,
          price: product.price,
          badge: product.tags && product.tags.length > 0 ? product.tags[0] : "",
          isVeg: true,
          rating: 4.5,
          reviewCount: Math.floor(Math.random() * 30) + 5,
          coupon: '',
          images: [product.imageUrl],
          category: product.category,
          stock: product.stock,
          weight: product.weight,
          weightUnit: product.weightUnit,
          description: product.description
        }));
        
        setFeaturedProducts(featured);
        setRegularProducts(regular);
        setFilteredProducts(regular);
      } else {
        console.error('Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products when category changes from URL parameter
  useEffect(() => {
    if (categoryParam && regularProducts.length > 0) {
      const filtered = regularProducts.filter(product => 
        product.category?._id === categoryParam || product.category?.name === categoryParam
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(regularProducts);
    }
  }, [categoryParam, regularProducts]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cakePink"></div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Featured Products Carousel */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 max-w-[1600px]">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-cakeBrown mb-4">
              Featured <span className="text-cakePink">Products</span>
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Discover our most popular and trending desserts
            </p>
          </div>

          <Swiper
            modules={[Pagination, Autoplay]}
            spaceBetween={30}
            slidesPerView={1}
            pagination={{ clickable: true }}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            breakpoints={{
              640: {
                slidesPerView: 2,
              },
              1024: {
                slidesPerView: 3,
              },
              1280: {
                slidesPerView: 4,
              },
            }}
            className="featured-swiper"
          >
            {featuredProducts.map((product) => (
              <SwiperSlide key={product.id}>
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
                  <div className="relative">
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-full h-64 object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                      }}
                    />
                    {product.badge && (
                      <div className="absolute top-4 left-4">
                        <span className="bg-cakePink text-white px-3 py-1 rounded-full text-sm font-medium">
                          {product.badge}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-cakeBrown mb-2">{product.name}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-cakePink">${product.price}</span>
                      <div className="flex items-center">
                        <span className="text-yellow-500 text-sm mr-1">★</span>
                        <span className="text-gray-600 text-sm">{product.rating} ({product.reviewCount})</span>
                      </div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* All Products Grid */}
      <section className="py-16">
        <div className="mx-auto px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 max-w-[1600px]">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-cakeBrown mb-4">
              Our <span className="text-cakePink">Exclusive</span> Products
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              {categoryParam 
                ? `Explore our ${filteredProducts[0]?.category?.name || 'selected'} collection` 
                : 'Browse through our complete collection of handcrafted desserts'
              }
            </p>
            {categoryParam && filteredProducts.length > 0 && (
              <p className="text-cakePink font-medium mt-2">
                Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} 
                {filteredProducts[0]?.category?.name && ` in ${filteredProducts[0].category.name}`}
              </p>
            )}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-gray-400 text-6xl mb-4">🎂</div>
              <h3 className="text-2xl font-semibold text-gray-600 mb-2">
                {categoryParam ? 'No products found in this category' : 'No products available'}
              </h3>
              <p className="text-gray-500">
                {categoryParam ? 'Try browsing other categories or check back later.' : 'Please check back later for new products.'}
              </p>
            </div>
          ) : (
            <ProductGrid products={filteredProducts} />
          )}
        </div>
      </section>
    </div>
  );
};

export default Products;