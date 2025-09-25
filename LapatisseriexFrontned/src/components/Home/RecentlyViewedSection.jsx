import React, { useState, useEffect } from 'react';
import { useRecentlyViewed } from '../../context/RecentlyViewedContext/RecentlyViewedContext';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { useShopStatus } from '../../context/ShopStatusContext';
import ProductCard from '../Products/ProductCard';
import PremiumSectionSkeleton from '../common/PremiumSectionSkeleton';
import { Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RecentlyViewedSection = () => {
  const { shouldShowSection } = useShopStatus();
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

  // Don't render if user is not logged in, no recently viewed products, or shop is closed
  if (!user || (!loading && recentlyViewed.length === 0) || !shouldShowSection()) {
    return null;
  }

  return (
    <section className="w-full py-0 md:py-6 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-screen-xl mx-auto px-4 pt-6 pb-6 md:pt-0 md:pb-0">
        {/* Loading State */}
        {loading && (
          <PremiumSectionSkeleton 
            variant="products" 
            count={3}
            title="Recently Viewed"
            showHeader={true}
          />
        )}

        {!loading && recentlyViewed.length > 0 && (
          <>
            <div className="mb-8 space-y-3">
              <h2 className="text-2xl font-bold tracking-wide text-left" style={{ 
                background: 'linear-gradient(135deg, #e0a47d 0%, #c17e5b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0px 0px 1px rgba(224, 164, 125, 0.2)'
              }}>
                Recently Viewed
              </h2>
           
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {recentlyViewed.map((item) => {
                // Ensure item has valid productId
                if (!item.productId || !item.productId._id) {
                  return null;
                }
                return (
                  <div key={item.productId._id}>
                    <ProductCard product={item.productId} />
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && recentlyViewed.length === 0 && user && (
          <div className="text-center py-16">
            <div className="flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mx-auto mb-6">
              <Clock className="h-10 w-10 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No Recently Viewed Products</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">Start exploring our delicious cakes and desserts to see them here!</p>
            <button
              onClick={() => navigate('/products')}
              className="bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white font-medium px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
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
