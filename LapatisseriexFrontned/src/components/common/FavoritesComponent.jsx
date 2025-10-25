import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Heart, ShoppingCart, X, Plus, Minus, Loader2 } from 'lucide-react';
import { 
  fetchFavorites
} from '../../redux/favoritesSlice';
import { useFavorites } from '../../context/FavoritesContext/FavoritesContext';
import { addToCart, updateCartQuantity, removeFromCart } from '../../redux/cartSlice';
import { useAuth } from '../../hooks/useAuth';
import BlobButton from './BlobButton';

const FavoritesComponent = ({ showHeader = true, isProfileTab = false }) => {
  const dispatch = useDispatch();
  const { toggleFavorite, isPending } = useFavorites();
  const { user } = useAuth();

  // Redux state
  const {
    favorites,
    favoriteIds,
    count,
    status,
    error
  } = useSelector(state => state.favorites);

  // Cart state
  const {
    items: cartItems,
    isLoading: cartLoading
  } = useSelector(state => state.cart);

  useEffect(() => {
    if (user && status === 'idle') {
      // Only fetch if user has a valid token
      const token = localStorage.getItem('authToken');
      if (token) {
        console.log('FavoritesComponent - Fetching favorites with valid token...');
        dispatch(fetchFavorites());
      } else {
        console.log('FavoritesComponent - User exists but no token, letting context handle...');
      }
    }
  }, [dispatch, user, status]);

  const handleRemoveFromFavorites = async (productId) => {
    if (!productId) return;
    if (isPending(productId)) return;
    await toggleFavorite(productId);
  };

  // Helper functions for cart management
  const getCartQuantity = (productId) => {
    const cartItem = cartItems?.find(item => item.productId === productId);
    return cartItem?.quantity || 0;
  };

  const isInCart = (productId) => {
    return getCartQuantity(productId) > 0;
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      dispatch(removeFromCart(productId));
    } else {
      dispatch(updateCartQuantity({ productId, quantity: newQuantity }));
    }
  };

  const handleAddToCart = (product) => {
    // Handle both nested productDetails structure and direct product structure
    const productData = product.productDetails || product;
    
    // Create a properly formatted product object for the cart
    const productForCart = {
      _id: productData._id || product.productId,
      name: productData.name,
      price: productData.price,
      images: productData.images || [productData.image?.url || productData.image],
      image: productData.image?.url || productData.image || productData.images?.[0],
      variants: productData.variants || [{ 
        name: 'Default', 
        price: productData.price, 
        available: true 
      }]
    };

    console.log('Adding to cart from favorites:', productForCart);

    console.log('Adding to cart from favorites:', productForCart);

    dispatch(addToCart({ 
      product: productForCart, 
      quantity: 1, 
      variantIndex: 0 
    }));
  };

  const isLoading = status === 'loading';

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-12">
        <div className="animate-pulse text-center">
          <Heart className="h-12 w-12 mx-auto text-rose-500 animate-pulse" />
          <h2 className="text-xl font-medium mt-4 text-gray-700">Loading your favorites...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="p-4 bg-red-100 rounded-lg mb-4">
          <p className="text-red-700">Error loading favorites: {error}</p>
        </div>
        <button 
          onClick={() => dispatch(fetchFavorites())}
          className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!favorites || favorites.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center border border-[#733857]/20">
          <Heart className="h-10 w-10 text-[#733857]" />
        </div>
        <h3 className="text-2xl font-light tracking-wide text-[#1a1a1a] mb-2">No favorites yet</h3>
        <p className="text-sm text-gray-500 mb-8">
          Start adding products you love to keep them handy for later.
        </p>
        {!isProfileTab && (
          <Link 
            to="/products" 
            className="inline-flex items-center gap-2 border border-[#733857] px-6 py-3 text-sm font-medium tracking-wide text-[#733857] transition-colors duration-300 hover:bg-[#733857] hover:text-white"
          >
            <ShoppingCart className="h-5 w-5" />
            Browse Products
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={`${isProfileTab ? '' : 'container mx-auto px-4 py-8'}`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Favorites</h1>
          <div className="text-sm text-gray-600">
            {count} {count === 1 ? 'item' : 'items'}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favorites.map((product) => {
          // Handle the data structure - product details are nested in productDetails
          const productData = product.productDetails || product;
          const productId = product.productId || productData._id || productData.productId;
          
          // Extract image from the correct structure
          let productImage = '/placeholder-image.jpg';
          if (productData.image?.url) {
            productImage = productData.image.url;
          } else if (productData.images?.[0]) {
            productImage = productData.images[0];
          } else if (productData.image && typeof productData.image === 'string') {
            productImage = productData.image;
          }
          
          const productName = productData.name || 'Unknown Product';
          const productPrice = productData.price || 0;
          
          return (
            <div key={productId} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Product Image */}
              <div className="relative aspect-square">
                <img
                  src={productImage}
                  alt={productName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/placeholder-image.jpg';
                  }}
                />
                
                {/* Cart Status Badge */}
                {isInCart(productId) && (
                  <div className="absolute top-2 left-2 bg-rose-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                    In Cart ({getCartQuantity(productId)})
                  </div>
                )}
                
                {/* Remove from Favorites Button */}
                {(() => {
                  const pending = isPending(productId);
                  return (
                    <button
                      onClick={() => handleRemoveFromFavorites(productId)}
                      disabled={pending}
                      className={`absolute top-2 right-2 p-2 bg-white rounded-full shadow-md transition-colors ${pending ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                      title={pending ? 'Removing…' : 'Remove from favorites'}
                      aria-label={pending ? 'Removing…' : 'Remove from favorites'}
                    >
                      {pending ? (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                      ) : (
                        <X className="h-4 w-4 text-gray-600" />
                      )}
                    </button>
                  );
                })()}
              </div>

              {/* Product Details */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{productName}</h3>
                
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-rose-600">₹{productPrice}</span>
                  {productData.originalPrice && productData.originalPrice > productPrice && (
                    <span className="text-sm text-gray-500 line-through">₹{productData.originalPrice}</span>
                  )}
                </div>

                {/* Description */}
                {productData.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{productData.description}</p>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {isInCart(productId) ? (
                    /* Quantity Controls when item is in cart */
                    <div className="flex-1 flex items-center justify-between bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] text-white rounded-lg p-2">
                      <button
                        onClick={() => handleUpdateQuantity(productId, getCartQuantity(productId) - 1)}
                        disabled={cartLoading}
                        className="p-1 hover:bg-white/20 rounded disabled:opacity-50 transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      
                      <span className="font-semibold px-3">
                        {getCartQuantity(productId)}
                      </span>
                      
                      <button
                        onClick={() => handleUpdateQuantity(productId, getCartQuantity(productId) + 1)}
                        disabled={cartLoading}
                        className="p-1 hover:bg-white/20 rounded disabled:opacity-50 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    /* Add to Cart button when item is not in cart */
                    <BlobButton
                      onClick={() => handleAddToCart(productData)}
                      disabled={cartLoading}
                      className="flex-1 py-2 px-4 flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{
                        fontSize: '14px'
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add to Cart</span>
                    </BlobButton>
                  )}
                  
                  <Link
                    to={`/product/${productId}`}
                    className="gradient-btn flex-1 bg-white border-2 border-[#733857] py-2 px-4 rounded-lg hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] transition-colors text-center transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span className="transition-all duration-300">View Details</span>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Actions */}
      {favorites.length > 0 && (
        <div className="mt-8 text-center">
          <div className="flex justify-center gap-4">
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to remove all favorites?')) {
                  favorites.forEach(product => {
                    const productId = product.productId || product.productDetails?._id || product._id;
                    dispatch(removeFromFavorites(productId));
                  });
                }
              }}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Clear All Favorites
            </button>
            
            <BlobButton
              onClick={() => {
                favorites.forEach(product => {
                  const productData = product.productDetails || product;
                  const productId = product.productId || productData._id;
                  
                  if (isInCart(productId)) {
                    // If already in cart, increase quantity by 1
                    handleUpdateQuantity(productId, getCartQuantity(productId) + 1);
                  } else {
                    // If not in cart, add to cart
                    handleAddToCart(productData);
                  }
                });
              }}
              className="px-6 py-2"
              style={{
                fontSize: '14px'
              }}
            >
              Add All to Cart
            </BlobButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default FavoritesComponent;