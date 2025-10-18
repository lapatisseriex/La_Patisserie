import React from 'react';
import { useAuth } from '../hooks/useAuth';

import Checkout from '../components/Checkout';

const CheckoutPage = () => {
  const { isAuthenticated, loading } = useAuth();
  
  // Show loading indicator while auth state is being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#733857]"></div>
      </div>
    );
  }
  
  // Redirect or show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4 text-[#733857]" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>Please Log In</h1>
        <p className="mb-6 text-gray-600" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>You need to be logged in to access the checkout page.</p>
        <style>{`
          .return-home-btn span {
            background: linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            transition: all 0.3s ease;
          }
          .return-home-btn:hover span {
            color: white !important;
            background: none !important;
            -webkit-background-clip: unset !important;
            background-clip: unset !important;
          }
        `}</style>
        <button 
          onClick={() => window.location.href = '/'}
          className="return-home-btn px-6 py-3 bg-white border-2 border-[#733857] rounded-md hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] transition-all duration-300 shadow-md font-medium transform hover:scale-[1.02] active:scale-[0.98]"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          <span>Return to Home</span>
        </button>
      </div>
    );
  }
  
  return <Checkout />;
};

export default CheckoutPage;