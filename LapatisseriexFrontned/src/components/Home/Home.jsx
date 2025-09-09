import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCategory } from '../../context/CategoryContext/CategoryContext';
import { useProduct } from '../../context/ProductContext/ProductContext';
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
  const [categoriesWithProducts, setCategoriesWithProducts] = useState([]);

  // Fetch categories
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

  // Fetch first product for each category
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

  // Fade-in animation
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
      <section className="bg-white pt-8 pb-24 overflow-hidden w-full max-w-[1600px]" id="home">
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-cakePink-light rounded-full blur-3xl opacity-30 -z-10"></div>
        <div className="mx-auto px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">
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
                <Link to="/products">
                  <button className="bg-cakePink text-white px-8 py-4 rounded-full hover:bg-cakePink-dark hover:scale-105 transition-all duration-300 shadow-lg font-medium">
                    Explore Our Menu
                  </button>
                </Link>
                <Link to="/contact">
                  <button className="border-2 border-cakePink text-cakePink px-8 py-4 rounded-full hover:bg-cakePink hover:text-white hover:scale-105 transition-all duration-300 font-medium">
                    Contact Us
                  </button>
                </Link>
              </div>
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
            <div
              ref={imageRef}
              className="lg:w-1/2 opacity-0 transform translate-y-6 transition-all duration-700"
            >
              <div className="relative">
                <div className="absolute -top-8 -left-8 w-36 h-36 bg-cakePink-light rounded-full -z-10 animate-pulse"></div>
                <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-cakePink-light rounded-full -z-10 animate-pulse"></div>
                <img
                  src="/images/cake1.png"
                  alt="Delicious cake"
                  className="w-full h-auto border-4 border-white rounded-2xl shadow-2xl transform hover:scale-[1.02] transition-transform duration-500 ease-in-out"
                />
                <div className="absolute top-12 -left-8 bg-white p-3 rounded-xl shadow-lg transform rotate-6 animate-bounce">
                  <img src="/images/cake3.png" alt="Cake sample" className="w-16 h-16 object-cover rounded-lg" />
                </div>
                <div className="absolute -bottom-4 -right-4 bg-white p-3 rounded-xl shadow-lg transform -rotate-6 animate-bounce delay-500">
                  <img src="/images/cake2.png" alt="Cake sample" className="w-14 h-14 object-cover rounded-lg" />
                </div>
                <div className="absolute top-1/2 right-0 transform translate-x-1/4 -translate-y-1/2 bg-cakePink text-white text-sm font-bold py-2 px-4 rounded-full shadow-lg">
                  Special Offer!
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Slider Section */}
      <section className="py-12 bg-gray-50 w-full max-w-[1600px] mx-auto rounded-lg shadow-md">
        <div className="px-16 text-center">
          <h2 className="text-4xl font-bold text-cakeBrown mb-2">Explore Categories</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-6">
            Discover a variety of delicious desserts curated for every occasion.
            Browse through our categories to find your favorite treats.
          </p>
          <div className="flex justify-end mb-4">
            <Link to="/products">
              <button className="text-cakePink text-lg font-bold hover:underline">
                All Categories
              </button>
            </Link>
          </div>
        </div>
        <div className="px-16">
          <CategorySwiperHome
            categories={categoriesWithProducts}
            loading={loadingCategories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>
      </section>

      {/* Product Slider Section */}
      <section className="py-12 bg-white w-full max-w-[1600px] mx-auto rounded-lg shadow-md mt-12">
        <div className="px-16 text-center">
          <h2 className="text-4xl font-bold text-cakeBrown mb-2">Popular Products</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-6">
            Handpicked selections from our menu that everyone loves. Treat yourself or surprise your loved ones with our premium delights.
          </p>
          <div className="flex justify-end mb-4">
            <Link to="/products">
              <button className="text-cakePink text-lg font-bold hover:underline">
                All Products
              </button>
            </Link>
          </div>
        </div>
        <div className="px-16">
          <ProductSwiperHome
            categories={categoriesWithProducts}
          />
        </div>
      </section>

    </div>
  );
};

export default Home;
