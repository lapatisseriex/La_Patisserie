import React, { useEffect, useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useProduct } from '../../context/ProductContext/ProductContext';
import { useAuth } from '../../context/AuthContext/AuthContext';
import ProductCard from '../Products/ProductCard';
import PremiumSectionSkeleton from '../common/PremiumSectionSkeleton';

const CartPickedForYou = () => {
  const { cartItems } = useCart();
  const { fetchProducts } = useProduct();
  const { user } = useAuth();
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCartRecommendations = async () => {
      try {
        setLoading(true);

        // If no user or no cart items, don't show recommendations
        if (!user || !cartItems || cartItems.length === 0) {
          setRecommendedProducts([]);
          setLoading(false);
          return;
        }

        // Get product IDs that are already in cart to exclude them from recommendations
        const cartProductIds = cartItems.map(item => item.productId);
        console.log('🛒 Cart product IDs to exclude:', cartProductIds);

        // Fetch products and show popular ones (excluding items already in cart)
        const result = await fetchProducts({
          limit: 20,
          sort: 'rating:-1' // Sort by highest rated first
        });

        // Filter out products already in cart and take first 6
        const recommendedProducts = result.products
          .filter(product => !cartProductIds.includes(product._id))
          .slice(0, 6);
        
        setRecommendedProducts(recommendedProducts);
        
      } catch (err) {
        console.error("Error loading cart-based recommendations:", err);
        setRecommendedProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadCartRecommendations();
  }, [cartItems, fetchProducts, user]);

  // Don't render section if no cart items, or no recommendations
  if (!cartItems || cartItems.length === 0 || 
      (recommendedProducts.length === 0 && !loading)) {
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
            Your cart items and similar recommendations
          </p>
        </div>
        
        {/* Show current cart items first */}
        {cartItems.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">In Your Cart</h3>

          </div>
            <div className="overflow-x-auto pb-4 scrollbar-hide" style={{ scrollBehavior: 'smooth' }}>
              <div className="flex space-x-4 min-w-max px-1">
                {cartItems.map(item => (
                  <div key={item._id} className="flex-shrink-0 w-64 sm:w-72 bg-gray-50 rounded-lg p-4 border-2 border-orange-200 shadow-sm hover:shadow-md transition-all duration-200 active:scale-95">
                    <div className="flex items-center space-x-3">
                      {item.productSnapshot?.image && (
                        <img 
                          src={item.productSnapshot.image} 
                          alt={item.productSnapshot?.name || 'Cart item'}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {item.productSnapshot?.name || 'Product'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity} • ₹{item.productSnapshot?.price || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Show recommended products */}
        {recommendedProducts.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">You Might Also Like</h3>
            
            </div>
            <div className="overflow-x-auto pb-4 scrollbar-hide" style={{ scrollBehavior: 'smooth' }}>
              <div className="flex space-x-6 min-w-max px-1">
                {recommendedProducts.map(product => (
                  <div key={product._id} className="flex-shrink-0 w-64 sm:w-72 md:w-80">
                    <ProductCard product={product} />
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