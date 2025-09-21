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
    <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center animate-fadeIn">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl text-center animate-fadeIn">
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-black"></div>
            <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
              <img src="/images/logo.png" alt="Cake Logo" className="h-10 w-10 rounded-full bg-white" />
            </div>
          </div>
          <p className="text-xl font-semibold text-gray-800">{message}</p>
          <div className="w-full h-1 bg-gray-200 mt-4 overflow-hidden rounded-full">
            <div className="h-full bg-black animate-growWidth"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalLoadingOverlay;