import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  const navigate = useNavigate();

  const goHome = () => {
    navigate('/');
  };

  const goBack = () => {
    navigate(-1);
  };

  const goToProducts = () => {
    navigate('/products');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <img 
            src="/images/404-illustration.png" 
            alt="404 Error - Page Not Found" 
            className="w-96 h-72 mx-auto object-contain"
            onError={(e) => {
              // Fallback if image fails to load
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          {/* Fallback visual element */}
          <div 
            className="w-96 h-72 mx-auto rounded-2xl flex items-center justify-center text-8xl"
            style={{
              display: 'none',
              backgroundColor: '#f8fafc',
              border: '2px dashed #cbd5e1',
              color: '#64748b'
            }}
          >
            404
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h1 className="text-3xl font-normal mb-4" style={{color: '#281c20'}}>
            Page Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={goHome}
            className="px-8 py-3 rounded-lg font-normal text-white hover:opacity-90 transition-all duration-200 flex items-center gap-2"
            style={{ backgroundColor: '#281c20' }}
          >
            <Home className="w-5 h-5" />
            Go to Homepage
          </button>

          <button
            onClick={goToProducts}
            className="px-8 py-3 rounded-lg font-normal bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200 flex items-center gap-2"
          >
            <Search className="w-5 h-5" />
            Browse Products
          </button>

          <button
            onClick={goBack}
            className="px-8 py-3 rounded-lg font-normal bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        {/* Brand Footer */}
        <div className="mt-12 text-xs text-gray-400">
          La Patisserie - Exclusive for Hostel Students
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;