import React, { useState } from 'react';

// Elegant pastel version for La Patisserie aesthetic
const PageLoadingAnimation = ({
  isVisible = true,
  title = 'La Patisserie',
  subtitle = 'Baking happiness, please wait...'
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
        className="text-3xl md:text-4xl font-serif font-semibold mb-2"
        style={{
          background:
            'linear-gradient(to right, #b86b77, #d98fa5, #b86b77)',
          WebkitBackgroundClip: 'text',
          color: 'transparent'}}
      >
        {title}
      </h2>

      {/* Subtitle */}
      <p className="text-sm md:text-base text-[#6b6b6b] italic opacity-80 mb-4">
        {subtitle}
      </p>

      {/* Animated dots */}
      <div className="flex justify-center space-x-2 mt-2">
        <div className="w-2.5 h-2.5 rounded-full bg-[#d98fa5] animate-bounce" />
        <div
          className="w-2.5 h-2.5 rounded-full bg-[#b86b77] animate-bounce"
          style={{ animationDelay: '0.15s' }}
        />
        <div
          className="w-2.5 h-2.5 rounded-full bg-[#8d5b68] animate-bounce"
          style={{ animationDelay: '0.3s' }}
        />
      </div>

      {/* Elegant underline */}
      <div className="mt-6">
        <div className="h-0.5 w-32 mx-auto bg-gradient-to-r from-[#d98fa5] via-[#b86b77] to-[#8d5b68] opacity-80 rounded-full" />
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
        `}
      </style>
    </div>
  );
};

export default PageLoadingAnimation;
