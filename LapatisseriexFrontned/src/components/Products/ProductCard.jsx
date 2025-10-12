import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

import MediaDisplay from '../common/MediaDisplay';
import { useCart } from '../../hooks/useCart';
import FavoriteButton from '../Favorites/FavoriteButton';
import { useAuth } from '../../hooks/useAuth';
import { useRecentlyViewed } from '../../context/RecentlyViewedContext/RecentlyViewedContext';
import { useShopStatus } from '../../context/ShopStatusContext';
import { useSparkToCart } from '../../hooks/useSparkToCart';
import { toast } from 'react-toastify';
import { calculatePricing, formatCurrency } from '../../utils/pricingUtils';
import productLiveCache from '../../utils/productLiveCache';

const ProductCard = ({ product, className = '', compact = false, featured = false, hideCartButton = false }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [lastQuantityChangeTime, setLastQuantityChangeTime] = useState(0);
  const [refreshedProduct, setRefreshedProduct] = useState(product);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { isOpen: isShopOpen, getClosureMessage, checkShopStatusNow } = useShopStatus();
  const { addToCart, getItemQuantity, updateQuantity, cartItems } = useCart();

  const { user } = useAuth();
  const { trackProductView } = useRecentlyViewed();
  const { buttonRef: addToCartButtonRef } = useSparkToCart();
  const navigate = useNavigate();

  // Subscribe to shared live cache for this product (dedupes network requests)
  useEffect(() => {
    if (!product?._id) return;
    setIsRefreshing(true);
    const unsub = productLiveCache.subscribe(product._id, undefined, (fresh) => {
      setRefreshedProduct(fresh || product);
      setLastRefresh(Date.now());
      setIsRefreshing(false);
    });

    // Also try to get immediately (resolves from cache if fresh)
    productLiveCache.get(product._id, undefined).catch(() => setIsRefreshing(false));

    return () => unsub();
  }, [product?._id]);

  // Use refreshed product data
  const currentProduct = refreshedProduct || product;

  // Get current quantity from cart (will re-run when cartItems changes)
  const currentQuantity = useMemo(() => {
    return getItemQuantity(currentProduct._id);
  }, [currentProduct._id, getItemQuantity, cartItems]);
  
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

  const productRating = getProductRating(currentProduct._id);

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
  const ratingCountDisplay = getRatingCount(currentProduct._id);

  // Auto-slide functionality for multiple images - very slow and smooth
  useEffect(() => {
    if (currentProduct.images && currentProduct.images.length > 1 && !isHoveringImage) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => 
          (prevIndex + 1) % currentProduct.images.length
        );
      }, 8000); // Change image every 8 seconds for very slow, gentle experience

      return () => clearInterval(interval);
    }
  }, [currentProduct.images, isHoveringImage]);

  // Ensure we have variants and handle missing data
  // Use the first active variant or fallback to first variant
  const variant = useMemo(() => {
    if (!currentProduct.variants || currentProduct.variants.length === 0) {
      return { price: 0, discount: { value: 0 }, stock: 0, isStockActive: false };
    }
    
    // Find first active variant with stock (if tracking) or just first variant
    const activeVariant = currentProduct.variants.find(v => 
      v.isActive !== false && (!v.isStockActive || (v.stock > 0))
    ) || currentProduct.variants[0];
    
    return activeVariant;
  }, [currentProduct.variants]);

  const tracks = !!variant?.isStockActive;
  const isActive = currentProduct.isActive !== false; // Default to true if undefined
  // If stock tracking is disabled, treat stock as unlimited
  const totalStock = tracks ? (variant.stock || 0) : Number.POSITIVE_INFINITY;
  // Use global shop status; if not tracking stock, skip stock-based unavailability
  const isProductAvailable = isActive && isShopOpen && (tracks ? totalStock > 0 : true);
  const isOutOfStockTracked = tracks && totalStock === 0;

  // Use centralized pricing calculation for consistency
  const pricing = calculatePricing(variant);
  
  // Extract values for easier use
  const originalPrice = pricing.mrp; // MRP (to be shown as strikethrough)
  const sellingPrice = pricing.finalPrice; // Actual selling price
  const discountPercentage = pricing.discountPercentage;

  // Debug logging for troubleshooting
  if (!isActive || (tracks && totalStock === 0)) {
    console.log('Product availability issue:', {
      productId: currentProduct._id,
      name: currentProduct.name,
      isActive: currentProduct.isActive,
      totalStock,
      variants: currentProduct.variants
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

      // Find the correct variant index
      const variantIndex = currentProduct.variants?.findIndex(v => v === variant) || 0;
      
      // Debug: log variant tracking behavior
      console.log('[AddToCart from Card] product=', currentProduct._id, 'variantIndex=', variantIndex, 'tracks=', tracks, 'stock=', totalStock);

      // Add to cart with correct variant index
      await addToCart(currentProduct, 1, variantIndex);
      
      // Trigger a targeted refresh soon after add to cart to reflect stock
      const API_BASE = import.meta.env.VITE_API_URL;
  setTimeout(() => productLiveCache.get(currentProduct._id, undefined, { force: true }), 800);
    } catch (error) {
      console.error('Error adding to cart:', error);
      const message = typeof error?.error === 'string' ? error.error : error?.message || 'Failed to add to cart';
      toast.error(message);
    }
  };

  const handleReserve = async (e) => {
    e.stopPropagation();
    
    if (!isProductAvailable) {
      return;
    }
    
    console.log('🎯 Reserve button clicked on Home page');
    
    const currentQuantity = getItemQuantity(currentProduct._id);
    
    if (currentQuantity > 0) {
      // Product already in cart - just redirect
      navigate('/cart');
    } else {
      // Product not in cart - add one and redirect
      try {
        const variantIndex = currentProduct.variants?.findIndex(v => v === variant) || 0;
        console.log('[Reserve] product=', currentProduct._id, 'variantIndex=', variantIndex, 'tracks=', tracks, 'stock=', totalStock);
        await addToCart(currentProduct, 1, variantIndex);
        
  // Immediately refresh stock data after adding to cart
  const API_BASE = import.meta.env.VITE_API_URL;
  setTimeout(() => productLiveCache.get(currentProduct._id, undefined, { force: true }), 800);
        
        navigate('/cart');
      } catch (error) {
        console.error('❌ Error adding product to cart:', error);
        const message = typeof error?.error === 'string' ? error.error : error?.message || 'Failed to add to cart';
        toast.error(message);
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
        const variantIndex = currentProduct.variants?.findIndex(v => v === variant) || 0;
        console.log('[BuyNow] product=', currentProduct._id, 'variantIndex=', variantIndex, 'tracks=', tracks, 'stock=', totalStock);
        await addToCart(currentProduct, 1, variantIndex);
        
  // Immediately refresh stock data after adding to cart
  const API_BASE = import.meta.env.VITE_API_URL;
  setTimeout(() => productLiveCache.get(currentProduct._id, undefined, { force: true }), 800);
      }
      
      navigate('/cart');
    } catch (error) {
      console.error('Error in buy now:', error);
      const message = typeof error?.error === 'string' ? error.error : error?.message || 'Failed to add to cart';
      toast.error(message);
    }
  };

  const handleQuantityChange = useCallback(async (newQuantity) => {
    if (newQuantity < 0) return;
    
    // Prevent only genuine rapid clicking (very fast consecutive clicks)
    const now = Date.now();
    const timeSinceLastClick = now - lastQuantityChangeTime;
    
    if (timeSinceLastClick < 50) {
      return; // Silently ignore super rapid clicks
    }
    
    setLastQuantityChangeTime(now);
    
    // Fire and forget - no loading states for smooth experience
    updateQuantity(currentProduct._id, newQuantity).then(() => {
      // Immediately refresh stock data after quantity change
      const API_BASE = import.meta.env.VITE_API_URL;
  setTimeout(() => productLiveCache.get(currentProduct._id, undefined, { force: true }), 800);
    }).catch(error => {
      console.error('Error updating quantity:', error);
    });
  }, [updateQuantity, currentProduct._id, lastQuantityChangeTime]);



  const handleCardClick = useCallback(() => {
    // Validate product data before navigation
    if (!currentProduct || !currentProduct._id) {
      console.error('Invalid product data for navigation:', currentProduct);
      return;
    }
    
    console.log(`🎯 Navigating to product: ${currentProduct.name} (${currentProduct._id})`);
    
    try {
      // Prepare for immediate navigation - disable any interfering smooth scroll
      document.documentElement.style.scrollBehavior = 'auto';
      document.body.style.scrollBehavior = 'auto';
      
      // Navigate immediately for better UX
      navigate(`/product/${currentProduct._id}`);
      
      // Track the product view in background (don't await)
      if (user && currentProduct._id) {
        trackProductView(currentProduct._id, currentProduct).catch(error => {
          console.error('Error tracking product view:', error);
        });
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback navigation method
      window.location.href = `/product/${currentProduct._id}`;
    }
  }, [currentProduct, navigate, user, trackProductView]);

  return (
    <div
      onClick={handleCardClick}
      className={`relative overflow-hidden bg-white cursor-pointer transition-all duration-150 ${
        featured
          ? 'h-full flex flex-col rounded-lg'
          : compact
          ? 'flex flex-col rounded-lg max-w-sm mx-auto'
          : 'flex flex-row rounded-lg'
      } ${!isShopOpen || isOutOfStockTracked ? 'grayscale opacity-80' : ''} ${className}`}
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
                productId={currentProduct._id} 
                size={featured ? 'lg' : 'md'} 
                className="drop-shadow-md hover:scale-110 transition-transform duration-300"
              />
            </div>
            
            <MediaDisplay
          src={currentProduct.images?.[currentImageIndex] || null}
          alt={currentProduct.name}
          className="w-full h-full transition-all duration-[3000ms] ease-in-out"
          style={{
            transition: 'opacity 3s ease-in-out, transform 3s ease-in-out',
            opacity: 1
          }}
          aspectRatio="auto"
          objectFit="cover"
            />

            {/* Shop Closed / Unavailable Overlay */}
            {(!isShopOpen || isOutOfStockTracked) && (
              <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-10">
                <div className="text-white text-center">
                  <div className="text-sm font-bold mb-1">{!isShopOpen ? 'CURRENTLY CLOSED' : 'CURRENTLY UNAVAILABLE'}</div>
                  {!isShopOpen && getClosureMessage() && (
                    <div className="text-xs opacity-90">{getClosureMessage()}</div>
                  )}
                </div>
              </div>
            )}



          {/* Discount Badge on Image */}
       
          {/* Egg/No Egg Indicator - positioned in bottom left corner of image */}
          <div className="absolute bottom-2 left-2">
            <span
              className={`inline-flex items-center ${
                currentProduct.hasEgg
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
                    stroke={currentProduct.hasEgg ? '#FF0000' : '#22C55E'} 
                    strokeWidth="2"
                    fill="none"
                  />

                  {currentProduct.hasEgg ? (
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
                disabled={!isActive || isOutOfStockTracked || !isProductAvailable}
                className={`absolute bottom-2 right-2 px-4 py-2 text-xs font-light transition-all duration-300 ease-out rounded-lg border ${
                  !isActive || isOutOfStockTracked || !isProductAvailable
                    ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                    : 'bg-white text-[#733857] border-[#733857] hover:bg-[#733857] hover:text-white hover:shadow-md shadow-sm transform hover:scale-105'
                }`}
                style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}
              >
                {!isProductAvailable ? 'Closed' : isOutOfStockTracked ? 'Unavailable' : 'Add'}
              </button>
            ) : (
              <div className={`absolute bottom-2 right-2 flex items-center rounded-lg shadow-sm ${
                !isProductAvailable 
                  ? 'bg-gray-100 border border-gray-300' 
                  : 'bg-white border border-[#733857]'
              }`}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuantityChange(currentQuantity - 1);
                  }}
                  disabled={!isProductAvailable || isOutOfStockTracked}
                  className={`w-7 h-7 flex items-center justify-center bg-transparent transition-all duration-150 rounded-l-lg font-light ${
                    !isProductAvailable || isOutOfStockTracked
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-[#733857] hover:bg-[#733857]/10'
                  }`}
                  style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}
                >
                  −
                </button>
                <span className={`px-3 py-1 font-light text-xs min-w-[1.5rem] text-center border-l border-r ${
                  !isProductAvailable || isOutOfStockTracked
                    ? 'text-gray-400 border-gray-300'
                    : 'text-[#733857] border-[#733857]'
                }`}
                style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}
                >
                  {currentQuantity}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuantityChange(currentQuantity + 1);
                  }}
                  disabled={isOutOfStockTracked || (tracks && currentQuantity >= totalStock) || !isProductAvailable}
                  className={`w-7 h-7 flex items-center justify-center bg-transparent transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg font-light ${
                    !isProductAvailable || isOutOfStockTracked
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-[#733857] hover:bg-[#733857]/10'
                  }`}
                  style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}
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
            className={`font-light text-gray-900 line-clamp-1 leading-tight ${
              featured 
                ? 'text-sm sm:text-base' 
                : compact 
                ? 'text-sm' 
                : 'text-xs sm:text-sm md:text-base'
            } cursor-pointer mb-1 hover:text-[#733857] transition-colors`}
            style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}
            onClick={handleCardClick}
          >
            {currentProduct.name}
          </h3>

          {/* Rating and Welcome Offer */}
          <div className="flex items-center justify-between mb-2 gap-1 flex-wrap">
            {/* Rating chip */}
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 bg-white border border-[#733857]/30 rounded-full px-2 py-0.5 shadow-sm">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-600 text-white text-[9px] leading-none">★</span>
                <span className="text-xs font-light text-gray-900" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>{productRating.rating}</span>
                <span className="text-xs text-gray-600">|</span>
                <span className="text-xs text-gray-600" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>{ratingCountDisplay}</span>
              </div>
            </div>

            {/* Welcome Offer or Special Text */}
            <div className="text-xs flex-shrink-0">
              {user && user.hasPlacedOrder ? (
                <span className="text-violet-900 font-bold" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>Premium Choice</span>
              ) : (
                <span className="text-violet-900 font-bold" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>Welcome Gift</span>
              )}
            </div>
          </div>

          {/* One-line product description */}
          <p className="text-xs text-gray-600 mb-2 line-clamp-1" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>
            {currentProduct.description || 'Delicious handcrafted treat made with premium ingredients.'}
          </p>

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-baseline gap-1">
              {discountPercentage > 0 && (
                <span className="text-gray-500 line-through text-xs" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>
                  {formatCurrency(originalPrice)}
                </span>
              )}
              <span
                className={`font-light text-gray-900 ${
                  featured || compact ? 'text-sm' : 'text-sm sm:text-base'
                }`}
                style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}
              >
                {formatCurrency(sellingPrice)}
              </span>
            </div>
            {discountPercentage > 0 && (
              <span className="text-[#733857] text-xs font-light" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>
                {discountPercentage}% OFF
              </span>
            )}
          </div>
        </div>

        {/* Reserve Button - Creative Animated Design with Mobile Support */}
        <button
          onClick={handleReserve}
          disabled={!isActive || totalStock === 0 || !isProductAvailable}
          className={`group relative w-3/4 mx-auto py-2 px-3 text-xs font-light transition-all duration-200 rounded-lg overflow-hidden ${
            !isActive || totalStock === 0 || !isProductAvailable
              ? 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed'
              : 'bg-white text-gray-900 border-2 border-[#733857] hover:text-white active:text-white touch-manipulation'
          }`}
          style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}
        >
          {/* Animated background fill - works on both hover and active (touch) */}
          {isActive && totalStock > 0 && isProductAvailable && (
            <div className="absolute inset-0 bg-[#733857] transform -translate-x-full group-hover:translate-x-0 group-active:translate-x-0 transition-transform duration-200 ease-out"></div>
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
              <div className="absolute top-1 right-2 w-1 h-1 bg-[#8d4466] rounded-full opacity-0 group-hover:opacity-100 group-active:opacity-100 group-hover:animate-ping group-active:animate-ping transition-opacity duration-300 delay-100"></div>
              <div className="absolute bottom-1 left-3 w-1 h-1 bg-[#733857] rounded-full opacity-0 group-hover:opacity-100 group-active:opacity-100 group-hover:animate-ping group-active:animate-ping transition-opacity duration-300 delay-200"></div>
              <div className="absolute top-2 left-1/2 w-0.5 h-0.5 bg-[#8d4466] rounded-full opacity-0 group-hover:opacity-100 group-active:opacity-100 group-hover:animate-pulse group-active:animate-pulse transition-opacity duration-300 delay-150"></div>
            </>
          )}

          {/* Mobile-specific pulse animation on tap */}
          {isProductAvailable && (
            <div className="absolute inset-0 bg-[#733857] opacity-0 group-active:opacity-10 transition-opacity duration-150 rounded-lg md:hidden"></div>
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