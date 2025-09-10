import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCategory } from '../../context/CategoryContext/CategoryContext';
import { useProduct } from '../../context/ProductContext/ProductContext';
import { useAuth } from '../../context/AuthContext/AuthContext';
import CategorySwiperHome from './categorySwiper';
import ProductSwiperHome from './productSwiper';

const Home = () => {
  const headingRef = useRef(null);
  const textRef = useRef(null);
  const buttonsRef = useRef(null);
  const imageRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const { categories, fetchCategories, loading: loadingCategories } = useCategory();
  const { fetchProducts } = useProduct();
  const { isAuthenticated } = useAuth();
  const [categoriesWithProducts, setCategoriesWithProducts] = useState([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        await fetchCategories(false);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    loadCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (!categories.length) return;
    const loadFirstProducts = async () => {
      try {
        const promises = categories.map(async (category) => {
          const result = await fetchProducts({
            category: category._id,
            limit: 1,
            sort: 'createdAt:-1'
          });
          return {
            ...category,
            firstProduct: result.products[0] || null
          };
        });
        const results = await Promise.all(promises);
        setCategoriesWithProducts(results);
      } catch (err) {
        console.error("Error fetching first products:", err);
      }
    };
    loadFirstProducts();
  }, [categories, fetchProducts]);

  useEffect(() => {
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

  return (
    <div className="bg-white flex flex-col items-center">

      {/* Hero Section */}
      <section className="bg-white pt-4 sm:pt-6 md:pt-8 pb-16 sm:pb-20 md:pb-24 overflow-hidden w-full max-w-[1600px]" id="home">
        <div className="absolute bottom-20 right-10 w-32 sm:w-40 md:w-48 h-32 sm:h-40 md:h-48 bg-cakePink-light rounded-full blur-3xl opacity-30 -z-10"></div>
        <div className="mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-10 lg:gap-12">
            <div className="lg:w-1/2 space-y-4 sm:space-y-6 md:space-y-8 z-10 text-center lg:text-left">
              <h1
                ref={headingRef}
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-cakeBrown leading-tight opacity-0 transform translate-y-6 transition-all duration-700"
              >
                <span className="text-cakePink">Delectable</span> Cakes
                <span className="block mt-1 sm:mt-2">for Every Celebration</span>
              </h1>
              <p
                ref={textRef}
                className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 max-w-lg mx-auto lg:mx-0 opacity-0 transform translate-y-6 transition-all duration-700"
              >
                Indulge in our handcrafted desserts made with premium ingredients.
                Each bite tells a story of <span className="text-cakePink font-medium">passion</span> and <span className="text-cakeBrown font-medium">perfection</span>.
              </p>
              <div
                ref={buttonsRef}
                className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 md:gap-5 opacity-0 transform translate-y-6 transition-all duration-700 justify-center lg:justify-start"
              >
                <Link to="/products" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto bg-cakePink text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full hover:bg-cakePink-dark hover:scale-105 transition-all duration-300 shadow-lg font-medium text-sm sm:text-base">
                    Explore Our Menu
                  </button>
                </Link>
                <Link to="/contact" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto border-2 border-cakePink text-cakePink px-6 sm:px-8 py-3 sm:py-4 rounded-full hover:bg-cakePink hover:text-white hover:scale-105 transition-all duration-300 font-medium text-sm sm:text-base">
                    Contact Us
                  </button>
                </Link>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 pt-4 justify-center lg:justify-start">
                <div className="bg-white px-3 sm:px-4 py-2 rounded-full shadow-md text-xs sm:text-sm flex items-center gap-2">
                  <span className="text-yellow-500">★★★★★</span>
                  <span className="font-medium">4.9 Rating</span>
                </div>
                <div className="bg-white px-3 sm:px-4 py-2 rounded-full shadow-md text-xs sm:text-sm flex items-center gap-2">
                  <span className="text-cakePink-dark">♥</span>
                  <span className="font-medium">Premium Quality</span>
                </div>
                <div className="bg-white px-3 sm:px-4 py-2 rounded-full shadow-md text-xs sm:text-sm flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="font-medium">Same Day Delivery</span>
                </div>
              </div>
            </div>
            <div
              ref={imageRef}
              className="lg:w-1/2 w-full max-w-md lg:max-w-none opacity-0 transform translate-y-6 transition-all duration-700 mt-8 lg:mt-0"
            >
              <div className="relative">
                <div className="absolute -top-4 sm:-top-6 md:-top-8 -left-4 sm:-left-6 md:-left-8 w-24 sm:w-32 md:w-36 h-24 sm:h-32 md:h-36 bg-cakePink-light rounded-full -z-10 animate-pulse"></div>
                <div className="absolute -bottom-3 sm:-bottom-4 md:-bottom-6 -right-3 sm:-right-4 md:-right-6 w-32 sm:w-40 md:w-48 h-32 sm:h-40 md:h-48 bg-cakePink-light rounded-full -z-10 animate-pulse"></div>
                <img
                  src="/images/cake1.png"
                  alt="Delicious cake"
                  className="w-full h-auto border-2 sm:border-4 border-white rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl transform hover:scale-[1.02] transition-transform duration-500 ease-in-out"
                />
                <div className="absolute top-6 sm:top-8 md:top-12 -left-4 sm:-left-6 md:-left-8 bg-white p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg transform rotate-6 animate-bounce">
                  <img src="/images/cake3.png" alt="Cake sample" className="w-10 sm:w-12 md:w-16 h-10 sm:h-12 md:h-16 object-cover rounded-md sm:rounded-lg" />
                </div>
                <div className="absolute -bottom-2 sm:-bottom-3 md:-bottom-4 -right-2 sm:-right-3 md:-right-4 bg-white p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg transform -rotate-6 animate-bounce delay-500">
                  <img src="/images/cake2.png" alt="Cake sample" className="w-8 sm:w-10 md:w-14 h-8 sm:h-10 md:h-14 object-cover rounded-md sm:rounded-lg" />
                </div>
                <div className="absolute top-1/2 right-0 transform translate-x-1/4 -translate-y-1/2 bg-cakePink text-white text-xs sm:text-sm font-bold py-1 sm:py-2 px-2 sm:px-4 rounded-full shadow-lg">
                  Special Offer!
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Slider Section */}
      {isAuthenticated && (
        <section className="py-8 sm:py-10 md:py-12 bg-gray-50 w-full max-w-[1600px] mx-auto rounded-lg shadow-md">
          <div className="px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-cakeBrown mb-2">Explore Categories</h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-4 sm:mb-6 text-xs sm:text-sm md:text-base px-4">
              Discover a variety of delicious desserts curated for every occasion.
              Browse through our categories to find your favorite treats.
            </p>
            <div className="flex justify-center sm:justify-end mb-4">
              <Link to="/products">
                <button className="text-cakePink text-base sm:text-lg font-bold hover:underline">
                  All Categories
                </button>
              </Link>
            </div>
          </div>
          <div className="px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12">
            <CategorySwiperHome
              categories={categoriesWithProducts}
              loading={loadingCategories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>
        </section>
      )}

      {/* Product Slider Section */}
      {isAuthenticated && (
        <section className="py-8 sm:py-10 md:py-12 bg-white w-full max-w-[1600px] mx-auto rounded-lg shadow-md mt-8 sm:mt-10 md:mt-12">
          <div className="px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-cakeBrown mb-2">Popular Products</h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-4 sm:mb-6 text-xs sm:text-sm md:text-base px-4">
              Handpicked selections from our menu that everyone loves. Treat yourself or surprise your loved ones with our premium delights.
            </p>
            <div className="flex justify-center sm:justify-end mb-4">
              <Link to="/products">
                <button className="text-cakePink text-base sm:text-lg font-bold hover:underline">
                  All Products
                </button>
              </Link>
            </div>
          </div>
          <div className="px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12">
            <ProductSwiperHome
              categories={categoriesWithProducts}
            />
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
