import React, { useRef, useEffect, useState } from 'react';

const HeroVideo = () => {
  const videoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Video file path - the long filename from the public folder

  const videoSrc = 'cake-shop-video-script-generation-mp4-1758274175070-v2-1-mp4-1758276882194_k9xan0WO.mp4_1758374077794.mp4';
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      setIsLoading(false);
      setHasError(false);
      setIsLoaded(true);
    };

    const handleError = () => {
      setIsLoading(false);
      setHasError(true);
      console.error('Error loading hero video');
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setIsLoaded(true);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  if (hasError) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-orange-100 flex items-center justify-center">
        <div className="text-center text-gray-700">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
            La Patisserie
          </h1>
          <p className="text-xl md:text-2xl mb-4">Artisanal Cakes & Premium Desserts</p>
          <p className="text-lg">Where every bite tells a story of passion and craftsmanship</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-video-container relative w-full h-screen overflow-hidden">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-rose-50 to-orange-100 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mx-auto mb-6"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-rose-400 rounded-full animate-spin m-auto"></div>
            </div>
            <p className="text-gray-700 text-lg font-medium">Preparing your sweet experience...</p>
          </div>
        </div>
      )}
      
      {/* Video Background */}
      <video
        ref={videoRef}
        className="absolute top-0 left-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/placeholder-image.jpg"
        onLoadedData={() => {
          // Start video from 7 seconds
          if (videoRef.current) {
            videoRef.current.currentTime = 7;
          }
        }}
      >
        <source src={videoSrc + '#t=7'} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70"></div>
      
      {/* Content Overlay - Left and Right Corner Design */}
      <div className={`absolute inset-0 transition-all duration-1500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        {/* Left Corner Content */}
        <div className="absolute top-8 left-8 max-w-md z-10">
          {/* Brand Logo */}
          <div className="mb-6">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-2 tracking-wider" 
                style={{ fontFamily: "'Dancing Script', cursive" }}>
              La Patisserie
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full"></div>
          </div>
          
          {/* Tagline */}
          <div className="mb-8">
            <p className="text-xl md:text-2xl text-pink-100 mb-2 font-light italic" 
               style={{ fontFamily: 'Dancing Script, cursive' }}>
              Artisanal Excellence
            </p>
            <p className="text-lg text-gray-200 leading-relaxed" 
               style={{ fontFamily: 'Poppins, sans-serif' }}>
              Where passion meets perfection in every handcrafted creation
            </p>
          </div>
          
        {/* Features List */}
        <div className="space-y-3">
          <div className="flex items-center text-white/90">
            <span className="w-2 h-2 bg-pink-400 rounded-full mr-3"></span>
            <span className="text-sm">Premium Ingredients</span>
          </div>
          <div className="flex items-center text-white/90">
            <span className="w-2 h-2 bg-rose-400 rounded-full mr-3"></span>
            <span className="text-sm">Custom Designs</span>
          </div>
          <div className="flex items-center text-white/90">
            <span className="w-2 h-2 bg-amber-400 rounded-full mr-3"></span>
            <span className="text-sm">Fresh Daily</span>
          </div>
        </div>
      </div>
    </div>
      
      {/* Decorative Floating Elements */}
      <div className="absolute top-1/4 left-8 w-24 h-24 bg-pink-300/30 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-1/3 right-12 w-32 h-32 bg-rose-400/25 rounded-full blur-3xl animate-pulse delay-700"></div>
      <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-amber-300/25 rounded-full blur-xl animate-pulse delay-1000"></div>
      <div className="absolute bottom-1/4 left-1/4 w-16 h-16 bg-pink-400/30 rounded-full blur-lg animate-pulse delay-500"></div>
      
      {/* Elegant Video Controls */}
      <div className="absolute bottom-6 right-6">
        <button
          onClick={() => {
            const video = videoRef.current;
            if (video) {
              if (video.paused) {
                video.play();
              } else {
                video.pause();
              }
            }
          }}
          className="bg-black/40 backdrop-blur-sm text-white p-4 rounded-full hover:bg-black/60 transition-all duration-300 shadow-lg border border-white/20 group"
          aria-label="Play/Pause video"
        >
          <svg 
            className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default HeroVideo;