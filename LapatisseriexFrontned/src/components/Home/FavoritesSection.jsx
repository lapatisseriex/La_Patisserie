import React from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../../context/FavoritesContext/FavoritesContext';
import { useAuth } from '../../context/AuthContext/AuthContext';
import ProductCard from '../Products/ProductCard';
import { ArrowRight } from 'lucide-react';

const FavoritesSection = () => {
  const { favorites, loading } = useFavorites();
  const { user } = useAuth();

  // Don't show the section if user is not logged in or has no favorites
  if (!user || !favorites || favorites.length === 0 || loading) {
    return null;
  }

  // Show first 3 favorites to match other sections style
  const displayFavorites = favorites.slice(0, 3);

  return (
    <section className="w-full py-10 ">
      <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <h2 className="text-xl font-bold text-black uppercase tracking-wide mb-4 text-left">
          Favorites For You
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {displayFavorites.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
        
        {/* Show View All link if there are more than 3 favorites */}
        {favorites.length > 3 && (
          <div className="text-left mt-6">
            <Link 
              to="/favorites" 
              className="inline-flex items-center text-sm text-gray-600 hover:text-black transition-colors"
            >
              View All {favorites.length} Favorites <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default FavoritesSection;
