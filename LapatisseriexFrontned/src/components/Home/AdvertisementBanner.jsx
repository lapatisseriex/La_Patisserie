import React, { useState, useEffect, useRef } from 'react';

const AdvertisementBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [preloadedImages, setPreloadedImages] = useState(new Set());
  const videoRef = useRef(null);
  const intervalRef = useRef(null);
  const bannerRef = useRef(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Banner slides data - combining video and images
  const bannerSlides = [
    {
      id: 1,
      type: 'video',
      src: '/cake-shop-video-script-generation-mp4-1758274175070-v2-1-mp4-1758276882194_k9xan0WO.mp4_1758374077794.mp4',
      title: 'La Patisserie',
      subtitle: 'Sweet Perfection Awaits',
      description: 'Discover our exquisite collection of handcrafted desserts, from classic French pastries to innovative sweet creations',
      leftContent: {
        features: [
          'Authentic French Techniques',
          'Premium Imported Ingredients',
          'Artisan Crafted Daily'
        ]
      }
    },
    {
      id: 2,
      type: 'image',
      src: '/images/cake1.png',
      title: 'Crème Brulée',
      subtitle: 'Crack into Luxury',
      description: 'Rich, velvety Classic Crème Brulée or indulgent Chocolate Hazelnut Crème Brulée that melts in your mouth',
      leftContent: {
        features: [
          'Classic Vanilla Bean',
          'Chocolate Hazelnut Fusion',
          'Perfectly Caramelized Top'
        ]
      }
    },
    {
      id: 3,
      type: 'image',
      src: '/images/cake2.png',
      title: 'Tiramisu Collection',
      subtitle: 'The Italian Icon',
      description: 'Layers of creamy delight in Classic, Chocolate, Strawberry, Mango, Oreo, and Lotus Biscoff flavors',
      leftContent: {
        features: [
          '6 Gourmet Flavors Available',
          'Traditional Italian Recipe',
          'Coffee-Soaked Ladyfingers'
        ]
      }
    },
    {
      id: 4,
      type: 'image',
      src: '/images/cake3.png',
      title: 'Tiramisu Balls',
      subtitle: 'Bite-Sized Heaven',
      description: 'All your favorite tiramisu flavors in fun little bite-sized treats. Perfect for sharing or indulging solo',
      leftContent: {
        features: [
          'Individual Portion Treats',
          'Multiple Flavor Options',
          'Perfect for Gift Boxes'
        ]
      }
    },
    {
      id: 5,
      type: 'image',
      src: '/images/new.jpg',
      title: 'Coffee & Croissants',
      subtitle: 'Morning Delights',
      description: 'Bold coffee creations and flaky mini croissants - the perfect combination for any time of day',
      leftContent: {
        features: [
          'Vietnamese Coffee Blend',
          'Buttery Mini Croissants',
          'Chocolate Hazelnut Specials'
        ]
      }
    }
  ];

  // Preload images to prevent white flashes
  useEffect(() => {
    bannerSlides.forEach((slide) => {
      if (slide.type === 'image' && !preloadedImages.has(slide.src)) {
        const img = new Image();
        img.onload = () => {
          setPreloadedImages(prev => new Set([...prev, slide.src]));
        };
        img.src = slide.src;
      }
    });
  }, []);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-play functionality with infinite loop - simplified and more reliable
  useEffect(() => {
    const startAutoPlay = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = setInterval(() => {
        if (!isPaused && !isTransitioning) {
          const currentBanner = bannerSlides[currentSlide];
          
          // Always auto-advance for images, for video check if mobile
          if (currentBanner.type === 'image' || isMobile) {
            goToNextSlide();
          }
        }
      }, 3000); // 3 seconds for all slides
    };

    startAutoPlay();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentSlide, isMobile, isPaused, isTransitioning]);

  // Separate effect for video end handling
  useEffect(() => {
    const currentBanner = bannerSlides[currentSlide];
    if (currentBanner.type === 'video' && !isMobile) {
      // Video will handle its own progression via onEnded
      return;
    }
  }, [currentSlide, isMobile]);

  const goToNextSlide = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setVideoEnded(false);
    
    // Smoother transition without delay
    setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
      // Reset transition state faster
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    }, 600); // Reduced delay for smoother experience
  };

  const goToPrevSlide = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setVideoEnded(false);
    
    setTimeout(() => {
      setCurrentSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    }, 600);
  };

  // Touch gesture handlers
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsPaused(true); // Temporarily pause auto-play
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      // Resume auto-play immediately if no swipe detected
      setIsPaused(false);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNextSlide();
    } else if (isRightSwipe) {
      goToPrevSlide();
    }
    
    // Resume auto-play after swipe
    setIsPaused(false);
  };

  const handleVideoEnd = () => {
    setVideoEnded(true);
    goToNextSlide();
  };

  const currentBanner = bannerSlides[currentSlide];

  return (
    <div 
      ref={bannerRef}
      className="relative w-full h-[60vh] md:h-[70vh] lg:h-[80vh] overflow-hidden select-none"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Background Media */}
      <div className="absolute inset-0">
        {/* Previous slide (behind) for seamless transition */}
        <div className="absolute inset-0 z-10">
          {currentBanner.type === 'video' ? (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay={!isMobile}
              muted
              playsInline
              controls={false}
              controlsList="nodownload nofullscreen noremoteplaybook"
              disablePictureInPicture
              poster="/placeholder-image.jpg"
              key={`video-${currentSlide}`}
              onEnded={handleVideoEnd}
              style={{ 
                outline: 'none',
                backgroundColor: '#000',
                transition: 'opacity 800ms ease-in-out'
              }}
              onLoadedData={() => {
                if (isMobile && videoRef.current) {
                  videoRef.current.play().catch(() => {
                    console.log('Video autoplay blocked on mobile, using timer fallback');
                  });
                }
              }}
            >
              <source src={currentBanner.src} type="video/mp4" />
            </video>
          ) : (
            <div 
              className="w-full h-full bg-cover bg-center bg-no-repeat"
              style={{ 
                backgroundImage: `url(${currentBanner.src})`,
                backgroundColor: '#000',
                transition: 'opacity 800ms ease-in-out',
                opacity: preloadedImages.has(currentBanner.src) ? 1 : 0
              }}
              key={`image-${currentSlide}`}
            />
          )}
        </div>
        
        {/* Transition overlay to prevent white flashes */}
        <div 
          className={`absolute inset-0 z-20 bg-black transition-opacity duration-700 ease-in-out pointer-events-none ${
            isTransitioning ? 'opacity-30' : 'opacity-0'
          }`}
        />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 z-30 bg-gradient-to-b from-black/50 via-black/30 to-black/60"></div>

      {/* Content Overlay */}
      <div className={`absolute inset-0 z-40 transition-all duration-700 ease-in-out ${
        isTransitioning 
          ? 'opacity-0 translate-y-2' 
          : 'opacity-100 translate-y-0'
      }`} key={`content-${currentSlide}`}>
        
        {/* Left Corner Content */}
        <div className="absolute top-8 left-8 max-w-md z-10">
          {/* Brand/Title */}
          <div className="mb-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 tracking-wider drop-shadow-lg" 
                style={{ fontFamily: 'Melted, Super Dessert, Cupcake Party, serif' }}>
              {currentBanner.title}
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full shadow-lg"></div>
          </div>
          
          {/* Subtitle & Description */}
          <div className="mb-8">
            <p className="text-xl md:text-2xl lg:text-3xl text-pink-100 mb-3 font-bold italic drop-shadow-md" 
               style={{ fontFamily: 'Melted, Cupcake Party, Dancing Script, cursive' }}>
              {currentBanner.subtitle}
            </p>
            <p className="text-base md:text-lg text-gray-200 leading-relaxed max-w-md drop-shadow-sm" 
               style={{ fontFamily: 'Poppins, sans-serif' }}>
              {currentBanner.description}
            </p>
          </div>
          
          {/* Features List */}
          <div className="space-y-3">
            {currentBanner.leftContent.features.map((feature, index) => (
              <div key={index} className="flex items-center text-white/90">
                <div className="w-2 h-2 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full mr-3"></div>
                <span className="text-sm font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Swipe Indicator for Mobile */}
        {isMobile && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
            <div className="flex items-center space-x-2 bg-black/30 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
              <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-white/70 text-xs font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Swipe
              </span>
              <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-16 w-20 h-20 bg-pink-400/20 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-1/3 right-20 w-24 h-24 bg-rose-400/15 rounded-full blur-3xl animate-pulse delay-700"></div>
      <div className="absolute top-1/3 right-1/3 w-16 h-16 bg-amber-300/20 rounded-full blur-xl animate-pulse delay-1000"></div>
      <div className="absolute bottom-1/4 left-1/3 w-12 h-12 bg-pink-500/25 rounded-full blur-lg animate-pulse delay-500"></div>
      
      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-pink-300/30 rounded-tl-3xl"></div>
      <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-rose-300/30 rounded-tr-3xl"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-amber-300/30 rounded-bl-3xl"></div>
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-pink-300/30 rounded-br-3xl"></div>
    </div>
  );
};

export default AdvertisementBanner;