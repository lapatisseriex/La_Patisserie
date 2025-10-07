import React, { useEffect } from 'react';

const GlobalLoadingOverlay = ({ message = "Loading..." }) => {
  console.log("🌟 GlobalLoadingOverlay rendered with message:", message);
  
  // Move useEffect inside the component
  useEffect(() => {
    console.log("⚡ GlobalLoadingOverlay mounted");
    return () => {
      console.log("❌ GlobalLoadingOverlay unmounted");
    };
  }, []);
  
  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black bg-opacity-70 flex items-center justify-center"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999
      }}
    >
      <div 
        className="bg-white rounded-lg p-8 mx-4 max-w-sm w-full shadow-2xl text-center"
        style={{
          animation: 'fadeIn 0.3s ease-out'
        }}
      >
        <div className="flex flex-col items-center">
          {/* Logo Animation */}
          <div className="mb-6">
            <img 
              src="/images/logo.png" 
              alt="La Patisserie Logo" 
              className="h-16 w-16 mx-auto"
              style={{
                animation: 'spin 1.5s linear infinite'
              }}
            />
          </div>
          
          {/* Message */}
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{message}</h3>
          <p className="text-gray-600 text-sm mb-4">Please wait a moment...</p>
          
          {/* Progress Bar */}
          <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-black rounded-full"
              style={{
                animation: 'growWidth 2s ease-in-out infinite'
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalLoadingOverlay;