import React, { useEffect, useRef, useState } from 'react';
import { useCategory } from '../../context/CategoryContext/CategoryContext';
import { useProduct } from '../../context/ProductContext/ProductContext';
import { useAuth } from '../../context/AuthContext/AuthContext';

import BestSellers from './BestSellers';
import NewlyLaunched from './NewlyLaunched';
import HandpickedForYou from './HandpickedForYou';
import CartPickedForYou from './CartPickedForYou';
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

  // Load special images only once on mount
  useEffect(() => {
    const loadSpecialImages = async () => {
      try {
        console.log('🏠 Home component loading special images...');
        const images = await getSpecialImages();
        setSpecialImages(images);
      } catch (err) {
        console.error("Error loading special images:", err);
      }
    };
    
    // Load special images initially
    loadSpecialImages();
  }, []); // Empty dependency array - only run once on mount

  // Set up auto-refresh interval in a separate useEffect
  useEffect(() => {
    // Set up an interval to refresh special images every 15 minutes to reduce server load
    const refreshInterval = setInterval(async () => {
      // The getSpecialImages function will check the cache internally first
      // and only make an API call if the cache is expired
      console.log('🔄 Checking for special images updates...');
      try {
        const images = await getSpecialImages();
        setSpecialImages(images);
      } catch (err) {
        console.error("Error refreshing special images:", err);
      }
    }, 900000); // Refresh every 15 minutes instead of 5 minutes
    
    // Only refresh when page becomes visible after being hidden for a while
    let lastVisibilityChange = Date.now();
    const VISIBILITY_REFRESH_THRESHOLD = 300000; // 5 minutes
    
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        const now = Date.now();
        // Only refresh if it's been at least 5 minutes since last visibility change
        if (now - lastVisibilityChange > VISIBILITY_REFRESH_THRESHOLD) {
          console.log('📱 Page became visible after significant time, checking for updates');
          try {
            // getSpecialImages will check cache first
            const images = await getSpecialImages();
            setSpecialImages(images);
          } catch (err) {
            console.error("Error refreshing special images on visibility change:", err);
          }
        } else {
          console.log('📱 Page became visible but using cached data (< 5 minutes)');
        }
        lastVisibilityChange = now;
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [getSpecialImages]); // Keep getSpecialImages dependency for the interval functionality

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

      {/* Cart Picked for You Section - Shows cart items + recommendations */}
      <section className="w-full">
        <CartPickedForYou />
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



    </div>
    </>
  );
};

export default Home;
