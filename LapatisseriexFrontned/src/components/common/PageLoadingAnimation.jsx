import React, { useState } from 'react';

// Elegant pastel version for La Patisserie aesthetic
const PageLoadingAnimation = ({
  isVisible = true,
  title = 'La Pâtisserie',
  subtitle = 'Crafting sweet moments, one masterpiece at a time...'
}) => {
  const [imgError, setImgError] = useState(false);
  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center flex-col text-center"
      style={{
        
       
      }}
    >
      {/* Logo / Cake GIF */}
      <div className="mb-6">
        {!imgError ? (
          <img
            src="/Vw3HJiDqa9-unscreen.gif"
            alt="Patisserie loading animation"
            className="w-28 h-28 md:w-32 md:h-32 drop-shadow-md animate-pulse-smooth"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-16 h-16 rounded-full border-[3px] border-[#e9bcbc] border-t-[#d98fa5] animate-spin" />
        )}
      </div>

      {/* Title */}
      <h2
        className="text-5xl md:text-6xl font-script font-normal mb-3 tracking-wider"
        style={{
          color: '#281c20',
          letterSpacing: '0.05em',
          textShadow: '2px 2px 6px rgba(139, 69, 19, 0.2)'
        }}
      >
        {title}
      </h2>

      {/* Subtitle */}
      <p className="text-base md:text-lg text-[#6b6b6b] font-elegant italic opacity-80 mb-4 tracking-wide">
        {subtitle}
      </p>

      {/* Animated dots */}
      <div className="flex justify-center items-center space-x-1.5 mt-4">
        <div className="w-3 h-3 rounded-full bg-[#281c20] animate-pulse-wave" />
        <div
          className="w-3 h-3 rounded-full bg-[#281c20] animate-pulse-wave"
          style={{ animationDelay: '0.2s' }}
        />
        <div
          className="w-3 h-3 rounded-full bg-[#281c20] animate-pulse-wave"
          style={{ animationDelay: '0.4s' }}
        />
      </div>

      {/* Elegant decorative elements */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <div className="w-12 h-[2px] bg-gradient-to-r from-transparent via-[#281c20] to-[#281c20] opacity-60" />
        <div className="w-2 h-2 rotate-45 bg-[#281c20] opacity-40" />
        <div className="w-12 h-[2px] bg-gradient-to-l from-transparent via-[#281c20] to-[#281c20] opacity-60" />
      </div>

      {/* Custom smooth pulse animation */}
      <style>
        {`
          @keyframes pulseSmooth {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.08); opacity: 0.9; }
          }
          .animate-pulse-smooth {
            animation: pulseSmooth 1.8s ease-in-out infinite;
          }
          @keyframes pulseWave {
            0%, 100% { 
              transform: scale(0.8); 
              opacity: 0.4;
            }
            50% { 
              transform: scale(1.2); 
              opacity: 1;
            }
          }
          .animate-pulse-wave {
            animation: pulseWave 1.4s ease-in-out infinite;
          }
        `}
      </style>
    </div>
  );
};

export default PageLoadingAnimation;
