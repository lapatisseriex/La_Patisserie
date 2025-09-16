import React, { useEffect, useRef, useState } from 'react';
import { useCategory } from '../../context/CategoryContext/CategoryContext';
import { useProduct } from '../../context/ProductContext/ProductContext';
import { useAuth } from '../../context/AuthContext/AuthContext';

import BrowseCategories from './BrowseCategories';
import TopTrending from './TopTrending';
import BestSellers from './BestSellers';
import NewlyLaunched from './NewlyLaunched';
import CategorySwiper from './categorySwiper';

const Home = () => {
  const headingRef = useRef(null);
  const textRef = useRef(null);
  const buttonsRef = useRef(null);
  const imageRef = useRef(null);

  const topTrendingRef = useRef(null);
  const bestSellersRef = useRef(null);
  const newlyLaunchedRef = useRef(null);

  const { categories, fetchCategories } = useCategory();
  const { fetchProducts } = useProduct();
  const { isAuthenticated } = useAuth();

  const [categoriesWithProducts, setCategoriesWithProducts] = useState([]);
  const [topTrendingProducts, setTopTrendingProducts] = useState([]);
  const [bestSellersProducts, setBestSellersProducts] = useState([]);
  const [newlyLaunchedProducts, setNewlyLaunchedProducts] = useState([]);

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
    const loadSectionProducts = async () => {
      try {
        const trending = await fetchProducts({ limit: 3, sort: 'soldCount:-1' });
        const best = await fetchProducts({ limit: 3, sort: 'rating:-1' });
        const newly = await fetchProducts({ limit: 3, sort: 'createdAt:-1' });
        setTopTrendingProducts(trending.products);
        setBestSellersProducts(best.products);
        setNewlyLaunchedProducts(newly.products);
      } catch (err) {
        console.error("Error loading section products:", err);
      }
    };
    loadSectionProducts();
  }, [fetchProducts]);

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

  const scrollToSection = (ref) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white font-sans flex flex-col items-center">

      {/* Hero Section */}
      <section className="w-full py-8 text-center">
        <h1 ref={headingRef} className="text-3xl font-bold text-gray-900 opacity-0 transform translate-y-4 transition-all duration-500">
          Welcome to Our Store
        </h1>
        <p ref={textRef} className="text-gray-600 mt-2 opacity-0 transform translate-y-4 transition-all duration-500">
          Explore trending items, best sellers, and the newest arrivals!
        </p>
      </section>

      {/* Browse Categories Section */}
      <section className="w-full py-6 bg-white">
        <CategorySwiper 
          categories={categoriesWithProducts} 
          topTrendingRef={topTrendingRef} 
          bestSellersRef={bestSellersRef} 
          newlyLaunchedRef={newlyLaunchedRef} 
        />
      </section>

      <section ref={topTrendingRef} className="w-full py-6">
        <TopTrending />
      </section>

      <section ref={bestSellersRef} className="w-full py-6">
        <BestSellers />
      </section>

      <section ref={newlyLaunchedRef} className="w-full py-6">
        <NewlyLaunched />
      </section>


    </div>
  );
};

export default Home;
