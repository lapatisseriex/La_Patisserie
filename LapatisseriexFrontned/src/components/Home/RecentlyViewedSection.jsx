import React, { useState, useEffect } from 'react';
import { useRecentlyViewed } from '../../context/RecentlyViewedContext/RecentlyViewedContext';
import { useAuth } from '../../context/AuthContext/AuthContext';
import ProductCard from '../Products/ProductCard';
import { Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RecentlyViewedSection = () => {
  const { fetchRecentlyViewed } = useRecentlyViewed();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(false);

  // Validate MongoDB ObjectId format
  const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

  useEffect(() => {
    const loadRecentlyViewed = async () => {
      if (!user) {
        setRecentlyViewed([]);
        return;
      }

      setLoading(true);
      try {
        const recentlyViewedData = await fetchRecentlyViewed();
        // Filter out items with invalid or null productIds and limit to 3 products for the homepage
        const validRecentlyViewed = recentlyViewedData
          .filter(item => item.productId && item.productId._id && isValidObjectId(item.productId._id))
          .slice(0, 3); // Changed from 8 to 3
        setRecentlyViewed(validRecentlyViewed);
      } catch (error) {
        console.error('Error loading recently viewed:', error);
        setRecentlyViewed([]);
      } finally {
        setLoading(false);
      }
    };

    loadRecentlyViewed();
  }, [user, fetchRecentlyViewed]);

  // Don't render if user is not logged in or no recently viewed products
  if (!user || (!loading && recentlyViewed.length === 0)) {
    return null;
  }

  return (
    <section className="w-full py-6 bg-gray-50">
      <div className="max-w-screen-xl mx-auto px-4">
        <h2 className="text-xl font-bold text-black uppercase tracking-wide mb-4 text-left">
          Recently Viewed
        </h2>
        
        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 aspect-square rounded-lg mb-3"></div>
                <div className="bg-gray-200 h-4 rounded mb-2"></div>
                <div className="bg-gray-200 h-4 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        )}

        {/* Products Grid - Same style as HandpickedForYou */}
        {!loading && recentlyViewed.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {recentlyViewed.map((item) => {
              // Ensure item has valid productId
              if (!item.productId || !item.productId._id) {
                return null;
              }
              return (
                <ProductCard key={item.productId._id} product={item.productId} />
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && recentlyViewed.length === 0 && user && (
          <div className="text-center py-12">
            <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4">
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recently Viewed Products</h3>
            <p className="text-gray-600 mb-6">Start exploring our delicious cakes and desserts!</p>
            <button
              onClick={() => navigate('/products')}
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Browse Products
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default RecentlyViewedSection;
