import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useCart } from '../../hooks/useCart';
import { fetchProducts } from '../../redux/productsSlice';
import { useAuth } from '../../hooks/useAuth';
import { useRecentlyViewed } from '../../context/RecentlyViewedContext/RecentlyViewedContext';
import ProductCard from '../Products/ProductCard';
import PremiumSectionSkeleton from '../common/PremiumSectionSkeleton';

const CartPickedForYou = () => {
  const { cartItems } = useCart();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { recentlyViewed } = useRecentlyViewed();
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendationType, setRecommendationType] = useState('');

  // Memoize cart analysis for performance
  const cartAnalysis = useMemo(() => {
    if (!cartItems || cartItems.length === 0) {
      return {
        lastProduct: null,
        categories: [],
        productIds: [],
        hasItems: false
      };
    }

    const productIds = cartItems.map(item => item.productId);
    const lastProduct = cartItems[cartItems.length - 1]; // Most recently added
    
    // Extract unique categories from cart items
    const categories = [...new Set(
      cartItems
        .map(item => item.category || item.productDetails?.category)
        .filter(Boolean)
    )];

    return {
      lastProduct,
      categories,
      productIds,
      hasItems: true
    };
  }, [cartItems]);

  useEffect(() => {
    const loadSmartRecommendations = async () => {
      try {
        setLoading(true);

        // If no user or no cart items, don't show recommendations
        if (!user || !cartAnalysis.hasItems) {
          setRecommendedProducts([]);
          setLoading(false);
          return;
        }

        console.log('🛒 Cart Analysis:', cartAnalysis);
        console.log('👀 Recently Viewed:', recentlyViewed);

        let recommendations = [];
        let recType = '';

        // Strategy 1: Products from same category as last added item
        if (cartAnalysis.lastProduct?.category) {
          console.log('🎯 Finding products from same category as last item...');
          try {
            const categoryResult = await dispatch(fetchProducts({
              key: 'cartRecommendations',
              category: cartAnalysis.lastProduct.category,
              limit: 15,
              sort: 'rating:-1',
              isActive: true
            })).unwrap();
            
            const categoryRecommendations = categoryResult.products
              ?.filter(product => 
                product && 
                product._id && 
                !cartAnalysis.productIds.includes(product._id)
              ) || [];
            
            if (categoryRecommendations.length >= 3) {
              recommendations = categoryRecommendations.slice(0, 3);
              recType = `More ${cartAnalysis.lastProduct.category.name || 'similar items'}`;
            }
          } catch (error) {
            console.error('Error fetching category recommendations:', error);
          }
        }

        // Strategy 2: If category strategy didn't work, use recently viewed
        if (recommendations.length < 3 && recentlyViewed && recentlyViewed.length > 0) {
          console.log('� Using recently viewed products...');
          const recentProducts = recentlyViewed
            .map(item => item.productId || item)
            .filter(product => 
              product && 
              product._id && 
              !cartAnalysis.productIds.includes(product._id)
            )
            .slice(0, 3);
          
          if (recentProducts.length > 0) {
            recommendations = recentProducts;
            recType = 'From your recent views';
          }
        }

        // Strategy 3: Fallback to popular products
        if (recommendations.length < 3) {
          console.log('⭐ Falling back to popular products...');
          try {
            const popularResult = await dispatch(fetchProducts({
              key: 'popularRecommendations',
              limit: 20,
              sort: 'rating:-1',
              isActive: true
            })).unwrap();
            
            const popularRecommendations = popularResult.products
              ?.filter(product => 
                product && 
                product._id && 
                !cartAnalysis.productIds.includes(product._id)
              ) || [];
            
            recommendations = popularRecommendations.slice(0, 3);
            recType = 'Popular choices';
          } catch (error) {
            console.error('Error fetching popular recommendations:', error);
          }
        }
        
        console.log('✅ Final recommendations:', recommendations.length, 'items');
        console.log('📝 Recommendation type:', recType);
        
        setRecommendedProducts(recommendations);
        setRecommendationType(recType);
        
      } catch (err) {
        console.error("Error loading smart recommendations:", err);
        setRecommendedProducts([]);
        setRecommendationType('');
      } finally {
        setLoading(false);
      }
    };

    loadSmartRecommendations();
  }, [cartAnalysis, dispatch, user, recentlyViewed]);

  // Don't render section if no cart items, or no recommendations
  if (!cartAnalysis.hasItems || (recommendedProducts.length === 0 && !loading)) {
    return null;
  }

  if (loading) {
    return (
      <section className="w-full py-0 md:py-6">
        <div className="max-w-screen-xl mx-auto pt-6 pb-6 md:pt-0 md:pb-0">
          <PremiumSectionSkeleton 
            variant="products" 
            count={3}
            title="Picked for Your Cart"
            showHeader={true}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-0 md:py-6">
      <div className="max-w-screen-xl mx-auto px-4 pt-6 pb-6 md:pt-0 md:pb-0">
        <div className="mb-8 space-y-3">
          <h2 className="text-2xl font-bold tracking-wide text-left" style={{ 
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0px 0px 1px rgba(249, 115, 22, 0.2)'
          }}>
            Picked for Your Cart
          </h2>
          <p className="text-gray-600 text-sm">
            {cartAnalysis.lastProduct ? 
              `Based on your cart` : 
              'Recommended just for you'
            }
          </p>
        </div>
        
        {/* Show recommended products */}
        {recommendedProducts.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {recommendationType || 'You Might Also Like'}
              </h3>
            
            </div>
            <div className="overflow-x-auto pb-4 scrollbar-hide" style={{ scrollBehavior: 'smooth' }}>
              <div className="flex space-x-6 min-w-max px-1">
                {recommendedProducts.map(product => (
                  <div key={product._id} className="flex-shrink-0 w-64 sm:w-72 md:w-80">
                    <ProductCard product={product} hideCartButton={true} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">
              No recommendations available at the moment
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default CartPickedForYou;