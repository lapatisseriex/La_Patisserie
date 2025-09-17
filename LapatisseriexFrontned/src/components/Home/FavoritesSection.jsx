import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../../context/FavoritesContext/FavoritesContext';
import { useAuth } from '../../context/AuthContext/AuthContext';
import ProductCard from '../Products/ProductCard';
import { Heart, ArrowRight } from 'lucide-react';

const FavoritesSection = () => {
  const { favorites, loading } = useFavorites();
  const { user } = useAuth();
  const [favoriteCategories, setFavoriteCategories] = useState([]);

  useEffect(() => {
    if (favorites && favorites.length > 0) {
      // Extract unique categories from favorite products
      const categories = favorites.reduce((acc, product) => {
        if (product.category && !acc.find(cat => cat._id === product.category._id)) {
          acc.push(product.category);
        }
        return acc;
      }, []);
      setFavoriteCategories(categories);
    } else {
      setFavoriteCategories([]);
    }
  }, [favorites]);

  // Don't show the section if user is not logged in
  if (!user) {
    return null;
  }

  // Show loading state
  if (loading) {
    return (
      <section className="w-full py-6 bg-white">
        <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-black uppercase tracking-wide flex items-center justify-center">
              <Heart className="w-5 h-5 text-red-500 mr-2" />
              Your Favorites
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((index) => (
              <div key={index} className="bg-gray-50 rounded-lg shadow-sm p-4 animate-pulse">
                <div className="w-full aspect-square bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Don't show if no favorites
  if (!favorites || favorites.length === 0) {
    return (
      <section className="w-full py-6 bg-white">
        <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-black uppercase tracking-wide flex items-center justify-center">
              <Heart className="w-5 h-5 text-red-500 mr-2" />
              Your Favorites
            </h2>
          </div>
          
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No favorites yet</h3>
            <p className="text-gray-500 text-sm mb-4">Start adding products to your favorites to see them here</p>
            <Link 
              to="/products" 
              className="inline-block bg-black text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // Show first 3 favorites
  const displayFavorites = favorites.slice(0, 3);

  return (
    <section className="w-full py-6 bg-white">
      <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-black uppercase tracking-wide flex items-center justify-center mb-4">
            <Heart className="w-5 h-5 text-red-500 mr-2" />
            Your Favorites
          </h2>
          {favorites.length > 3 && (
            <div className="text-center">
              <Link 
                to="/favorites" 
                className="text-sm text-gray-600 hover:text-black transition-colors inline-flex items-center"
              >
                View All ({favorites.length}) <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          )}
        </div>

        {/* Favorite Categories */}
        {favoriteCategories.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 justify-center">
              {favoriteCategories.map((category) => (
                <Link
                  key={category._id}
                  to={`/products?category=${category._id}`}
                  className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-xs font-medium hover:bg-red-100 transition-colors"
                >
                  <Heart className="w-3 h-3 mr-1" />
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Favorite Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {displayFavorites.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>

        {/* Show View All button if there are more than 3 favorites */}
        {favorites.length > 3 && (
          <div className="text-center mt-6">
            <Link 
              to="/favorites" 
              className="inline-block bg-gray-100 text-gray-700 px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              View All {favorites.length} Favorites
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default FavoritesSection;
