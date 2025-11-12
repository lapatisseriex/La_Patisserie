import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTrash, FaArrowLeft, FaMapMarkerAlt, FaShoppingCart, FaExclamationTriangle, FaBuilding } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../context/LocationContext/LocationContext';
import { useShopStatus } from '../../context/ShopStatusContext';
import ShopClosureOverlay from '../common/ShopClosureOverlay';
import AnimatedButton from '../common/AnimatedButton';
import { toast } from 'react-toastify';
import { calculatePricing, calculateCartTotals, formatCurrency } from '../../utils/pricingUtils';
import { formatVariantLabel } from '../../utils/variantUtils';
import OfferBadge from '../common/OfferBadge';
import { getOrderExperienceInfo } from '../../utils/orderExperience';
import FreeProductBanner from './FreeProductBanner';
import FreeProductModal from './FreeProductModal';
import { removeFreeProductFromCart } from '../../services/freeProductService';

const deriveEggStatus = (productLike) => {
  if (!productLike) return null;

  if (typeof productLike.hasEgg === 'boolean') {
    return productLike.hasEgg;
  }

  const candidates = [
    productLike?.hasEgg,
    productLike?.importantField?.value,
    productLike?.importantField?.name,
    productLike?.eggType,
    productLike?.eggLabel,
    productLike?.egg,
    productLike?.isEgg,
    productLike?.extraFields?.egg,
    productLike?.extraFields?.Egg,
    productLike?.extraFields?.eggType,
    productLike?.extraFields?.EggType
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (typeof candidate === 'boolean') {
      return candidate;
    }
    if (typeof candidate === 'number') {
      if (candidate === 1) return true;
      if (candidate === 0) return false;
    }
    const normalized = String(candidate).trim().toLowerCase();
    if (!normalized) continue;
    if (['true', 'yes', 'y', '1'].includes(normalized)) {
      return true;
    }
    if (['false', 'no', 'n', '0'].includes(normalized)) {
      return false;
    }
    if (
      normalized.includes('eggless') ||
      normalized.includes('no egg') ||
      normalized.includes('egg free') ||
      normalized.includes('egg-free') ||
      normalized.includes('without egg') ||
      normalized.includes('pure veg') ||
      normalized.includes('veg only')
    ) {
      return false;
    }
    if (
      normalized.includes('with egg') ||
      normalized.includes('contains egg') ||
      normalized.includes('has egg') ||
      normalized.includes('egg-based')
    ) {
      return true;
    }
    if (normalized.includes('egg')) {
      return true;
    }
  }

  return null;
};

const Cart = () => {
  const { isOpen, checkShopStatusNow } = useShopStatus();
  const { cartItems, updateQuantity, removeFromCart, pendingOperations, getCartItem, refreshCart, isLoading } = useCart();
  
  // Use our hooks
  const { user } = useAuth();
  const { 
    locations,
    loading: locationsLoading,
    updateUserLocation,
    getCurrentLocationName,
    hasValidDeliveryLocation
  } = useLocation();
  
  const [stockError, setStockError] = useState('');
  const [showFreeProductModal, setShowFreeProductModal] = useState(false);
  // Expiry countdown
  const [now, setNow] = useState(Date.now());
  const removedRef = useRef(new Set());
  const EXPIRY_SECONDS_DEFAULT = Number(import.meta.env.VITE_CART_EXPIRY_SECONDS || 86400); // 24 hours default

  // Fetch fresh cart data when component mounts, but only if no pending add operations
  useEffect(() => {
    if (user) {
      const hasPendingAddOps = Object.values(pendingOperations || {}).some(op => 
        op?.type === 'adding' || op === 'adding'
      );
      if (!hasPendingAddOps) {
        console.log('🛒 Cart component mounted, fetching fresh cart data...');
        refreshCart();
      } else {
        console.log('🛒 Cart component mounted but has pending add operations, waiting before refresh...');
        // Wait a bit for pending add operations to complete, then refresh
        const timeoutId = setTimeout(() => {
          console.log('🛒 Delayed refresh after pending add operations');
          refreshCart(true); // Force refresh
        }, 1000);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [user, refreshCart]); // Removed pendingOperations from deps to avoid constant refetches

  // Additional effect to refresh when pending operations complete
  const prevHadPendingOpsRef = useRef(false);
  useEffect(() => {
    const hasPendingAddOps = Object.values(pendingOperations || {}).some(op => 
      op?.type === 'adding' || op === 'adding'
    );
    
    // Only refresh after add operations complete, not quantity updates
    if (prevHadPendingOpsRef.current && !hasPendingAddOps && user) {
      console.log('🛒 Add operations completed, refreshing cart');
      refreshCart(true); // Force refresh
    }
    
    prevHadPendingOpsRef.current = hasPendingAddOps;
  }, [pendingOperations, user, refreshCart]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeLeftForItem = useCallback((item) => {
    try {
      const expiresAt = item?.expiresAt ? new Date(item.expiresAt) : null;
      let msLeft;
      if (expiresAt) {
        msLeft = expiresAt.getTime() - now;
      } else {
        const added = item?.addedAt ? new Date(item.addedAt) : new Date();
        msLeft = added.getTime() + EXPIRY_SECONDS_DEFAULT * 1000 - now;
      }
      return Math.max(0, msLeft || 0);
    } catch {
      return 0;
    }
  }, [now]);

  const formatHMS = (ms) => {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
    const s = String(totalSec % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // Generate aesthetic expiry message
  const getExpiryMessage = (timeLeft) => {
    const totalHours = Math.floor(timeLeft / (1000 * 60 * 60));
    const totalMinutes = Math.floor(timeLeft / (1000 * 60));
    
    if (totalHours >= 1) {
      return `Fresh for ${totalHours}h`;
    } else if (totalMinutes >= 30) {
      return `Fresh for ${totalMinutes}m`;
    } else if (totalMinutes >= 1) {
      return `${totalMinutes}m left`;
    } else {
      return 'Expiring soon';
    }
  };

  // Expiry tooltip message
  const getExpiryTooltip = () => {
    return "Items stay fresh in your cart for 24 hours to ensure availability and quality. Complete your order soon!";
  };

  // Get earliest expiry message for all items in cart
  const getEarliestExpiryMessage = () => {
    if (!Array.isArray(cartItems) || cartItems.length === 0) return null;
    
    let earliestTime = Infinity;
    cartItems.forEach((item) => {
      const timeLeft = timeLeftForItem(item);
      if (timeLeft < earliestTime) {
        earliestTime = timeLeft;
      }
    });
    
    if (earliestTime === Infinity) return null;
    return getExpiryMessage(earliestTime);
  };

  // Auto-remove when countdown reaches zero
  useEffect(() => {
    if (!Array.isArray(cartItems) || cartItems.length === 0) return;
    cartItems.forEach((item) => {
      const pid = item?.productId;
      if (!pid) return;
      const left = timeLeftForItem(item);
      if (left <= 0 && !removedRef.current.has(pid)) {
        removedRef.current.add(pid);
        removeFromCart(pid).finally(() => {
          toast.info(
            `🕒 "${item.name || 'Item'}" was automatically removed after 24 hours to ensure freshness.`, 
            {
              position: 'top-center',
              autoClose: 4000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              onClick: () => { try { window.location.href = `/products/${pid}`; } catch {} },
              style: {
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                color: '#0f172a',
                border: '1px solid #7dd3fc',
                borderRadius: '8px',
                fontSize: '14px'
              }
            }
          );
        });
      }
    });
  }, [now, cartItems, removeFromCart]);
  
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [jellyAnimations, setJellyAnimations] = useState({});
  const [animationDirections, setAnimationDirections] = useState({});
  
  // Refs for debouncing - one per product
  const lastQuantityChangeTimes = useRef({});
  
  const navigate = useNavigate();

  // Handle removing items - check if it's a free product
  const handleRemoveItem = async (item) => {
    try {
      if (item.isFreeProduct) {
        // Call free product API to remove and reset selectedFreeProductId
        await removeFreeProductFromCart();
        toast.success('Free product removed from cart');
      }
      // Always call the regular removeFromCart to update the local cart
      await removeFromCart(item.productId);
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    }
  };

  const orderExperience = useMemo(() => getOrderExperienceInfo(user), [user]);

  // Helper function to check if user can proceed to checkout
  const canProceedToCheckout = () => {
    const hasHostel = user?.hostel && user.hostel._id && user.hostel.name;
    const hasLocation = user?.location && user.location._id;
    const hasPhone = user?.phone && user?.phoneVerified;
    
    return hasHostel && hasLocation && hasPhone;
  };

  // Helper function to get checkout button text
  const getCheckoutButtonText = () => {
    if (!user?.hostel || !user.hostel._id || !user.hostel.name) {
      return 'Select Hostel';
    }
    if (!user?.location || !user.location._id) {
      return 'Select Location';
    }
    if (!user?.phone || !user?.phoneVerified) {
      return 'Verify Phone';
    }
    return 'Proceed to Checkout';
  };
  
  // Helper function to get missing profile details message
  const getMissingProfileDetails = () => {
    const missing = [];
    if (!user?.hostel || !user.hostel._id || !user.hostel.name) {
      missing.push('Hostel');
    }
    if (!user?.location || !user.location._id) {
      missing.push('Location');
    }
    if (!user?.phone || !user?.phoneVerified) {
      missing.push('Phone Number');
    }
    return missing;
  };

  // Helper to derive availability from product data stored in cart item
  const getItemAvailability = (item) => {
    try {
      // Use productDetails from the cart item instead of global products array
      const prod = item.productDetails;
      if (!prod) {
        return { unavailable: false, tracks: false, stock: Infinity, variantIndex: 0 };
      }
      
      const vi = Number.isInteger(item?.productDetails?.variantIndex) ? item.productDetails.variantIndex : 0;
      const variant = prod?.variants?.[vi];
      if (!variant) {
        return { unavailable: false, tracks: false, stock: Infinity, variantIndex: vi };
      }
      
      const tracks = !!variant?.isStockActive;
      const stock = tracks ? (variant?.stock ?? 0) : Infinity;
      const unavailable = tracks && stock <= 0;
      
      return { unavailable, tracks, stock, variantIndex: vi };
    } catch (error) {
      console.error('Error in getItemAvailability:', error);
      return { unavailable: false, tracks: false, stock: Infinity, variantIndex: 0 };
    }
  };

  // Helper function to calculate cart totals using admin pricing logic
  const cartTotals = useMemo(() => {
    const totals = calculateCartTotals(cartItems);
    // Ensure all totals are valid numbers
    return {
      finalTotal: isNaN(totals.finalTotal) ? 0 : totals.finalTotal,
      originalTotal: isNaN(totals.originalTotal) ? 0 : totals.originalTotal,
      totalSavings: isNaN(totals.totalSavings) ? 0 : totals.totalSavings,
      averageDiscountPercentage: isNaN(totals.averageDiscountPercentage) ? 0 : totals.averageDiscountPercentage
    };
  }, [cartItems]);

  // Extract individual totals for easier use
  const { finalTotal: discountedCartTotal, originalTotal, totalSavings, averageDiscountPercentage } = cartTotals;

  // Configuration constants - should ideally come from admin settings
  const FREE_DELIVERY_THRESHOLD = 500; // Free delivery above ₹500
  const DEFAULT_DELIVERY_CHARGE = 49; // Default delivery charge

  // Calculate delivery charge based on user's location
  const deliveryCharge = useMemo(() => {
    // If cart total is above threshold, delivery is free regardless of location
    if (discountedCartTotal >= FREE_DELIVERY_THRESHOLD) {
      return 0;
    }
    
    // Get user's selected location
    const userLocationId = user?.location?._id || user?.location?.locationId || user?.locationId;
    
    // Try to get user location - first check if location object exists directly, then search in locations array
    const userLocation = user?.location || 
      (userLocationId && locations?.length > 0 && locations.find(loc => loc._id === userLocationId));
    
    if (userLocation) {
      const charge = userLocation.deliveryCharge ?? DEFAULT_DELIVERY_CHARGE; // Use nullish coalescing to handle 0 values
      return isNaN(charge) ? DEFAULT_DELIVERY_CHARGE : charge;
    }
    // Default delivery charge if no location selected
    return DEFAULT_DELIVERY_CHARGE;
  }, [discountedCartTotal, user, locations]);
  
  // Grand total using discounted cart total only (without delivery charge)
  const grandTotal = useMemo(() => {
    return isNaN(discountedCartTotal) ? 0 : Math.max(0, discountedCartTotal);
  }, [discountedCartTotal]);

  // Exact same quantity change logic as ProductCard and ProductDisplayPage
  const handleQuantityChangeWithAnimation = useCallback((productId, delta, maxStock) => {
    if (delta === 0 || !productId) return;
    
    // Debounce rapid clicks - 50ms like ProductDisplayPage
    const now = Date.now();
    const lastTime = lastQuantityChangeTimes.current[productId] || 0;
    const timeSinceLastClick = now - lastTime;
    
    if (timeSinceLastClick < 50) return;
    
    lastQuantityChangeTimes.current[productId] = now;

    // Get current quantity
    const item = getCartItem(productId);
    const numericQuantity = Number(item?.quantity ?? 0);
    const currentQuantity = Number.isFinite(numericQuantity) ? numericQuantity : 0;
    const newQuantity = Math.max(0, currentQuantity + delta);

    if (newQuantity === currentQuantity) {
      return;
    }

    // Check stock limits
    if (maxStock !== undefined && newQuantity > maxStock) {
      setStockError(`Cannot add more items. Only ${maxStock} available in stock.`);
      setTimeout(() => setStockError(''), 3000);
      return;
    }
    
    // Set animation direction and trigger jelly animation IMMEDIATELY for instant feedback
    setAnimationDirections(prev => ({ ...prev, [productId]: delta > 0 ? 'up' : 'down' }));
    setJellyAnimations(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
    
    // Fire-and-forget: Update quantity without blocking UI (non-blocking, instant updates)
    updateQuantity(productId, newQuantity).catch(error => {
      console.error('Error updating quantity:', error);
      setStockError(error?.message || 'Failed to update quantity');
      setTimeout(() => setStockError(''), 3000);
    });
  }, [updateQuantity, getCartItem]);

  // Handle location change
  const handleChangeLocation = async () => {
    if (selectedLocationId) {
      await updateUserLocation(selectedLocationId);
    }
    setShowLocationModal(false);
  };
  
  // Handle checkout
  const handleCheckout = async () => {
    try {
      // Block checkout if any item is out of stock
      const hasUnavailable = cartItems.some((i) => getItemAvailability(i).unavailable);
      if (hasUnavailable) {
        toast.error('Some items are out of stock. Please remove them before checkout.');
        return;
      }
      
      // Validate all required profile fields
      const missingDetails = getMissingProfileDetails();
      if (missingDetails.length > 0) {
        const missingText = missingDetails.join(', ');
        toast.error(`Please complete your profile: Add ${missingText}`, {
          duration: 5000
        });
        return;
      }
      
      // Validate hostel selection
      if (!user?.hostel || !user.hostel._id || !user.hostel.name) {
        toast.error('Please select your hostel from your profile before proceeding to checkout.');
        return;
      }
      
      // Validate location selection
      if (!user?.location || !user.location._id) {
        toast.error('Please select your delivery location from your profile before proceeding to checkout.');
        return;
      }
      
      // Validate phone verification
      if (!user?.phone || !user?.phoneVerified) {
        toast.error('Please verify your phone number in your profile before proceeding to checkout.');
        return;
      }
      
      // Check shop status before proceeding
      const currentStatus = await checkShopStatusNow();
      
      if (!currentStatus.isOpen) {
        // Shop is closed, the UI will show the overlay
        return;
      }
      
      // Go to the checkout page
      navigate('/checkout');
    } catch (error) {
      console.error('Error during checkout:', error);
    }
  };

  const handleNavigateToProduct = (productId) => {
    if (!productId) {
      toast.error('Product details unavailable');
      return;
    }
    navigate(`/product/${productId}`);
  };

  // Check cart state and determine what to show
  const hasPendingOps = Object.keys(pendingOperations || {}).length > 0;
  const isCartEmpty = cartItems.length === 0;
  
  // Only show loading for initial cart fetch, not for quantity updates
  const hasPendingAddOperations = Object.values(pendingOperations || {}).some(op => 
    op?.type === 'adding' || op === 'adding'
  );
  const shouldShowLoadingState = isLoading || hasPendingAddOperations;
  const shouldShowEmptyState = isCartEmpty && !shouldShowLoadingState;

  // Show loading state only for cart fetch or add operations (not quantity updates)
  if (shouldShowLoadingState) {
    return (
      <div className="min-h-screen bg-white px-4 py-20 flex items-center justify-center">
        <div className="max-w-2xl w-full text-center space-y-6">
          <div className="flex flex-col items-center gap-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#733857]"></div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-[#733857]/60">
                {hasPendingAddOperations ? 'Processing' : 'Loading'}
              </p>
              <h2 className="text-xl font-light tracking-wide text-[#733857]">
                {hasPendingAddOperations ? 'Adding to cart...' : 'Loading your cart...'}
              </h2>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                {hasPendingAddOperations ? 'Please wait while we add your items' : 'Please wait while we fetch your items'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If cart is empty (and not loading)
  if (shouldShowEmptyState) {
    return (
      <div className="min-h-screen bg-white px-4 py-20 flex items-center justify-center">
        <div className="max-w-2xl w-full text-center space-y-10">
          <div className="flex flex-col items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center ">
              <FaShoppingCart className="text-3xl text-[#733857]" />
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-[#733857]/60">Cart Status</p>
              <h2 className="text-3xl font-light tracking-wide text-[#1a1a1a]">Your cart is empty</h2>
              <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto leading-relaxed">
                Looks like you haven&apos;t added anything yet. Explore today&apos;s specials and reserve your favourites before they sell out.
              </p>
            </div>
          </div>
          <div className="flex justify-center">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 border border-[#733857] px-6 py-3 text-sm font-medium tracking-wide text-[#733857] transition-colors duration-300 hover:bg-[#733857] hover:text-white"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <ShopClosureOverlay overlayType="page" showWhenClosed={!isOpen}>
      <div className="min-h-screen bg-white">
        <div className="w-full px-4 md:px-6 py-6 md:py-8">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-xl font-medium text-gray-900 mb-1">
              Your Cart
            </h1>
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-600">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
              </p>
              <span
                className="text-sm font-semibold"
                style={{ color: orderExperience.color}}
              >
                {orderExperience.label}
              </span>
            </div>
          </div>
          
          {/* Free Product Banner */}
          <FreeProductBanner onSelectFreeProduct={() => setShowFreeProductModal(true)} />
          
          <div className="w-full">
            {/* Cart Items */}
            <div className="w-full">
              {/* Table block wrapper so header and rows share padding */}
              <div className="bg-white rounded-lg p-4">
                {/* Table Header - Desktop Only */}
                <div className="hidden md:grid grid-cols-12 gap-4 border-b border-gray-200 pb-4 mb-6">
                <div className="col-span-6">
                  <span className="text-sm font-medium text-gray-600">Item</span>
                </div>
                <div className="col-span-2 text-center">
                  <span className="text-sm font-medium text-gray-600">Price</span>
                </div>
                <div className="col-span-2 text-center">
                  <span className="text-sm font-medium text-gray-600">Quantity</span>
                </div>
                <div className="col-span-1 text-center">
                  <span className="text-sm font-medium text-gray-600">Total</span>
                </div>
                <div className="col-span-1 text-center">
                  <span className="text-sm font-medium text-gray-600">Remove</span>
                </div>
              </div>
              
              {/* Stock Errors and Warnings */}
              
              {cartItems.some((i) => getItemAvailability(i).unavailable) && (
                <div className="bg-red-50 text-red-700 border border-red-200 rounded-md p-3 text-sm mb-4">
                  One or more items are out of stock. Remove them to proceed to checkout.
                </div>
              )}
              
              {stockError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
                  {stockError}
                </div>
              )}
              
              {/* Cart Items - Table Layout */}
              <div>
                {cartItems.map((item) => {
                  const { unavailable, tracks, stock } = getItemAvailability(item);
                  const maxReached = tracks && item.quantity >= stock;
                  const canIncrease = !unavailable && !maxReached;
                  // Removed pendingOp check to allow instant, non-blocking updates
                  
                  // Get variant data
                  const prod = item.productDetails || item.product || item;
                  const vi = Number.isInteger(item?.variantIndex) ? item.variantIndex : 0;
                  const variant = prod?.variants?.[vi];
                  const eggFromProduct = deriveEggStatus(prod);
                  const eggFromVariant = deriveEggStatus(prod?.selectedVariant);
                  const eggFromItem = deriveEggStatus(item);
                  const resolvedEgg = eggFromProduct ?? eggFromVariant ?? eggFromItem;
                  const hasEgg = typeof resolvedEgg === 'boolean' ? resolvedEgg : false;
                  const eggLabel = hasEgg ? 'Egg' : 'Eggless';
                  const variantLabel = formatVariantLabel(prod?.selectedVariant)
                    || prod?.variantLabel
                    || (Array.isArray(prod?.variants) && prod.variants[vi]?.variantLabel)
                    || formatVariantLabel(Array.isArray(prod?.variants) && prod.variants[vi]);
                  
                  if (!variant) return null;

                  const pricing = calculatePricing(variant);
                  // Free products should have 0 price
                  const unitFinalPrice = item.isFreeProduct ? 0 : (Number.isFinite(pricing.finalPrice) ? pricing.finalPrice : 0);
                  const unitMrp = item.isFreeProduct ? 0 : (Number.isFinite(pricing.mrp) ? pricing.mrp : unitFinalPrice);
                  const discountPercentage = Number.isFinite(pricing.discountPercentage) ? pricing.discountPercentage : 0;
                  const hasDiscount = discountPercentage > 0;
                  const lineTotal = unitFinalPrice * Number(item.quantity || 0);
                  
                  return (
                    <div key={item.id} className="md:grid md:grid-cols-12 gap-4 items-center py-4 bg-white border-b border-[#733857] mb-5 pb-5">
                      {/* Mobile Layout */}
                      <div className="md:hidden flex flex-col w-full">
                        <div className="flex items-center gap-4">
                          {/* Product Image */}
                          <div className="flex flex-col items-center">
                            <button
                              type="button"
                              onClick={() => handleNavigateToProduct(item.productId)}
                              className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#733857] cursor-pointer"
                              aria-label="View product details"
                            >
                              <img 
                                src={item.image || '/placeholder-image.jpg'} 
                                alt={item.name || 'Product'} 
                                className="w-full h-full object-cover"
                              />
                            </button>
                            {/* Simple countdown (mobile) */}
                            <p className="text-[9px] text-green-600 mt-1 font-medium text-center" title={getExpiryTooltip()}>
                              {getExpiryMessage(timeLeftForItem(item))}
                            </p>
                          </div>
                          
                          {/* Product Name & Price */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-[#733857]">
                                {item.name || 'Product'}
                              </h3>
                              {item.isFreeProduct && (
                                <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                                  FREE
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                              <span>₹{unitFinalPrice.toFixed(0)} each</span>
                              {hasDiscount && (
                                <span className="text-xs text-gray-500 line-through">₹{unitMrp.toFixed(0)}</span>
                              )}
                            </div>
                            {hasDiscount && (
                              <div className="mt-1">
                                <OfferBadge label={`${discountPercentage}% OFF`} className="text-[10px]" />
                              </div>
                            )}
                            <p className="text-xs text-gray-600 mt-1">
                              Variant: <span className="font-medium text-gray-800">{variantLabel || 'Default'}</span>
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              Egg (or) Eggless: <span className="font-medium text-gray-800">{eggLabel}</span>
                            </p>
                          </div>
                          
                          {/* Remove Button with quantity-based styling */}
                          <button 
                            onClick={() => handleRemoveItem(item)}
                            className={`flex items-center justify-center w-12 h-12 transition-all duration-300 rounded-lg border group ml-3 ${
                              item.quantity === 1 
                                ? 'text-red-500 border-red-400 bg-red-50 hover:bg-red-100 hover:border-red-500 animate-pulse' 
                                : 'text-gray-400 hover:text-red-500 hover:bg-red-50 border-gray-200 hover:border-red-200'
                            }`}
                            aria-label="Remove item"
                            title={item.quantity === 1 ? "Click to remove this item" : "Remove item from cart"}
                          >
                            <FaTrash 
                              size={16} 
                              className={`group-hover:scale-110 transition-transform duration-200 ${
                                item.quantity === 1 ? 'animate-bounce' : ''
                              }`} 
                            />
                          </button>
                        </div>
                        
                        {/* Quantity Controls - Mobile */}
                        <div className="mt-3 flex justify-between items-center">
                          <div className="flex items-center border border-[#733857] rounded-lg bg-white">
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuantityChangeWithAnimation(item.productId, -1, stock);
                              }}
                              className={`w-8 h-8 flex items-center justify-center transition-all duration-150 rounded-l-lg font-light select-none ${
                                item.quantity <= 1 
                                  ? 'text-gray-300 cursor-not-allowed bg-gray-50' 
                                  : 'text-[#733857] hover:bg-[#733857]/10'
                              }`}
                              disabled={item.quantity <= 1}
                              style={{ userSelect: 'none' }}
                              title={item.quantity <= 1 ? "Use trash icon to remove item" : "Decrease quantity"}
                            >
                              −
                            </button>
                            <motion.span
                              key={`jelly-mobile-cart-${item.productId}-${jellyAnimations[item.productId] || 0}`}
                              initial={{ 
                                scaleX: 1, 
                                scaleY: 1,
                                y: animationDirections[item.productId] === 'up' ? -10 : animationDirections[item.productId] === 'down' ? 10 : 0,
                                opacity: animationDirections[item.productId] ? 0.7 : 1
                              }}
                              animate={{
                                scaleX: [1, 1.15, 0.95, 1.03, 1],
                                scaleY: [1, 0.85, 1.05, 0.98, 1],
                                y: [
                                  animationDirections[item.productId] === 'up' ? -10 : animationDirections[item.productId] === 'down' ? 10 : 0,
                                  animationDirections[item.productId] === 'up' ? -5 : animationDirections[item.productId] === 'down' ? 5 : 0,
                                  0,
                                  0,
                                  0
                                ],
                                opacity: [
                                  animationDirections[item.productId] !== 'none' ? 0.7 : 1,
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
                              className="px-3 py-1 font-light text-sm min-w-[2.5rem] text-center border-l border-r border-[#733857] text-[#733857] inline-block select-none"
                              style={{ userSelect: 'none' }}
                            >
                              {item.quantity}
                            </motion.span>
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuantityChangeWithAnimation(item.productId, 1, stock);
                              }}
                              className="w-8 h-8 flex items-center justify-center text-[#733857] hover:bg-[#733857]/10 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg font-light select-none"
                              disabled={!canIncrease}
                              style={{ userSelect: 'none' }}
                            >
                              +
                            </button>
                          </div>
                          
                          {/* Item Total - Mobile */}
                          <div className="font-medium text-right">
                            <div>₹{lineTotal.toFixed(0)}</div>
                            {hasDiscount && (
                              <div className="text-xs text-gray-500 line-through">
                                ₹{(unitMrp * item.quantity).toFixed(0)}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Helpful message when quantity is 1 - Mobile */}
                        {item.quantity === 1 && (
                          <div className="mt-2 text-center">
                            <p className="text-xs text-red-600 font-medium animate-pulse">
                              👆 Use the trash icon above to remove this item
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Desktop Layout */}
                      {/* Product Info - spans 6 */}
                      <div className="hidden md:flex col-span-6 items-center gap-4 pl-4">
                        <div className="flex flex-col items-center">
                          <button
                            type="button"
                            onClick={() => handleNavigateToProduct(item.productId)}
                            className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#733857] cursor-pointer"
                            aria-label="View product details"
                          >
                            <img 
                              src={item.image || '/placeholder-image.jpg'} 
                              alt={item.name || 'Product'} 
                              className="w-full h-full object-cover"
                            />
                          </button>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-[#733857]">
                              {item.name || 'Product'}
                            </h3>
                            {item.isFreeProduct && (
                              <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                                FREE
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {variantLabel || variant.size || variant.weight || 'Standard'}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Egg (or) Eggless: <span className="font-medium text-gray-800">{eggLabel}</span>
                          </p>
                          {/* Simple countdown (desktop) */}
                          <p className="text-[10px] text-green-600 mt-1 font-medium" title="Items stay fresh in your cart for 24 hours to ensure availability and quality. Complete your order soon!">
                            {getExpiryMessage(timeLeftForItem(item))}
                          </p>
                        </div>
                      </div>

                      {/* Price - spans 2 */}
                      <div className="hidden md:flex col-span-2 items-center justify-center">
                        <div className="text-center space-y-1">
                          {hasDiscount && (
                            <span className="block text-xs text-gray-400 line-through">
                              ₹{unitMrp.toFixed(2)}
                            </span>
                          )}
                          <span className="text-sm text-gray-800 font-medium">
                            ₹{unitFinalPrice.toFixed(2)}
                          </span>
                          {hasDiscount && (
                            <OfferBadge label={`${discountPercentage}% OFF`} className="mt-1 text-[10px]" />
                          )}
                        </div>
                      </div>

                      {/* Quantity Controls - spans 2 */}
                      <div className="hidden md:flex col-span-2 items-center justify-center">
                        <div className="flex items-center border border-[#733857] rounded-lg bg-white">
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuantityChangeWithAnimation(item.productId, -1, stock);
                            }}
                            className={`w-8 h-8 flex items-center justify-center transition-all duration-150 rounded-l-lg font-light select-none ${
                              item.quantity <= 1 
                                ? 'text-gray-300 cursor-not-allowed bg-gray-50' 
                                : 'text-[#733857] hover:bg-[#733857]/10'
                            }`}
                            disabled={item.quantity <= 1}
                            style={{ userSelect: 'none' }}
                            title={item.quantity <= 1 ? "Use trash icon to remove item" : "Decrease quantity"}
                          >
                            −
                          </button>
                          <motion.span
                            key={`jelly-cart-${item.productId}-${jellyAnimations[item.productId] || 0}`}
                            initial={{ 
                              scaleX: 1, 
                              scaleY: 1,
                              y: animationDirections[item.productId] === 'up' ? -10 : animationDirections[item.productId] === 'down' ? 10 : 0,
                              opacity: animationDirections[item.productId] ? 0.7 : 1
                            }}
                            animate={{
                              scaleX: [1, 1.15, 0.95, 1.03, 1],
                              scaleY: [1, 0.85, 1.05, 0.98, 1],
                              y: [
                                animationDirections[item.productId] === 'up' ? -10 : animationDirections[item.productId] === 'down' ? 10 : 0,
                                animationDirections[item.productId] === 'up' ? -5 : animationDirections[item.productId] === 'down' ? 5 : 0,
                                0,
                                0,
                                0
                              ],
                              opacity: [
                                animationDirections[item.productId] !== 'none' ? 0.7 : 1,
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
                            className="px-3 py-1 font-light text-sm min-w-[2.5rem] text-center border-l border-r border-[#733857] text-[#733857] inline-block select-none"
                            style={{ userSelect: 'none' }}
                          >
                            {item.quantity}
                          </motion.span>
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuantityChangeWithAnimation(item.productId, 1, stock);
                            }}
                            className="w-8 h-8 flex items-center justify-center text-[#733857] hover:bg-[#733857]/10 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg font-light select-none"
                            disabled={!canIncrease}
                            style={{ userSelect: 'none' }}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Total - spans 1 */}
                      <div className="hidden md:flex col-span-1 items-center justify-center">
                        <div className="text-center space-y-1">
                          {hasDiscount && (
                            <span className="block text-xs text-gray-400 line-through">
                              ₹{(unitMrp * item.quantity).toFixed(2)}
                            </span>
                          )}
                          <span className="text-sm font-semibold text-[#733857]">
                            ₹{lineTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Remove Button - spans 1 */}
                      <div className="hidden md:flex col-span-1 items-center justify-center flex-col">
                        <button 
                          onClick={() => handleRemoveItem(item)}
                          className={`flex items-center justify-center w-10 h-10 transition-all duration-300 rounded-lg border group ${
                            item.quantity === 1 
                              ? 'text-red-500 border-red-400 bg-red-50 hover:bg-red-100 hover:border-red-500 animate-pulse' 
                              : 'text-gray-400 hover:text-red-500 hover:bg-red-50 border-gray-200 hover:border-red-200'
                          }`}
                          aria-label="Remove item"
                          title={item.quantity === 1 ? "Click to remove this item" : "Remove item from cart"}
                        >
                          <FaTrash 
                            size={16} 
                            className={`group-hover:scale-110 transition-transform duration-200 ${
                              item.quantity === 1 ? 'animate-bounce' : ''
                            }`} 
                          />
                        </button>
                        {/* Helpful text when quantity is 1 - Desktop */}
                        {item.quantity === 1 && (
                          <p className="text-xs text-red-600 font-medium mt-1 text-center animate-pulse">
                            Click to remove
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              </div>
              
              {/* Total Section */}
              <div className="mt-8">
                {/* Mobile Total */}
                <div className="md:hidden px-4">
                  <div className="flex justify-between items-center border-t border-b border-gray-300 py-4">
                    <span className="text-lg font-medium">Total: </span>
                    <span className="text-lg font-bold">{formatCurrency(discountedCartTotal)}</span>
                  </div>
                </div>
                
                {/* Desktop Total */}
                <div className="hidden md:flex justify-end pr-4">
                  <div className="w-64 border-t border-b border-brown-300 py-4 flex justify-end">
                    <span className="text-xl font-bold text-black pr-2">
                      Total : {formatCurrency(discountedCartTotal)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Profile Completion Warning - Compact & Professional */}
              {!canProceedToCheckout() && (
                <div className="px-4 mt-4 mb-3">
                  <div className="bg-pink-50 border border-pink-200 rounded-md p-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <FaExclamationTriangle className="text-pink-600 text-sm flex-shrink-0" />
                      <h3 className="text-sm font-semibold text-pink-900">
                        Complete Profile to Checkout
                      </h3>
                    </div>
                    <div className="ml-6 space-y-1 text-xs text-pink-800">
                      {!user?.hostel && <div>• Add Hostel</div>}
                      {!user?.location && <div>• Add Delivery Location</div>}
                      {(!user?.phone || !user?.phoneVerified) && <div>• Verify Phone Number</div>}
                    </div>
                    <Link 
                      to="/profile" 
                      className="inline-block ml-6 mt-2 text-xs font-semibold text-pink-700 hover:text-pink-900 underline"
                    >
                      Update Profile →
                    </Link>
                  </div>
                </div>
              )}
              
              {/* Checkout Button */}
              <div className="px-4 md:flex md:justify-center mt-6">
                <AnimatedButton
                  onClick={handleCheckout}
                  disabled={!canProceedToCheckout()}
                  className="w-full md:w-auto"
                  style={{
                    width: '100%',
                    maxWidth: '320px',
                    margin: '0 auto'
                  }}
                >
                  {canProceedToCheckout() ? "CHECKOUT" : getCheckoutButtonText()}
                </AnimatedButton>
              </div>

              {/* Countdown explanation below checkout on mobile */}
              <div className="md:hidden px-4 mt-3 flex justify-center">
                <p className="text-xs text-gray-500 text-center">
                Items stay fresh for 24 hours to ensure quality & availability
                </p>
              </div>

              {/* Countdown explanation below checkout on desktop */}
              <div className="hidden md:flex justify-center mt-3">
                <p className="text-xs text-gray-500 text-center">
                  Items stay fresh for 24 hours to ensure quality & availability
                </p>
              </div>

              {/* Countdown message below checkout on mobile */}
           
              
              {!canProceedToCheckout() && (
                <div className="mt-3 flex justify-center">
                  <div className="space-y-1">
                    {(!user?.hostel || !user.hostel._id || !user.hostel.name) && (
                      <p className="text-amber-600 text-xs text-center">
                        Select your hostel from your profile to continue
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Free Product Modal */}
      <FreeProductModal 
        isOpen={showFreeProductModal} 
        onClose={() => setShowFreeProductModal(false)} 
      />

    </ShopClosureOverlay>
  );
};

export default Cart;
