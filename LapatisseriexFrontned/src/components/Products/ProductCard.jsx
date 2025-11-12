import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';

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
import { getOrderExperienceInfo } from '../../utils/orderExperience';
import OfferBadge from '../common/OfferBadge';
import BlobButton from '../common/BlobButton';
import { addFreeProductToCart } from '../../services/freeProductService';

const ProductCard = React.memo(({ product, className = '', compact = false, featured = false, hideCartButton = false, isSelectingFreeProduct = false, imagePriority = false }) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [videoHasEnded, setVideoHasEnded] = useState(false);
  const [refreshedProduct, setRefreshedProduct] = useState(product);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [jellyAnimationKey, setJellyAnimationKey] = useState(0);
  const [animationDirection, setAnimationDirection] = useState('none'); // 'up', 'down', 'none'

  const { isOpen: isShopOpen, getClosureMessage, checkShopStatusNow } = useShopStatus();
  const { addToCart, getItemQuantity, updateQuantity, cartItems, refreshCart } = useCart();

  const { user, toggleAuthPanel, changeAuthType } = useAuth();
  const isGuest = !user;
  const { trackProductView } = useRecentlyViewed();
  const { buttonRef: addToCartButtonRef } = useSparkToCart();
  const navigate = useNavigate();

  const orderExperience = useMemo(() => getOrderExperienceInfo(user), [user]);

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
  
  // Improved image URL validation and filtering
  const imageUrls = useMemo(() => {
    if (!Array.isArray(currentProduct?.images)) return [];
    // Filter out any null, undefined, or empty string values
    return currentProduct.images.filter(url => !!url);
  }, [currentProduct?.images]);
  
  const videoUrls = useMemo(() => {
    if (!Array.isArray(currentProduct?.videos)) return [];
    // Filter out any null, undefined, or empty string values
    return currentProduct.videos.filter(url => !!url);
  }, [currentProduct?.videos]);
  
  const mediaItems = useMemo(() => {
    const items = [];
    // Always include images
    imageUrls.forEach((url) => {
      if (url) items.push({ type: 'image', src: url });
    });
    // Only include videos for logged-in users to avoid heavy loads for guests
    if (!isGuest) {
      videoUrls.forEach((url) => {
        if (url) items.push({ type: 'video', src: url });
      });
    }
    return items;
  }, [imageUrls, videoUrls, isGuest]);

  const mediaCount = mediaItems.length;
  const hasVideos = videoUrls.length > 0;
  const activeMedia = mediaCount > 0 ? mediaItems[Math.min(currentMediaIndex, mediaCount - 1)] : null;
  
  // More robust fallback chain for images
  const fallbackImage = imageUrls[0] || null;
  const fallbackVideo = videoUrls[0] || null;
  
  // Get category image as an additional fallback if available
  const categoryFallback = currentProduct?.category?.featuredImage || null;
  
  // For guests, never prefer video as the primary media to avoid auto-loading videos
  const primaryMediaType = isGuest
    ? 'image'
    : (activeMedia?.type || (fallbackImage ? 'image' : (fallbackVideo ? 'video' : 'image')));
  const primaryMediaSrc = isGuest
    ? (activeMedia?.src || fallbackImage || categoryFallback || null)
    : (activeMedia?.src || fallbackImage || fallbackVideo || categoryFallback || null);
  const displayMediaSrc = primaryMediaSrc || '/images/cake1.png';
  const displayMediaType = primaryMediaSrc ? primaryMediaType : 'image';
  const isActiveVideo = displayMediaType === 'video';
  const videoPoster = isActiveVideo ? (fallbackImage || null) : null;

  // Get current quantity from cart (will re-run when cartItems changes)
  const currentQuantity = useMemo(() => {
    return getItemQuantity(currentProduct._id);
  }, [currentProduct._id, getItemQuantity, cartItems]);

  const quantityRef = useRef(currentQuantity);

  useEffect(() => {
    quantityRef.current = currentQuantity;
  }, [currentQuantity]);
  
  useEffect(() => {
    setCurrentMediaIndex((prevIndex) => {
      if (mediaCount === 0) return 0;
      return prevIndex >= mediaCount ? 0 : prevIndex;
    });
  }, [mediaCount]);

  useEffect(() => {
    setVideoHasEnded(false);
  }, [isActiveVideo, displayMediaSrc]);

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

  const handleVideoPlay = useCallback(() => {
    setVideoHasEnded(false);
  }, []);

  const handleVideoEnded = useCallback(() => {
    setVideoHasEnded(true);
  }, []);

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
    if (mediaCount <= 1) {
      return undefined;
    }

    if (isHoveringImage) {
      return undefined;
    }

    if (isActiveVideo) {
      if (videoHasEnded) {
        const timeout = setTimeout(() => {
          setCurrentMediaIndex((prevIndex) => (prevIndex + 1) % mediaCount);
        }, 1500);
        return () => clearTimeout(timeout);
      }
      return undefined;
    }

    const interval = setInterval(() => {
      setCurrentMediaIndex((prevIndex) => (prevIndex + 1) % mediaCount);
    }, 8000); // Change image every 8 seconds for very slow, gentle experience

    return () => clearInterval(interval);
  }, [mediaCount, isHoveringImage, isActiveVideo, videoHasEnded]);

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
    // If user is not logged in, open auth modal/sidebar and return
    if (!user) {
      if (typeof toggleAuthPanel === 'function') toggleAuthPanel();
      if (typeof changeAuthType === 'function') changeAuthType('login');
      return;
    }
    if (!isProductAvailable) return;
    
    try {
      // If selecting free product, use the free product API
      if (isSelectingFreeProduct) {
        const variantIndex = currentProduct.variants?.findIndex(v => v === variant) || 0;
        
        try {
          const result = await addFreeProductToCart(currentProduct._id, variantIndex);
          
          if (result.success) {
            console.log('🎁 Free product API success, refreshing cart...');
            
            // Wait for cart to refresh from backend
            await refreshCart();
            console.log('✅ Cart refreshed');
            
            // Give Redux a moment to update
            await new Promise(resolve => setTimeout(resolve, 500));
            
            toast.success('🎁 Free product added to cart!', {
              position: 'top-center',
              autoClose: 2000});
            
            // Dispatch event for other components
            if (typeof window !== 'undefined' && window.dispatchEvent) {
              window.dispatchEvent(new CustomEvent('cartUpdated'));
            }
            
            // Navigate to cart immediately
            navigate('/cart');
          }
        } catch (error) {
          console.error('Error adding free product:', error);
          // Error handling is done in the outer catch block
          throw error;
        }
        return;
      }
      
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
      setTimeout(() => productLiveCache.get(currentProduct._id, undefined, { force: true }), 800);
    } catch (error) {
      console.error('Error adding to cart:', error);
      console.error('Error response:', error.response?.data);
      const message = error.response?.data?.message || 
                      (typeof error?.error === 'string' ? error.error : error?.message) || 
                      'Failed to add to cart';
      toast.error(message);
    }
  };

  const handleReserve = async (e) => {
    e.stopPropagation();
    // If user is not logged in, open auth modal/sidebar and return
    if (!user) {
      if (typeof toggleAuthPanel === 'function') toggleAuthPanel();
      if (typeof changeAuthType === 'function') changeAuthType('login');
      return;
    }
    if (!isProductAvailable) {
      return;
    }
    console.log('🎯 Reserve button clicked on Home page');
    const currentQuantity = getItemQuantity(currentProduct._id);
    const goCart = () => { try { navigate('/cart'); } catch { window.location.href = '/cart'; } };
    if (currentQuantity > 0) {
      goCart();
    } else {
      try {
        const variantIndex = currentProduct.variants?.findIndex(v => v === variant) || 0;
        console.log('[Reserve] product=', currentProduct._id, 'variantIndex=', variantIndex, 'tracks=', tracks, 'stock=', totalStock);
        
        // Wait for addToCart operation to complete before navigating
        await addToCart(currentProduct, 1, variantIndex);
        console.log('✅ Product added successfully, navigating to cart');
        
        setTimeout(() => productLiveCache.get(currentProduct._id, undefined, { force: true }), 800);
        goCart();
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
        
        // Wait for addToCart operation to complete before navigating
        await addToCart(currentProduct, 1, variantIndex);
        console.log('✅ Product added successfully via BuyNow, navigating to cart');
        
        // Immediately refresh stock data after adding to cart
        setTimeout(() => productLiveCache.get(currentProduct._id, undefined, { force: true }), 800);
      }
      
      navigate('/cart');
    } catch (error) {
      console.error('Error in buy now:', error);
      const message = typeof error?.error === 'string' ? error.error : error?.message || 'Failed to add to cart';
      toast.error(message);
    }
  };

  const handleQuantityDelta = useCallback((delta) => {
    if (delta === 0) {
      return;
    }

    const latestQuantity = quantityRef.current;
    const nextQuantity = Math.max(0, latestQuantity + delta);

    if (nextQuantity === latestQuantity) {
      return;
    }

    quantityRef.current = nextQuantity;

    // Set animation direction based on delta and trigger jelly animation
    setAnimationDirection(delta > 0 ? 'up' : 'down');
    setJellyAnimationKey(prev => prev + 1);

    updateQuantity(currentProduct._id, nextQuantity)
      .then(() => {
  setTimeout(() => productLiveCache.get(currentProduct._id, undefined, { force: true }), 800);
      })
      .catch((error) => {
        console.error('Error updating quantity:', error);
      });
  }, [currentProduct._id, updateQuantity]);



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

            <div className="absolute inset-0 w-full h-full overflow-hidden">
              <AnimatePresence initial={false} mode="sync">
                <motion.div
                  key={`${displayMediaType}-${displayMediaSrc}`}
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                  className="absolute inset-0 will-change-transform"
                >
                  <MediaDisplay
                    src={displayMediaSrc}
                    type={displayMediaType}
                    alt={currentProduct.name}
                    className="w-full h-full"
                    aspectRatio="auto"
                    objectFit="cover"
                    lazy={!imagePriority}
                    videoProps={{
                      controls: false,
                      muted: true,
                      playsInline: true, // Ensure inline playback on mobile devices
                      preload: isGuest ? 'none' : 'metadata',
                      autoPlay: isGuest ? false : true,
                      onPlay: handleVideoPlay,
                      onLoadedData: handleVideoPlay,
                      onEnded: handleVideoEnded,
                      poster: videoPoster || undefined
                    }}
                  />
                </motion.div>
              </AnimatePresence>
            </div>



       

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
              <div 
                ref={addToCartButtonRef}
                className="absolute bottom-2 right-2"
              >
                <BlobButton
                  onClick={handleAddToCart}
                  disabled={!isActive || isOutOfStockTracked || !isProductAvailable}
                  className="px-4 py-2 text-xs font-light"
                  style={{
                    ...(isSelectingFreeProduct ? { backgroundColor: '#10b981', borderColor: '#10b981' } : {})
                  }}
                >
                  {isSelectingFreeProduct 
                    ? 'Select FREE' 
                    : (!isProductAvailable ? 'Closed' : isOutOfStockTracked ? 'Unavailable' : 'Add')
                  }
                </BlobButton>
              </div>
            ) : (
              <div className={`absolute bottom-2 right-2 flex items-center rounded-lg shadow-sm ${
                !isProductAvailable 
                  ? 'bg-gray-100 border border-gray-300' 
                  : 'bg-white border border-[#733857]'
              }`}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuantityDelta(-1);
                  }}
                  disabled={!isProductAvailable || isOutOfStockTracked}
                  className={`w-7 h-7 flex items-center justify-center bg-transparent transition-all duration-150 rounded-l-lg font-light ${
                    !isProductAvailable || isOutOfStockTracked
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-[#733857] hover:bg-[#733857]/10'
                  }`}
                >
                  −
                </button>
                <motion.span 
                  key={`jelly-${jellyAnimationKey}`}
                  initial={{ 
                    scaleX: 1, 
                    scaleY: 1,
                    y: animationDirection === 'up' ? -10 : animationDirection === 'down' ? 10 : 0,
                    opacity: animationDirection !== 'none' ? 0.7 : 1
                  }}
                  animate={{
                    scaleX: [1, 1.15, 0.95, 1.03, 1],
                    scaleY: [1, 0.85, 1.05, 0.98, 1],
                    y: [
                      animationDirection === 'up' ? -10 : animationDirection === 'down' ? 10 : 0,
                      animationDirection === 'up' ? -5 : animationDirection === 'down' ? 5 : 0,
                      0,
                      0,
                      0
                    ],
                    opacity: [
                      animationDirection !== 'none' ? 0.7 : 1,
                      1,
                      1,
                      1,
                      1
                    ]
                  }}
                  transition={{
                    duration: 0.6,
                    times: [0, 0.2, 0.5, 0.8, 1],
                    ease: "easeInOut"
                  }}
                  className={`px-3 py-1 font-light text-xs min-w-[1.5rem] text-center border-l border-r inline-block ${
                  !isProductAvailable || isOutOfStockTracked
                    ? 'text-gray-400 border-gray-300'
                    : 'text-[#733857] border-[#733857]'
                }`}
                >
                  {currentQuantity}
                </motion.span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuantityDelta(1);
                  }}
                  disabled={isOutOfStockTracked || (tracks && currentQuantity >= totalStock) || !isProductAvailable}
                  className={`w-7 h-7 flex items-center justify-center bg-transparent transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg font-light ${
                    !isProductAvailable || isOutOfStockTracked
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-[#733857] hover:bg-[#733857]/10'
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
            className={`font-light bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent line-clamp-1 leading-tight ${
              featured 
                ? 'text-sm sm:text-base' 
                : compact 
                ? 'text-sm' 
                : 'text-xs sm:text-sm md:text-base'
            } cursor-pointer mb-1 hover:from-[#8d4466] hover:via-[#412434] hover:to-[#733857] transition-all duration-300`}
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
                <span className="text-xs font-light bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">{productRating.rating}</span>
                <span className="text-xs bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">|</span>
                <span className="text-xs bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">{ratingCountDisplay}</span>
              </div>
            </div>

            {/* Customer experience badge */}
            <div className="text-xs flex-shrink-0">
              <span
                className="font-bold"
                style={{ color: orderExperience.color }}
              >
                {orderExperience.label}
              </span>
            </div>
          </div>

          {/* One-line product description */}
          <p className="text-xs bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent mb-2 line-clamp-1 font-medium">
            {currentProduct.description || 'Delicious handcrafted treat made with premium ingredients.'}
          </p>

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-baseline gap-1">
              {discountPercentage > 0 && (
                <span className="text-gray-500 line-through text-xs font-medium">
                  {formatCurrency(originalPrice)}
                </span>
              )}
              <span
                className={`font-light bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent ${
                  featured || compact ? 'text-sm' : 'text-sm sm:text-base'
                }`}
              >
                {formatCurrency(sellingPrice)}
              </span>
            </div>
            {discountPercentage > 0 && (
              <OfferBadge label={`${discountPercentage}% OFF`} />
            )}
          </div>
        </div>

        {/* Reserve Button - Creative Animated Design with Mobile Support */}
        {!isSelectingFreeProduct && (
          <button
            onClick={handleReserve}
            disabled={!isActive || totalStock === 0 || !isProductAvailable}
            className={`group relative w-full sm:w-11/12 lg:w-3/4 mx-auto mt-3 sm:mt-4 py-2 px-3 text-xs font-light transition-all duration-200 rounded-lg overflow-hidden ${
              !isActive || totalStock === 0 || !isProductAvailable
                ? 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed'
                : 'bg-white text-gray-900 border-2 border-[#733857] hover:text-white active:text-white touch-manipulation'
            }`}
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
                'No Stock'
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
        )}
      </div>


    </div>
  );
});

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
          value: PropTypes.number})})
    ).isRequired,
    images: PropTypes.arrayOf(PropTypes.string),
    isActive: PropTypes.bool,
    stock: PropTypes.number,
    hasEgg: PropTypes.bool}).isRequired,
  className: PropTypes.string,
  compact: PropTypes.bool,
  featured: PropTypes.bool,
  hideCartButton: PropTypes.bool};

export default ProductCard;