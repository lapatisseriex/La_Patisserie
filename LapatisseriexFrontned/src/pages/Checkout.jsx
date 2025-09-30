import React from 'react';
import { useAuth } from '../context/AuthContext/AuthContextRedux';
import Checkout from '../components/Checkout';

const CheckoutPage = () => {
  const { isAuthenticated, loading } = useAuth();
  
  // Show loading indicator while auth state is being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }
  
  // Redirect or show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Please Log In</h1>
        <p className="mb-6">You need to be logged in to access the checkout page.</p>
        <button 
          onClick={() => window.location.href = '/'}
          className="px-6 py-2 bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-md hover:from-rose-500 hover:to-pink-600 transition-all duration-300 shadow-md"
        >
          Return to Home
        </button>
      </div>
    );
  }
  
  return <Checkout />;
};

export default CheckoutPage;