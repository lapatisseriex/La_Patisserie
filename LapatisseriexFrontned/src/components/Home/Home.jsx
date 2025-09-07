import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const Home = () => {
  const headingRef = useRef(null);
  const textRef = useRef(null);
  const buttonsRef = useRef(null);
  const imageRef = useRef(null);
  
  const { addToCart } = useCart();
  const [searchParams] = useSearchParams();
  
  // State for dynamic content
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Get category from URL parameters
  const categoryParam = searchParams.get('category');
  
  useEffect(() => {
    // Simple animation for elements on load
    const fadeInElements = (element, delay) => {
      setTimeout(() => {
        if (element.current) {
          element.current.style.opacity = '1';
          element.current.style.transform = 'translateY(0)';
        }
      }, delay);
    };
    
    fadeInElements(headingRef, 300);
    fadeInElements(textRef, 600);
    fadeInElements(buttonsRef, 900);
    fadeInElements(imageRef, 600);
  }, []);

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products when category changes from URL parameter
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    
    if (categoryFromUrl) {
      setFilteredProducts(products.filter(product => 
        product.category?._id === categoryFromUrl
      ));
    } else {
      setFilteredProducts(products);
    }
  }, [products, searchParams]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/products?limit=20');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        setFilteredProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart({
      id: product._id,
      name: product.name,
      price: product.price,
      image: product.imageUrl,
      weight: product.weight,
      weightUnit: product.weightUnit
    });
  };
  
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-white pt-8 pb-12 overflow-hidden" id="home">
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-cakePink-light rounded-full blur-3xl opacity-30 -z-10"></div>
        
        <div className="mx-auto px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 max-w-[1600px]">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">
            {/* Content Section */}
            <div className="lg:w-1/2 space-y-8 z-10">
              <h1 
                ref={headingRef}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-cakeBrown leading-tight opacity-0 transform translate-y-6 transition-all duration-700"
              >
                <span className="text-cakePink">Delectable</span> Cakes 
                <span className="block mt-2">for Every Celebration</span>
              </h1>
              
              <p 
                ref={textRef}
                className="text-lg sm:text-xl text-gray-700 max-w-lg opacity-0 transform translate-y-6 transition-all duration-700"
              >
                Indulge in our handcrafted desserts made with premium ingredients. 
                Each bite tells a story of <span className="text-cakePink font-medium">passion</span> and <span className="text-cakeBrown font-medium">perfection</span>.
              </p>
              
              <div 
                ref={buttonsRef}
                className="flex flex-wrap gap-5 opacity-0 transform translate-y-6 transition-all duration-700"
              >
                <button 
                  onClick={() => document.getElementById('products-section').scrollIntoView({ behavior: 'smooth' })}
                  className="bg-cakePink text-white px-8 py-4 rounded-full hover:bg-cakePink-dark hover:scale-105 transition-all duration-300 shadow-lg font-medium"
                >
                  Explore Our Menu
                </button>
                <Link to="/contact">
                  <button className="border-2 border-cakePink text-cakePink px-8 py-4 rounded-full hover:bg-cakePink hover:text-white hover:scale-105 transition-all duration-300 font-medium">
                    Contact Us
                  </button>
                </Link>
              </div>
              
              {/* Featured Badges */}
              <div className="flex flex-wrap gap-4 pt-4">
                <div className="bg-white px-4 py-2 rounded-full shadow-md text-sm flex items-center gap-2">
                  <span className="text-yellow-500">★★★★★</span>
                  <span className="font-medium">4.9 Rating</span>
                </div>
                <div className="bg-white px-4 py-2 rounded-full shadow-md text-sm flex items-center gap-2">
                  <span className="text-cakePink-dark">♥</span>
                  <span className="font-medium">Premium Quality</span>
                </div>
                <div className="bg-white px-4 py-2 rounded-full shadow-md text-sm flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="font-medium">Same Day Delivery</span>
                </div>
              </div>
            </div>
            
            {/* Image Section */}
            <div 
              ref={imageRef}
              className="lg:w-1/2 opacity-0 transform translate-y-6 transition-all duration-700"
            >
              <div className="relative">
                {/* Decorative backgrounds */}
                <div className="absolute -top-8 -left-8 w-36 h-36 bg-cakePink-light rounded-full -z-10 animate-pulse"></div>
                <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-cakePink-light rounded-full -z-10 animate-pulse"></div>
                
                {/* Main image */}
                <img 
                  src="/images/cake1.png" 
                  alt="Delicious cake" 
                  className="w-full h-auto border-4 border-white rounded-2xl shadow-2xl transform hover:scale-[1.02] transition-transform duration-500 ease-in-out"
                />
                
                {/* Floating elements */}
                <div className="absolute top-12 -left-8 bg-white p-3 rounded-xl shadow-lg transform rotate-6 animate-bounce">
                  <img src="/images/cake3.png" alt="Cake sample" className="w-16 h-16 object-cover rounded-lg" />
                </div>
                
                <div className="absolute -bottom-4 -right-4 bg-white p-3 rounded-xl shadow-lg transform -rotate-6 animate-bounce delay-500">
                  <img src="/images/cake2.png" alt="Cake sample" className="w-14 h-14 object-cover rounded-lg" />
                </div>
                
                {/* Floating badge */}
                <div className="absolute top-1/2 right-0 transform translate-x-1/4 -translate-y-1/2 bg-cakePink text-white text-sm font-bold py-2 px-4 rounded-full shadow-lg">
                  Special Offer!
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories and Products Section */}
      <section id="products-section" className="py-16 bg-gray-50">
        <div className="mx-auto px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 max-w-[1600px]">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-cakeBrown mb-4">
              Our <span className="text-cakePink">Delicious</span> Collection
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Browse through our carefully crafted desserts, made with love and the finest ingredients
            </p>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cakePink"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map((product) => (
                <div key={product._id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group">
                  {/* Product Image */}
                  <div className="relative overflow-hidden">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                      }}
                    />
                    {product.tags && product.tags.length > 0 && (
                      <div className="absolute top-4 left-4">
                        <span className="bg-cakePink text-white px-3 py-1 rounded-full text-sm font-medium">
                          {product.tags[0]}
                        </span>
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.stock > 10 
                          ? 'bg-green-100 text-green-800' 
                          : product.stock > 0 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-6">
                    <div className="mb-3">
                      <h3 className="text-xl font-semibold text-cakeBrown mb-2 line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                        {product.description}
                      </p>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <span className="text-2xl font-bold text-cakePink">${product.price}</span>
                        <span className="text-gray-500 text-sm ml-2">
                          ({product.weight}{product.weightUnit})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-500">Category</span>
                        <p className="text-sm font-medium text-gray-700">{product.category?.name}</p>
                      </div>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                      className={`w-full py-3 rounded-xl font-medium transition-all duration-300 ${
                        product.stock > 0
                          ? 'bg-cakePink text-white hover:bg-cakePink-dark hover:scale-[1.02] shadow-lg'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredProducts.length === 0 && !loading && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🍰</div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-2">
                {searchParams.get('category') ? `No products found in selected category` : 'No products found'}
              </h3>
              <p className="text-gray-500">
                {searchParams.get('category') ? 'Try selecting a different category from the header' : 'Check back later for new products'}
              </p>
            </div>
          )}

          {/* View All Products Link */}
          {filteredProducts.length > 0 && (
            <div className="text-center mt-12">
              <Link 
                to="/products"
                className="inline-block bg-cakeBrown text-white px-8 py-4 rounded-full hover:bg-opacity-90 transition-all duration-300 font-medium shadow-lg"
              >
                View All Products
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
