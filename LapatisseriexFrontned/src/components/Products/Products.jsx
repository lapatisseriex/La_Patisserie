import React, { useState, useEffect } from 'react';
import ProductGrid from './ProductGrid';
import ProductCard from './ProductCard';
import { useProduct } from '../../context/ProductContext/ProductContext';
import { useCategory } from '../../context/CategoryContext/CategoryContext';

const Products = () => {
  const { fetchProducts } = useProduct();
  const { fetchCategories } = useCategory();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [regularProducts, setRegularProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [transitionDirection, setTransitionDirection] = useState('next');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        await fetchCategories(false);
        
        const featuredResult = await fetchProducts({ 
          featured: true, 
          limit: 10
        });
        
        const regularResult = await fetchProducts({ 
          limit: 12,
          sort: 'createdAt:-1'
        });
        
        setFeaturedProducts(featuredResult.products || []);
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

  // Auto-advance slides
  useEffect(() => {
    if (featuredProducts.length > 1) {
      const interval = setInterval(() => {
        handleNextSlide();
      }, 4000);
      
      return () => clearInterval(interval);
    }
  }, [featuredProducts.length]);

  const handleNextSlide = () => {
    setTransitionDirection('next');
    setCurrentSlide((prev) => (prev + 1) % featuredProducts.length);
  };

  const handlePrevSlide = () => {
    setTransitionDirection('prev');
    setCurrentSlide((prev) => (prev === 0 ? featuredProducts.length - 1 : prev - 1));
  };

  const goToSlide = (index) => {
    setTransitionDirection(index > currentSlide ? 'next' : 'prev');
    setCurrentSlide(index);
  };

  // Get the next product index for the side preview
  const getNextProductIndex = () => {
    return (currentSlide + 1) % featuredProducts.length;
  };

  // Get the previous product index
  const getPrevProductIndex = () => {
    return currentSlide === 0 ? featuredProducts.length - 1 : currentSlide - 1;
  };

  return (
    <section className="bg-gradient-to-b from-white to-cakePink-light/20 py-12 mt-8" id="product">
      <div className="container mx-auto px-4">
        
        {/* Section Heading */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-cakeBrown mb-4">Our Featured Creations</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our most popular desserts that everyone loves
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cakePink"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-10">
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-cakePink text-white rounded-md hover:bg-cakePink-dark transition-colors duration-300"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Featured Products Carousel */}
            {featuredProducts.length > 0 && (
              <div className="mb-16">
                <div className="relative max-w-5xl mx-auto">
                  {/* Navigation Arrows - Only show if more than 1 product */}
                  {featuredProducts.length > 1 && (
                    <>
                      <button 
                        className="absolute -left-14 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-cakePink hover:text-white transition-colors duration-300 border border-gray-200"
                        onClick={handlePrevSlide}
                        aria-label="Previous product"
                      >
                        &lt;
                      </button>
                      
                      <button 
                        className="absolute -right-14 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-cakePink hover:text-white transition-colors duration-300 border border-gray-200"
                        onClick={handleNextSlide}
                        aria-label="Next product"
                      >
                        &gt;
                      </button>
                    </>
                  )}

                  {/* Carousel Container */}
                  <div className="relative h-96 overflow-hidden">
                    {/* Main Product Slides */}
                    {featuredProducts.map((product, index) => {
                      let translateX = '0%';
                      let zIndex = 10;
                      let opacity = 1;
                      
                      if (index === currentSlide) {
                        // Current active slide
                        translateX = '0%';
                        zIndex = 30;
                      } else if (
                        (transitionDirection === 'next' && index === getNextProductIndex()) ||
                        (transitionDirection === 'prev' && index === getPrevProductIndex())
                      ) {
                        // Next/previous slide (entering)
                        translateX = transitionDirection === 'next' ? '100%' : '-100%';
                        zIndex = 20;
                        opacity = 0;
                      } else {
                        // Other slides (hidden)
                        translateX = index > currentSlide ? '100%' : '-100%';
                        zIndex = 10;
                        opacity = 0;
                      }
                      
                      return (
                        <div
                          key={product._id}
                          className={`absolute top-0 left-0 w-3/4 transition-all duration-700 ease-in-out`}
                          style={{
                            transform: `translateX(${translateX})`,
                            zIndex,
                            opacity
                          }}
                        >
                          <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
                            <div className="h-64 relative overflow-hidden">
                              <img
                                src={product.images?.[0] || ''}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            
                            <div className="p-5 text-center">
                              <div className="mb-4">
                                {product.badge && (
                                  <span className="bg-cakePink text-white text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block">
                                    {product.badge}
                                  </span>
                                )}
                                <h3 className="text-2xl font-bold text-cakeBrown mb-2">{product.name}</h3>
                                <p className="text-gray-600 mb-4">{product.description}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Side Preview */}
                    {featuredProducts.length > 1 && (
                      <div 
                        className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1/4 ml-4 opacity-70 transition-opacity duration-500"
                        key={`preview-${currentSlide}`}
                      >
                        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                          <div className="h-40 relative overflow-hidden">
                            <img
                              src={featuredProducts[getNextProductIndex()]?.images?.[0] || ''}
                              alt={featuredProducts[getNextProductIndex()]?.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          <div className="p-3 text-center">
                            <h4 className="text-sm font-semibold text-cakeBrown line-clamp-1">
                              {featuredProducts[getNextProductIndex()]?.name}
                            </h4>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Navigation Dots */}
                  {featuredProducts.length > 1 && (
                    <div className="flex justify-center space-x-2 mt-6">
                      {featuredProducts.map((_, index) => (
                        <button
                          key={index}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            index === currentSlide 
                              ? 'bg-cakePink scale-125' 
                              : 'bg-gray-300 hover:bg-gray-400'
                          }`}
                          onClick={() => goToSlide(index)}
                          aria-label={`Go to slide ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Regular Products Grid - 4 products per row */}
            {regularProducts.length > 0 ? (
              <div className="mb-16">
                <h2 className="text-2xl font-bold text-cakeBrown mb-8 text-center">All Cakes & Desserts</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {regularProducts.map(product => (
                    <div key={product._id} className="transform transition-all duration-300 hover:scale-105">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>
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