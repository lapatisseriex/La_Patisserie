import React from 'react';

const PageLoadingAnimation = ({ isVisible = true }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white flex items-center justify-center transition-opacity duration-500">
      <div className="flex flex-col items-center">
        {/* Your custom gif animation */}
        <div className="mb-4">
          <img 
            src="/Vw3HJiDqa9-unscreen.gif" 
            alt="Loading..." 
            className="w-32 h-32 object-contain"
          />
        </div>
        
        {/* Optional loading text */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Welcome to La Patisserie</h2>
          <p className="text-gray-600">Loading delicious cakes...</p>
        </div>
        
        {/* Optional loading dots animation */}
        <div className="flex space-x-1 mt-4">
          <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default PageLoadingAnimation;