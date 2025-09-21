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
import PageLoadingAnimation from '../common/PageLoadingAnimation';
import AdvertisementBanner from './AdvertisementBanner';

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

  const { categories, fetchCategories, getSpecialImages, specialImagesVersion, loading: categoriesLoading } = useCategory();
  const { fetchProducts } = useProduct();
  const { isAuthenticated } = useAuth();

  const [bestSellersProducts, setBestSellersProducts] = useState([]);
  const [newlyLaunchedProducts, setNewlyLaunchedProducts] = useState([]);
  const [specialImages, setSpecialImages] = useState({ bestSeller: null, newlyLaunched: null });
  const [productsLoading, setProductsLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);

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
        setProductsLoading(true);
        const best = await fetchProducts({ limit: 3, sort: 'rating:-1' });
        const newly = await fetchProducts({ limit: 3, sort: 'createdAt:-1' });
        setBestSellersProducts(best.products);
        setNewlyLaunchedProducts(newly.products);
      } catch (err) {
        console.error("Error loading section products:", err);
      } finally {
        setProductsLoading(false);
      }
    };
    loadSectionProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const loadSpecialImages = async () => {
      try {
        const images = await getSpecialImages();
        setSpecialImages(images);
      } catch (err) {
        console.error("Error loading special images:", err);
      }
    };
    
    // Load special images initially
    loadSpecialImages();
    
    // Set up an interval to refresh special images every 30 seconds
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing special images');
      loadSpecialImages();
    }, 30000); // Refresh every 30 seconds
    
    // Also refresh when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible, refreshing special images');
        loadSpecialImages();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [getSpecialImages, specialImagesVersion]); // Add specialImagesVersion to dependencies

  // Manage overall page loading state
  useEffect(() => {
    // Check if all critical data has loaded
    const checkLoadingComplete = () => {
      if (!categoriesLoading && !productsLoading) {
        // Add a small delay to ensure smooth transition
        setTimeout(() => {
          setPageLoading(false);
        }, 1500); // Show loading for at least 1.5 seconds
      }
    };
    
    checkLoadingComplete();
  }, [categoriesLoading, productsLoading]);

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
    <>
      {/* Page Loading Animation */}
      <PageLoadingAnimation isVisible={pageLoading} />
      
      {/* Main Content */}
      <div className={`bg-white font-sans flex flex-col items-center transition-opacity duration-500 ${pageLoading ? 'opacity-0' : 'opacity-100'}`}>

        {/* Advertisement Banner Section - Combined Video and Image Carousel */}
        <section className="w-full">
          <AdvertisementBanner />
        </section>

        <section ref={newlyLaunchedRef} className="w-full">
          <NewlyLaunched products={newlyLaunchedProducts} loading={productsLoading} />
        </section>

      {/* Recently Viewed Section - Shows only for authenticated users */}
      <section className="w-full">
        <RecentlyViewedSection />
      </section>

      {/* Browse Categories Section */}
      <section className="w-full">
        <CategorySwiper 
          categories={categories}
          loading={categoriesLoading}
          topTrendingRef={topTrendingRef} 
          bestSellersRef={bestSellersRef} 
          newlyLaunchedRef={newlyLaunchedRef}
          handpickedRef={handpickedRef}
          favoritesRef={favoritesRef}
          bestSellersImage={specialImages.bestSeller || bestSellersProducts[0]?.images[0]}
          newlyLaunchedImage={specialImages.newlyLaunched || newlyLaunchedProducts[0]?.images[0]}
        />
      </section>

      <section ref={bestSellersRef} className="w-full">
        <BestSellers products={bestSellersProducts} loading={productsLoading} />
      </section>

      <section ref={handpickedRef} className="w-full">
        <HandpickedForYou />
      </section>

      <section ref={favoritesRef} className="w-full">
        <FavoritesSection />
      </section>

    </div>
    </>
  );
};

export default Home;
