import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useCategory } from '../../context/CategoryContext/CategoryContext';
import { useAuth } from '../../hooks/useAuth';
import { fetchProducts, fetchBestSellers, makeSelectListByKey, makeSelectLoadingByKey, selectHasBestSellers } from '../../redux/productsSlice';


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

  const dispatch = useDispatch();
  const { categories, fetchCategories, getSpecialImages, specialImagesVersion, loading: categoriesLoading } = useCategory();
  const { isAuthenticated } = useAuth();

  // Get section lists from Redux store via memoized selectors
  const selectBestSellers = makeSelectListByKey('bestSellers');
  const selectNewlyLaunched = makeSelectListByKey('newlyLaunched');
  const selectBestSellersLoading = makeSelectLoadingByKey('bestSellers');
  const selectNewlyLaunchedLoading = makeSelectLoadingByKey('newlyLaunched');

  const bestSellersProducts = useSelector(selectBestSellers);
  const newlyLaunchedProducts = useSelector(selectNewlyLaunched);
  const bestSellersLoading = useSelector(selectBestSellersLoading);
  const newlyLaunchedLoading = useSelector(selectNewlyLaunchedLoading);
  const hasBestSellers = useSelector(selectHasBestSellers);
  
  const [specialImages, setSpecialImages] = React.useState({ bestSeller: null, newlyLaunched: null });
  const pageLoading = categoriesLoading || bestSellersLoading || newlyLaunchedLoading;

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

  // Load products for homepage sections using keys so they don't overwrite each other
  useEffect(() => {
    dispatch(fetchBestSellers({ limit: 3 }));
    const t = setTimeout(() => {
      dispatch(fetchProducts({ key: 'newlyLaunched', limit: 3, sort: 'createdAt:-1' }));
    }, 150);
    return () => clearTimeout(t);
  }, [dispatch]);

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

  // Remove broken productsLoading dependency; page loading is computed directly

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
          <NewlyLaunched />
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
        {hasBestSellers && <BestSellers />}
      </section>

      <section ref={handpickedRef} className="w-full">
        <HandpickedForYou />
      </section>

    </div>
    </>
  );
};

export default Home;
