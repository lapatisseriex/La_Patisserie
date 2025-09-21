import React from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../../context/FavoritesContext/FavoritesContext';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { useShopStatus } from '../../context/ShopStatusContext';
import ProductCard from '../Products/ProductCard';
import PremiumSectionSkeleton from '../common/PremiumSectionSkeleton';
import { ArrowRight } from 'lucide-react';

const FavoritesSection = () => {
  const { shouldShowSection } = useShopStatus();
  const { favorites, loading } = useFavorites();
  const { user } = useAuth();

  // Show loading state for authenticated users
  if (user && loading) {
    return (
      <section className="w-full py-0 md:py-6">
        <div className="max-w-screen-xl mx-auto pt-6 pb-6 md:pt-0 md:pb-0">
          <PremiumSectionSkeleton 
            variant="products" 
            count={3}
            title="Your Favorites"
            showHeader={true}
          />
        </div>
      </section>
    );
  }

  // Don't show the section if user is not logged in, has no favorites, or shop is closed
  if (!user || !favorites || favorites.length === 0 || !shouldShowSection()) {
    return null;
  }

  // Show first 3 favorites to match other sections style
  const displayFavorites = favorites.slice(0, 3);

  return (
    <section className="w-full py-0 md:py-6">
      <div className="max-w-screen-xl mx-auto px-4 pt-6 pb-6 md:pt-0 md:pb-0">
        <div className="mb-8 space-y-3">
          <h2 className="text-2xl font-bold tracking-wide text-left" style={{ 
            background: 'linear-gradient(135deg, #e0a47d 0%, #c17e5b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0px 0px 1px rgba(224, 164, 125, 0.2)'
          }}>
            Your Favorites
          </h2>
        
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {displayFavorites.map(product => (
            <div key={product._id} className="transform hover:scale-105 transition-transform duration-300">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
        
        {/* Show View All link if there are more than 3 favorites */}
        {favorites.length > 3 && (
          <div className="text-left mt-8">
            <Link 
              to="/favorites" 
              className="inline-flex items-center px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-all duration-300"
            >
              View All {favorites.length} Favorites <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default FavoritesSection;
