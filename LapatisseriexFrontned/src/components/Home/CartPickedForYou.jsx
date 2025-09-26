import React, { useEffect, useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useProduct } from '../../context/ProductContext/ProductContext';
import { useAuth } from '../../context/AuthContext/AuthContext';
import ProductCard from '../Products/ProductCard';
import PremiumSectionSkeleton from '../common/PremiumSectionSkeleton';

const CartPickedForYou = () => {
  const { cartItems, cartInitialized } = useCart();
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

        // Debug: Log cart items structure
        console.log('🔍 Cart items structure:', cartItems.map(item => ({
          name: item.productSnapshot?.name,
          category: item.productSnapshot?.category,
          product: item.product
        })));

        // Get unique categories from cart items - handle both category names and IDs
        const cartCategories = [...new Set(
          cartItems
            .map(item => {
              // Get category from productSnapshot
              const category = item.productSnapshot?.category;
              console.log('🔍 Cart item category:', category, 'for product:', item.productSnapshot?.name);
              return category;
            })
            .filter(category => category) // Remove undefined/null categories
        )];

        console.log('🛒 Cart categories extracted:', cartCategories);

        if (cartCategories.length === 0) {
          console.log('❌ No categories found in cart items');
          setRecommendedProducts([]);
          setLoading(false);
          return;
        }

        // Get product IDs that are already in cart to exclude them from recommendations
        const cartProductIds = cartItems.map(item => item.product);
        console.log('🛒 Cart product IDs to exclude:', cartProductIds);

        // Fetch products and filter by categories
        const result = await fetchProducts({
          limit: 50, // Fetch more products for better filtering
          sort: 'rating:-1' // Sort by highest rated first
        });

        console.log('🔍 Total products fetched:', result.products.length);

        // Debug: Log all product categories vs cart categories
        const allProductCategories = result.products.map(p => ({
          name: p.name,
          categoryName: p.category?.name,
          categoryId: p.category?._id
        }));
        console.log('🔍 First 10 product categories:', allProductCategories.slice(0, 10));
        console.log('🔍 Cart categories to match:', cartCategories);
        
        // Check if any cart categories match any product categories
        const potentialMatches = result.products.filter(p => 
          cartCategories.includes(p.category?.name) || 
          cartCategories.includes(p.category?._id)
        );
        console.log('🔍 Potential category matches found:', potentialMatches.length);

        // Filter products that belong to same categories as cart items
        let categoryMatchedProducts = result.products.filter(product => {
          const productCategoryName = product.category?.name;
          const productCategoryId = product.category?._id;
          
          // Check if product category matches any cart category (by name or ID)
          const matchesCategory = cartCategories.some(cartCategory => {
            return cartCategory === productCategoryName || 
                   cartCategory === productCategoryId ||
                   cartCategory === product.category;
          });
          
          // Also exclude products already in cart
          const notInCart = !cartProductIds.includes(product._id);
          
          if (matchesCategory && notInCart) {
            console.log('✅ Category match found:', product.name, 'category:', productCategoryName);
          }
          
          return matchesCategory && notInCart;
        });

        console.log('🎯 Category-matched products found:', categoryMatchedProducts.length);
        
        // If we have category matches, prioritize them
        if (categoryMatchedProducts.length > 0) {
          // Shuffle category-matched products and take up to 6
          const shuffledCategoryProducts = [...categoryMatchedProducts].sort(() => Math.random() - 0.5);
          setRecommendedProducts(shuffledCategoryProducts.slice(0, 6));
          console.log('✅ Showing category-based recommendations:', shuffledCategoryProducts.slice(0, 6).length, 'products');
        } else {
          // Fallback: show popular products if no category matches found
          console.log('⚠️ No category matches found, showing popular products as fallback');
          const fallbackProducts = result.products
            .filter(product => !cartProductIds.includes(product._id))
            .slice(0, 6);
          setRecommendedProducts(fallbackProducts);
        }
        
      } catch (err) {
        console.error("Error loading cart-based recommendations:", err);
        setRecommendedProducts([]);
      } finally {
        setLoading(false);
      }
    };

    // Only load recommendations when cart is initialized - REMOVE cartItems dependency to prevent auto-refresh
    if (cartInitialized) {
      loadCartRecommendations();
    }
  }, [cartInitialized, fetchProducts, user]); // Removed cartItems from dependency array

  // Separate effect to reload recommendations only when cart structure changes significantly
  // (not on every quantity update)
  useEffect(() => {
    // Only reload if cart went from empty to having items, or categories changed significantly
    if (cartItems && cartItems.length > 0 && cartInitialized) {
      const currentCategories = [...new Set(
        cartItems.map(item => item.productSnapshot?.category).filter(Boolean)
      )];
      
      // Check if we have different categories than what we're showing recommendations for
      const currentRecommendationCategories = [...new Set(
        recommendedProducts.map(product => product.category?.name).filter(Boolean)
      )];
      
      const categoriesChanged = JSON.stringify(currentCategories.sort()) !== 
                               JSON.stringify(currentRecommendationCategories.sort());
      
      if (categoriesChanged && recommendedProducts.length === 0) {
        console.log('🔄 Cart categories changed or no recommendations, reloading...');
        // Trigger a reload by updating a state that will cause the main effect to re-run
        setLoading(true);
        // Re-trigger the main effect indirectly
        setTimeout(() => {
          if (cartInitialized) {
            // Force re-evaluation by clearing and reloading
            setRecommendedProducts([]);
          }
        }, 100);
      }
    }
  }, [cartItems?.length, cartInitialized]); // Only trigger on cart length changes

  // Don't render section if no user, no cart items, or no recommendations
  if (!user || !cartItems || cartItems.length === 0 || 
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