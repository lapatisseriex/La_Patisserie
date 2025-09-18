import React, { useEffect, useRef, useState } from 'react';
import { useCategory } from '../../context/CategoryContext/CategoryContext';
import { useProduct } from '../../context/ProductContext/ProductContext';
import { useAuth } from '../../context/AuthContext/AuthContext';

import BestSellers from './BestSellers';
import NewlyLaunched from './NewlyLaunched';
import HandpickedForYou from './HandpickedForYou';
import FavoritesSection from './FavoritesSection';
import RecentlyViewedSection from './RecentlyViewedSection';
import CategorySwiper from './categorySwiper';

const Home = () => {
  const headingRef = useRef(null);
  const textRef = useRef(null);
  const buttonsRef = useRef(null);
  const imageRef = useRef(null);

  const topTrendingRef = useRef(null);
  const bestSellersRef = useRef(null);
  const newlyLaunchedRef = useRef(null);
  const handpickedRef = useRef(null);
  const favoritesRef = useRef(null);

  const { categories, fetchCategories } = useCategory();
  const { fetchProducts } = useProduct();
  const { isAuthenticated } = useAuth();

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
    const loadSectionProducts = async () => {
      try {
        const best = await fetchProducts({ limit: 3, sort: 'rating:-1' });
        const newly = await fetchProducts({ limit: 3, sort: 'createdAt:-1' });
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

      <section ref={newlyLaunchedRef} className="w-full">
        <NewlyLaunched products={newlyLaunchedProducts} />
      </section>

      {/* Recently Viewed Section - Shows only for authenticated users */}
      <section className="w-full">
        <RecentlyViewedSection />
      </section>

      {/* Browse Categories Section */}
      <section className="w-full py-6 ">
        <CategorySwiper 
          categories={categories} 
          topTrendingRef={topTrendingRef} 
          bestSellersRef={bestSellersRef} 
          newlyLaunchedRef={newlyLaunchedRef}
          handpickedRef={handpickedRef}
          favoritesRef={favoritesRef}
          bestSellersImage={bestSellersProducts[0]?.images[0]}
          newlyLaunchedImage={newlyLaunchedProducts[0]?.images[0]}
        />
      </section>

      <section ref={bestSellersRef} className="w-full py-6">
        <BestSellers products={bestSellersProducts} />
      </section>

      <section ref={handpickedRef} className="w-full py-6">
        <HandpickedForYou />
      </section>

      <section ref={favoritesRef} className="w-full py-6">
        <FavoritesSection />
      </section>

    </div>
  );
};

export default Home;
