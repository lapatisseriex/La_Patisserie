import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

import MediaDisplay from '../common/MediaDisplay';
import { useCart } from '../../hooks/useCart';
import FavoriteButton from '../Favorites/FavoriteButton';

import { useAuth } from '../../context/AuthContext/AuthContext';
import { useRecentlyViewed } from '../../context/RecentlyViewedContext/RecentlyViewedContext';
import { useShopStatus } from '../../context/ShopStatusContext';
import { useSparkToCart } from '../../hooks/useSparkToCart';

const ProductCard = ({ product, className = '', compact = false, featured = false, hideCartButton = false }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHoveringImage, setIsHoveringImage] = useState(false);

  const { isOpen: isShopOpen, getClosureMessage, checkShopStatusNow } = useShopStatus();
  const { addToCart, getItemQuantity, updateQuantity, cartItems } = useCart();

  const { user } = useAuth();
  const { trackProductView } = useRecentlyViewed();
  const { buttonRef: addToCartButtonRef } = useSparkToCart();
  const navigate = useNavigate();

  // Get current quantity from cart (will re-run when cartItems changes)
  const currentQuantity = useMemo(() => {
    return getItemQuantity(product._id);
  }, [product._id, getItemQuantity, cartItems]);
  
  // Memoize button state to prevent unnecessary re-renders
  const buttonState = useMemo(() => ({
    shouldShowAdd: currentQuantity === 0,
    shouldShowQuantity: currentQuantity > 0
  }), [currentQuantity]);

  // Generate consistent random rating for each product based on product ID
  const getProductRating = (productId) => {
    if (!productId) return { rating: 4.5, percentage: 85 };
    
    // Simple hash function to generate consistent "random" numbers from product ID
    let hash = 0;
    for (let i = 0; i < productId.length; i++) {
      const char = productId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Use hash to generate rating between 4.0-5.0 and percentage between 80-100
    const rating = (4.0 + (Math.abs(hash) % 100) / 100).toFixed(1);
    const percentage = 80 + (Math.abs(hash * 7) % 21); // 80-100%
    
    return { 
      rating: parseFloat(rating), 
      percentage: Math.floor(percentage) 
    };
  };

  const productRating = getProductRating(product._id);

  // Deterministic rating count like "3.9K" for display purposes (consistent per product)
  const getRatingCount = (productId) => {
    if (!productId) return '3.9K';
    let hash = 0;
    for (let i = 0; i < productId.length; i++) {
      hash = ((hash << 5) - hash) + productId.charCodeAt(i);
      hash |= 0; // 32-bit
    }
    const base = Math.abs(hash % 9000) + 1000; // 1,000 - 9,999
    const k = (base / 1000).toFixed(1);
    return `${k.replace(/\.0$/, '')}K`;
  };
  const ratingCountDisplay = getRatingCount(product._id);

  // Auto-slide functionality for multiple images - very slow and smooth
  useEffect(() => {
    if (product.images && product.images.length > 1 && !isHoveringImage) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => 
          (prevIndex + 1) % product.images.length
        );
      }, 4500); // Change image every 4.5 seconds for very slow, smooth experience

      return () => clearInterval(interval);
    }
  }, [product.images, isHoveringImage]);

  // Ensure we have variants and handle missing data
  const variant = product.variants?.[0] || { price: 0, discount: { value: 0 }, stock: 0 };
  const isActive = product.isActive !== false; // Default to true if undefined
  const totalStock = product.stock || variant.stock || 0;
  // Use global shop status instead of individual product availability
  const isProductAvailable = isActive && totalStock > 0 && isShopOpen;

  const discountedPrice = variant.price && variant.discount?.value
    ? variant.price - variant.discount.value
    : variant.price || 0;

  const discountPercentage = variant.price && variant.discount?.value
    ? Math.round((variant.discount.value / variant.price) * 100)
    : 0;

  // Debug logging for troubleshooting
  if (!isActive || totalStock === 0) {
    console.log('Product availability issue:', {
      productId: product._id,
      name: product.name,
      isActive: product.isActive,
      totalStock,
      variants: product.variants
    });
  }

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!isProductAvailable) return;
    
    try {
      // Check shop status in real-time before adding to cart
      const currentStatus = await checkShopStatusNow();
      
      if (!currentStatus.isOpen) {
        // Shop is now closed, UI will update automatically
        return;
      }
      
      // Add to cart with immediate UI update (optimistic)
      addToCart(product, 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleReserve = async (e) => {
    e.stopPropagation();
    
    if (!isProductAvailable) {
      return;
    }
    
    console.log('🎯 Reserve button clicked on Home page');
    
    const currentQuantity = getItemQuantity(product._id);
    
    if (currentQuantity > 0) {
      // Product already in cart - just redirect
      navigate('/cart');
    } else {
      // Product not in cart - add one and redirect
      try {
        await addToCart(product, 1);
        navigate('/cart');
      } catch (error) {
        console.error('❌ Error adding product to cart:', error);
        alert('Failed to add product to cart. Please try again.');
      }
    }
  };



  const handleBuyNow = async (e) => {
    e.stopPropagation();
    
    if (!isProductAvailable) {
      return;
    }
    
    try {
      // Check shop status in real-time before buy now
      const currentStatus = await checkShopStatusNow();
      
      if (!currentStatus.isOpen) {
        // Shop is now closed, UI will update automatically
        return;
      }
      
      if (currentQuantity === 0) {
        addToCart(product, 1);
      }
      
      navigate('/cart');
    } catch (error) {
      console.error('Error in buy now:', error);
    }
  };

  const handleQuantityChange = useCallback((newQuantity) => {
    if (newQuantity < 0) return;
    updateQuantity(product._id, newQuantity);
  }, [updateQuantity, product._id]);



  const handleCardClick = useCallback(() => {
    // Validate product data before navigation
    if (!product || !product._id) {
      console.error('Invalid product data for navigation:', product);
      return;
    }
    
    console.log(`🎯 Navigating to product: ${product.name} (${product._id})`);
    
    try {
      // Prepare for immediate navigation - disable any interfering smooth scroll
      document.documentElement.style.scrollBehavior = 'auto';
      document.body.style.scrollBehavior = 'auto';
      
      // Navigate immediately for better UX
      navigate(`/product/${product._id}`);
      
      // Track the product view in background (don't await)
      if (user && product._id) {
        trackProductView(product._id, product).catch(error => {
          console.error('Error tracking product view:', error);
        });
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback navigation method
      window.location.href = `/product/${product._id}`;
    }
  }, [product, navigate, user, trackProductView]);

  return (
    <div
      onClick={handleCardClick}
      className={`relative overflow-hidden bg-white cursor-pointer transition-all duration-150 ${
        featured
          ? 'h-full flex flex-col rounded-lg'
          : compact
          ? 'flex flex-col rounded-lg max-w-sm mx-auto'
          : 'flex flex-row rounded-lg'
      } ${!isShopOpen ? 'grayscale opacity-80' : ''} ${className}`}
    >
      {/* Product Image */}
        <div
          className={`${
            featured || compact 
              ? 'w-full' 
              : 'w-32 sm:w-36 md:w-40 lg:w-44 flex-shrink-0'
          } relative`}
        >
          <div
            className={`w-full relative group overflow-hidden rounded-lg ${
          featured || compact 
            ? 'aspect-square' 
            : 'aspect-square'
            }`}
          >
            {/* Favorite Button */}
            <div className="absolute top-2 right-2 z-20">
              <FavoriteButton 
                productId={product._id} 
                size={featured ? 'lg' : 'md'} 
                className="drop-shadow-md hover:scale-110 transition-transform duration-300"
              />
            </div>
            
            <MediaDisplay
          src={product.images?.[currentImageIndex] || null}
          alt={product.name}
          className="w-full h-full transition-all duration-1000 ease-in-out"
          style={{
            transition: 'opacity 1.2s ease-in-out, transform 1.2s ease-in-out',
            opacity: 1
          }}
          aspectRatio="auto"
          objectFit="cover"
            />

            {/* Shop Closed Overlay */}
            {!isShopOpen && (
              <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-10">
                <div className="text-white text-center">
                  <div className="text-sm font-bold mb-1">CURRENTLY CLOSED</div>
                  {getClosureMessage() && (
                    <div className="text-xs opacity-90">
                      {getClosureMessage()}
                    </div>
                  )}
                </div>
              </div>
            )}



          {/* Discount Badge on Image */}
       
          {/* Egg/No Egg Indicator - positioned in bottom left corner of image */}
          <div className="absolute bottom-2 left-2">
            <span
              className={`inline-flex items-center ${
                product.hasEgg
                  ? 'text-red-600'
                  : 'text-green-600'
              }`}
            >
              <div className="flex items-center gap-1">
                {/* Square outline + shape */}
                <svg
                  className="w-4 h-4 bg-white rounded"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Square outline */}
                  <rect
                    x="1"
                    y="1"
                    width="18"
                    height="18"
                    stroke={product.hasEgg ? '#FF0000' : '#22C55E'} 
                    strokeWidth="2"
                    fill="none"
                  />

                  {product.hasEgg ? (
                    // Triangle for WITH EGG
                    <polygon points="10,4 16,16 4,16" fill="#FF0000" />
                  ) : (
                    // Circle for EGGLESS
                    <circle cx="10" cy="10" r="5" fill="#22C55E" />
                  )}
                </svg>
              </div>
            </span>
          </div>

          {/* Add to Cart Button or Quantity Controls - positioned in bottom right corner of image */}
          {!hideCartButton && (
            currentQuantity === 0 ? (
              <button
                ref={addToCartButtonRef}
                onClick={handleAddToCart}
                disabled={!isActive || totalStock === 0 || !isProductAvailable}
                className={`absolute bottom-2 right-2 px-4 py-2 text-xs font-semibold transition-all duration-300 ease-out rounded-lg border ${
                  !isActive || totalStock === 0 || !isProductAvailable
                    ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                    : 'bg-white text-red-500 border-red-500 hover:bg-red-50 hover:shadow-md shadow-sm transform hover:scale-105'
                }`}
              >
                {!isProductAvailable ? 'Closed' : 'Add'}
              </button>
            ) : (
              <div className={`absolute bottom-2 right-2 flex items-center rounded-lg shadow-sm ${
                !isProductAvailable 
                  ? 'bg-gray-100 border border-gray-300' 
                  : 'bg-white border border-red-500'
              }`}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuantityChange(currentQuantity - 1);
                  }}
                  disabled={!isProductAvailable}
                  className={`w-7 h-7 flex items-center justify-center bg-transparent transition-all duration-150 rounded-l-lg font-medium ${
                    !isProductAvailable
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-red-500 hover:bg-red-50'
                  }`}
                >
                  −
                </button>
                <span className={`px-3 py-1 font-semibold text-xs min-w-[1.5rem] text-center border-l border-r ${
                  !isProductAvailable
                    ? 'text-gray-400 border-gray-300'
                    : 'text-red-500 border-red-500'
                }`}>
                  {currentQuantity}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuantityChange(currentQuantity + 1);
                  }}
                  disabled={currentQuantity >= totalStock || !isProductAvailable}
                  className={`w-7 h-7 flex items-center justify-center bg-transparent transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg font-medium ${
                    !isProductAvailable
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-red-500 hover:bg-red-50'
                  }`}
                >
                  +
                </button>
              </div>
            )
          )}
        </div>
      </div>

  {/* Content Section */}
  <div className={`flex-1 ${
    featured || compact 
      ? 'p-3 sm:p-4' 
      : 'p-2 sm:p-3 md:p-4'
  } flex flex-col justify-between`}>
        <div className="space-y-1 sm:space-y-2">
          <h3
            className={`font-semibold text-black line-clamp-1 leading-tight ${
              featured 
                ? 'text-sm sm:text-base' 
                : compact 
                ? 'text-sm' 
                : 'text-xs sm:text-sm md:text-base'
            } cursor-pointer mb-1 hover:text-gray-700 transition-colors`}
            onClick={handleCardClick}
          >
            {product.name}
          </h3>

          {/* Product Quantity and Unit */}
          {variant.quantity && variant.measuringUnit && (
            <div className="mb-1">
              <span className="text-xs text-gray-600 font-medium bg-gray-50 px-2 py-0.5 rounded-full">
                {variant.quantity}{variant.measuringUnit}
              </span>
            </div>
          )}

          {/* Rating and Welcome Offer */}
          <div className="flex items-center justify-between mb-2 gap-1 flex-wrap">
            {/* Rating chip */}
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 bg-white border border-gray-300 rounded-full px-2 py-0.5 shadow-sm">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-600 text-white text-[9px] leading-none">★</span>
                <span className="text-xs font-medium text-gray-900">{productRating.rating}</span>
                <span className="text-xs text-gray-600">|</span>
                <span className="text-xs text-gray-600">{ratingCountDisplay}</span>
              </div>
            </div>

            {/* Welcome Offer or Special Text */}
            <div className="text-xs flex-shrink-0">
              {user && user.hasPlacedOrder ? (
                <span className="text-violet-600 font-bold">Premium Choice</span>
              ) : (
                <span className="text-violet-600 font-bold">Welcome Gift</span>
              )}
            </div>
          </div>

          {/* One-line product description */}
          <p className="text-xs text-gray-600 mb-2 line-clamp-1">
            {product.description || 'Delicious handcrafted treat made with premium ingredients.'}
          </p>

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-baseline gap-1">
              {discountedPrice !== variant.price && (
                <span className="text-gray-500 line-through text-xs">
                  ₹{Math.round(variant.price)}
                </span>
              )}
              <span
                className={`font-bold text-black ${
                  featured || compact ? 'text-sm' : 'text-sm sm:text-base'
                }`}
              >
                ₹{Math.round(discountedPrice)}
              </span>
            </div>
            {discountPercentage > 0 && (
              <span className="text-green-500 text-xs font-medium px-1.5 py-0.5  rounded-full">
                {discountPercentage}% OFF
              </span>
            )}
          </div>

          {totalStock > 0 && totalStock < 15 && (
            <span className="text-red-600 font-medium text-sm">
              Only {totalStock} left
            </span>
          )}

          {totalStock === 0 && (
            <span className="text-gray-500 font-medium text-sm">
              Out of Stock
            </span>
          )}
        </div>

        {/* Reserve Button - Creative Animated Design with Mobile Support */}
        <button
          onClick={handleReserve}
          disabled={!isActive || totalStock === 0 || !isProductAvailable}
          className={`group relative w-3/4 mx-auto py-2 px-3 text-xs font-semibold transition-all duration-200 rounded-lg overflow-hidden ${
            !isActive || totalStock === 0 || !isProductAvailable
              ? 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed'
              : 'bg-white text-black border-2 border-black hover:text-white active:text-white touch-manipulation'
          }`}
        >
          {/* Animated background fill - works on both hover and active (touch) */}
          {isActive && totalStock > 0 && isProductAvailable && (
            <div className="absolute inset-0 bg-black transform -translate-x-full group-hover:translate-x-0 group-active:translate-x-0 transition-transform duration-200 ease-out"></div>
          )}
          
          {/* Button content with animations for both hover and touch */}
          <span className="relative z-10 flex items-center justify-center gap-1.5">
            {!isActive ? (
              'Unavailable'
            ) : totalStock === 0 ? (
              'Out of Stock'
            ) : !isProductAvailable ? (
              'Closed'
            ) : (
              <>
                <svg 
                  className="w-3 h-3 transition-transform duration-200 group-hover:rotate-6 group-active:rotate-6" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
                <span className="transform transition-all duration-300 group-hover:tracking-wider group-active:tracking-wider">
                  Reserve
                </span>
                <svg 
                  className="w-3 h-3 transition-all duration-300 group-hover:translate-x-1 group-hover:scale-110 group-active:translate-x-1 group-active:scale-110" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </span>

          {/* Sparkle effects - show on both hover and active for mobile */}
          {isActive && totalStock > 0 && isProductAvailable && (
            <>
              <div className="absolute top-1 right-2 w-1 h-1 bg-rose-400 rounded-full opacity-0 group-hover:opacity-100 group-active:opacity-100 group-hover:animate-ping group-active:animate-ping transition-opacity duration-300 delay-100"></div>
              <div className="absolute bottom-1 left-3 w-1 h-1 bg-pink-300 rounded-full opacity-0 group-hover:opacity-100 group-active:opacity-100 group-hover:animate-ping group-active:animate-ping transition-opacity duration-300 delay-200"></div>
              <div className="absolute top-2 left-1/2 w-0.5 h-0.5 bg-rose-500 rounded-full opacity-0 group-hover:opacity-100 group-active:opacity-100 group-hover:animate-pulse group-active:animate-pulse transition-opacity duration-300 delay-150"></div>
            </>
          )}

          {/* Mobile-specific pulse animation on tap */}
          {isProductAvailable && (
            <div className="absolute inset-0 bg-black opacity-0 group-active:opacity-10 transition-opacity duration-150 rounded-lg md:hidden"></div>
          )}
        </button>
      </div>


    </div>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    variants: PropTypes.arrayOf(
      PropTypes.shape({
        price: PropTypes.number.isRequired,
        quantity: PropTypes.number,
        measuringUnit: PropTypes.string,
        discount: PropTypes.shape({
          value: PropTypes.number,
        }),
      })
    ).isRequired,
    images: PropTypes.arrayOf(PropTypes.string),
    isActive: PropTypes.bool,
    stock: PropTypes.number,
    hasEgg: PropTypes.bool,
  }).isRequired,
  className: PropTypes.string,
  compact: PropTypes.bool,
  featured: PropTypes.bool,
  hideCartButton: PropTypes.bool,
};

export default ProductCard;