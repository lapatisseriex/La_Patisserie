import React, { useState, useEffect, useRef } from 'react';

const AdvertisementBanner = () => {
  // === STATE & REFS (ALL TOP-LEVEL) ===
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [preloadedImages, setPreloadedImages] = useState(new Set());
  const [bannerSlides, setBannerSlides] = useState([]);
  const [loading, setLoading] = useState(true);

  const videoRef = useRef(null);
  const intervalRef = useRef(null);
  const bannerRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const minSwipeDistance = 50;

  // === FETCH BANNERS ===
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/banners`);
        if (response.ok) {
          const data = await response.json();
          console.log('🎯 Banner API Response:', data);
          console.log('🎯 Banners received:', data.banners);
          setBannerSlides(data.banners || []);
        } else {
          console.error('🚨 Failed to fetch banners, status:', response.status);
          // fallback
          setBannerSlides([fallbackBanner()]);
        }
      } catch {
        setBannerSlides([fallbackBanner()]);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  // === PRELOAD IMAGES ===
  useEffect(() => {
    bannerSlides.forEach(slide => {
      if (slide.type === 'image' && !preloadedImages.has(slide.src)) {
        const img = new Image();
        img.onload = () => setPreloadedImages(prev => new Set([...prev, slide.src]));
        img.src = slide.src;
      }
    });
  }, [bannerSlides, preloadedImages]);

  // === DETECT MOBILE ===
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // === AUTO-PLAY SLIDES ===
  useEffect(() => {
    if (!bannerSlides.length) return;
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      if (!isPaused && !isTransitioning && bannerSlides.length > 0) {
        const currentBanner = bannerSlides[currentSlide];
        // Only auto-advance for image banners, let videos play naturally
        if (currentBanner.type === 'image') goToNextSlide();
      }
    }, 3000);

    return () => clearInterval(intervalRef.current);
  }, [currentSlide, isPaused, isTransitioning, isMobile, bannerSlides]);

  // === HANDLERS ===
  const goToNextSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setVideoEnded(false);
    setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
      setTimeout(() => setIsTransitioning(false), 100);
    }, 600);
  };

  const goToPrevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setVideoEnded(false);
    setTimeout(() => {
      setCurrentSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length);
      setTimeout(() => setIsTransitioning(false), 100);
    }, 600);
  };

  const handleVideoEnd = () => {
    setVideoEnded(true);
    goToNextSlide();
  };

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsPaused(true);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setIsPaused(false);
      return;
    }
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) goToNextSlide();
    else if (distance < -minSwipeDistance) goToPrevSlide();
    setIsPaused(false);
  };

  // === FALLBACK BANNER ===
  const fallbackBanner = () => ({
    _id: 'fallback',
    type: 'video',
    src: '/fallback.mp4',
    title: 'La Patisserie',
    subtitle: 'Sweet Perfection Awaits',
    description: 'Discover our exquisite collection of handcrafted desserts',
    leftContent: { features: ['Authentic French Techniques','Premium Ingredients','Artisan Crafted Daily'] },
  });

  // === RENDER LOADING / EMPTY ===
  if (loading) return <BannerLoading />;
  if (!bannerSlides.length) return <BannerEmpty />;

  const currentBanner = bannerSlides[currentSlide];
  
  console.log('🎬 Current banner being rendered:', currentBanner);
  console.log('🎬 Banner type:', currentBanner?.type);
  console.log('🎬 Banner src:', currentBanner?.src);

  return (
    <div 
      ref={bannerRef} 
      className="relative w-full h-[60vh] md:h-[70vh] lg:h-[80vh] overflow-hidden select-none"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Background Media */}
      {currentBanner.type === 'video' ? (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          muted
          playsInline
          loop={isMobile}
          controls={false}
          controlsList="nodownload nofullscreen noremoteplayback"
          disablePictureInPicture
          poster="/placeholder.jpg"
          key={`video-${currentSlide}`}
          onEnded={handleVideoEnd}
          style={{ outline: 'none', backgroundColor: '#000', transition: 'opacity 800ms ease-in-out' }}
        >
          <source src={currentBanner.src} type="video/mp4" />
        </video>
      ) : (
        <div
          className="w-full h-full bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${currentBanner.src})`,
            backgroundColor: '#000',
            opacity: preloadedImages.has(currentBanner.src) ? 1 : 0,
            transition: 'opacity 800ms ease-in-out'
          }}
          key={`image-${currentSlide}`}
        />
      )}

      {/* Overlay & Content */}
      <div className="absolute inset-0 z-10 bg-black/20"></div>
      <div className="absolute inset-0 z-20 p-8 text-white">
        <h1 className="text-4xl font-bold">{currentBanner.title}</h1>
        <p className="text-xl italic mt-2">{currentBanner.subtitle}</p>
        <p className="mt-4 max-w-md">{currentBanner.description}</p>
        <ul className="mt-4 space-y-2">
          {currentBanner.leftContent.features.map((f, i) => (
            <li key={i} className="text-sm">• {f}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// === LOADING COMPONENT ===
const BannerLoading = () => (
  <div className="relative w-full h-[60vh] md:h-[70vh] lg:h-[80vh] flex items-center justify-center bg-black">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-400 mx-auto"></div>
      <p className="text-white mt-4">Loading banners...</p>
    </div>
  </div>
);

// === EMPTY COMPONENT ===
const BannerEmpty = () => (
  <div className="relative w-full h-[60vh] md:h-[70vh] lg:h-[80vh] flex items-center justify-center bg-black text-white text-center">
    <h2 className="text-4xl font-bold">La Patisserie</h2>
    <p>Sweet Perfection Awaits</p>
  </div>
);

export default AdvertisementBanner;
