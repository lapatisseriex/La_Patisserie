import React, { useState } from 'react';

// Matches brand palette: #733857 (primary), #8d4466, #412434
const PageLoadingAnimation = ({ isVisible = true, title = 'Welcome to La Patisserie', subtitle = 'Loading delicious cakes...' }) => {
  const [imgError, setImgError] = useState(false);
  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto"
      style={{
        background:
          'linear-gradient(135deg, rgba(115,56,87,0.06), rgba(141,68,102,0.04))',
        backdropFilter: 'blur(2px)'
      }}
      role="status"
      aria-live="polite"
      aria-label="Page loading"
    >
      <div className="flex flex-col items-center ">
        <div className="mb-4">
          {!imgError ? (
            <img
              src="/Vw3HJiDqa9-unscreen.gif"
              alt="Loading animation"
              className="w-28 h-28 md:w-32 md:h-32 object-contain drop-shadow-sm"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-16 h-16 rounded-full border-4 border-[#e9d5df] border-t-[#733857] animate-spin" />
          )}
        </div>

        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-semibold mb-2 bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">
            {title}
          </h2>
          <p className="text-sm md:text-base text-[#6b6b6b]">{subtitle}</p>
        </div>

        <div className="flex space-x-1 mt-5" aria-hidden="true">
          <div className="w-2 h-2 rounded-full bg-[#733857] animate-bounce" />
          <div className="w-2 h-2 rounded-full bg-[#8d4466] animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-2 h-2 rounded-full bg-[#412434] animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>

        <div className="mt-4">
          <div className="h-1 w-24 rounded-full bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] opacity-70" />
        </div>
      </div>
    </div>
  );
};

export default PageLoadingAnimation;