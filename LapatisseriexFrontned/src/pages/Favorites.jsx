import React from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext/FavoritesContext';
import { useAuth } from '../context/AuthContext/AuthContext';
import ProductCard from '../components/Products/ProductCard';
import { Heart, ArrowLeft } from 'lucide-react';

const FavoritesPage = () => {
  const { favorites, loading, error } = useFavorites();
  const { user } = useAuth();

  // Show login message if user is not authenticated
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 pt-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-lg shadow-md p-8">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-black mb-2">Login Required</h2>
            <p className="text-gray-600 mb-6">Please login to view your favorite products</p>
            <Link 
              to="/" 
              className="bg-black text-white font-medium py-3 px-8 rounded-md hover:bg-gray-800 transition-colors"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 pt-16">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your favorites...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 pt-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-red-500 mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-black mb-2">Error Loading Favorites</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link 
              to="/" 
              className="bg-black text-white font-medium py-3 px-8 rounded-md hover:bg-gray-800 transition-colors"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header - Mobile Optimized */}
        <div className="mb-6">
          <Link 
            to="/products" 
            className="inline-flex items-center text-gray-600 hover:text-black transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Back to Products</span>
          </Link>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Heart className="w-6 h-6 text-red-500 mr-3" />
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-black">My Favorites</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {favorites.length > 0 
                    ? `${favorites.length} item${favorites.length !== 1 ? 's' : ''}`
                    : 'No items'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Favorites Grid - Improved Mobile Layout */}
        {favorites.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {favorites.map((product) => (
              <div key={product._id} className="w-full">
                <ProductCard 
                  product={product} 
                  className="w-full h-full"
                  compact={true}
                />
              </div>
            ))}
          </div>
        ) : (
          /* Empty State - Mobile Optimized */
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm p-8 mx-auto max-w-md">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No favorites yet</h3>
              <p className="text-gray-600 mb-6 text-sm">
                Start adding products to your favorites to see them here
              </p>
              <Link 
                to="/products" 
                className="inline-block bg-gradient-to-r from-rose-400 to-pink-500 text-white font-medium py-2 px-6 rounded-md hover:from-rose-500 hover:to-pink-600 transition-all duration-300 shadow-md text-sm"
              >
                Browse Products
              </Link>
            </div>
            
            {/* Popular Categories Suggestion */}
            <div className="mt-8">
              <p className="text-gray-600 mb-4 text-sm">Popular categories to explore:</p>
              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                <Link 
                  to="/products?category=cakes" 
                  className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
                >
                  <span className="text-2xl mb-1 block">🎂</span>
                  <span className="text-xs font-medium text-gray-700">Cakes</span>
                </Link>
                <Link 
                  to="/products?category=pastries" 
                  className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
                >
                  <span className="text-2xl mb-1 block">🥐</span>
                  <span className="text-xs font-medium text-gray-700">Pastries</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;