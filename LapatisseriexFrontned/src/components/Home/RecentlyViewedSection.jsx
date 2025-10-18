import React, { useEffect } from 'react';
import { useRecentlyViewed } from '../../context/RecentlyViewedContext/RecentlyViewedContext';
import { useAuth } from '../../hooks/useAuth';
import { useShopStatus } from '../../context/ShopStatusContext';
import ProductCard from '../Products/ProductCard';
import './gridResponsive.css';
import PremiumSectionSkeleton from '../common/PremiumSectionSkeleton';
import { Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RecentlyViewedSection = () => {
  const { shouldShowSection } = useShopStatus();
  const { recentlyViewed, loading, fetchRecentlyViewed } = useRecentlyViewed();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Validate MongoDB ObjectId format
  const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

  // Filter for valid products
  const validRecentlyViewed = recentlyViewed
    .filter(item => item.productId && item.productId._id && isValidObjectId(item.productId._id))
    .slice(0, 3);

  useEffect(() => {
    // Load recently viewed products if user is logged in
    if (user) {
      fetchRecentlyViewed();
    }
  }, [user, fetchRecentlyViewed]);

  // Don't render if user is not logged in, no recently viewed products, or shop is closed
  if (!user || (!loading && validRecentlyViewed.length === 0) || !shouldShowSection()) {
    return null;
  }

  return (
    <section className="w-full py-0 md:py-6 bg-white" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
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

        {!loading && validRecentlyViewed.length > 0 && (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-light tracking-wide text-left text-[#733857]">
                Recently Viewed
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full min-w-0 grid-3-at-976">
              {validRecentlyViewed.map((item) => {
                // Ensure item has valid productId
                if (!item.productId || !item.productId._id) {
                  return null;
                }
                return (
                  <div key={item.productId._id} className="min-w-0 w-full flex">
                    <ProductCard product={item.productId} className="min-w-0 w-full" />
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && validRecentlyViewed.length === 0 && user && (
          <div className="py-14 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center border border-[#733857]/20">
              <Clock className="h-10 w-10 text-[#733857]" />
            </div>
            <h3 className="text-2xl font-light tracking-wide text-[#1a1a1a] mb-2">
              No recently viewed products
            </h3>
            <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
              Explore our latest desserts to see them appear here.
            </p>
            <button
              onClick={() => navigate('/products')}
              className="inline-flex items-center gap-2 border border-[#733857] px-6 py-3 text-sm font-medium tracking-wide text-[#733857] transition-colors duration-300 hover:bg-[#733857] hover:text-white"
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
