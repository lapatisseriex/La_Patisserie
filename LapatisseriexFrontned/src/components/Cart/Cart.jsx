import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTrash, FaArrowLeft, FaMapMarkerAlt, FaShoppingCart, FaExclamationTriangle, FaBuilding } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../context/LocationContext/LocationContext';
import { useShopStatus } from '../../context/ShopStatusContext';
import ShopClosureOverlay from '../common/ShopClosureOverlay';
import { toast } from 'react-toastify';
import { calculatePricing, calculateCartTotals, formatCurrency } from '../../utils/pricingUtils';
import { formatVariantLabel } from '../../utils/variantUtils';
import OfferBadge from '../common/OfferBadge';
import { getOrderExperienceInfo } from '../../utils/orderExperience';

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
  const { cartItems, updateQuantity, removeFromCart, pendingOperations, getCartItem } = useCart();
  
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
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [jellyAnimations, setJellyAnimations] = useState({});
  const [animationDirections, setAnimationDirections] = useState({});
  
  const navigate = useNavigate();

  const orderExperience = useMemo(() => getOrderExperienceInfo(user), [user]);

  // Helper function to check if user can proceed to checkout
  const canProceedToCheckout = () => {
    return user?.hostel && user.hostel._id && user.hostel.name;
  };

  // Helper function to get checkout button text
  const getCheckoutButtonText = () => {
    if (!user?.hostel || !user.hostel._id || !user.hostel.name) {
      return 'Select Hostel';
    }
    return 'Proceed to Checkout';
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

  const handleQuantityChange = async (productId, nextQuantity, maxStock) => {
    const normalizedQuantity = Number(nextQuantity);
    const safeQuantity = Math.max(0, Number.isNaN(normalizedQuantity) ? 0 : Math.round(normalizedQuantity));

    const currentItem = getCartItem(productId);
    const existingQuantity = Number(currentItem?.quantity ?? 0);
    if (Number.isFinite(existingQuantity) && safeQuantity === existingQuantity) {
      return;
    }

    if (maxStock !== undefined && safeQuantity > maxStock) {
      setStockError(`Cannot add more items. Only ${maxStock} available in stock.`);
      // Clear error after 3 seconds
      setTimeout(() => setStockError(''), 3000);
      return;
    }
    try {
      await updateQuantity(productId, safeQuantity);
      setStockError(''); // Clear any previous error
    } catch (error) {
      setStockError(error?.message || 'Failed to update quantity');
      setTimeout(() => setStockError(''), 3000);
    }
  };

  // Enhanced quantity handler with animation
  const handleQuantityChangeWithAnimation = async (productId, delta, maxStock) => {
    const pendingOp = pendingOperations?.[productId];
    if (pendingOp && ['updating', 'removing'].includes(pendingOp.type)) {
      return;
    }

    const item = getCartItem(productId);
    const numericQuantity = Number(item?.quantity ?? 0);
    const currentQuantity = Number.isFinite(numericQuantity) ? numericQuantity : 0;
    const newQuantity = Math.max(0, currentQuantity + delta);

    if (newQuantity === currentQuantity) {
      return;
    }
    
    // Set animation direction and trigger animation
    setAnimationDirections(prev => ({ ...prev, [productId]: delta > 0 ? 'up' : 'down' }));
    setJellyAnimations(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
    
    // Call the original handler
    await handleQuantityChange(productId, newQuantity, maxStock);
  };

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
      
      // Validate hostel selection
      if (!user?.hostel || !user.hostel._id || !user.hostel.name) {
        toast.error('Please select your hostel from your profile before proceeding to checkout.');
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
  // If cart is empty
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white px-4 py-20 flex items-center justify-center">
        <div className="max-w-2xl w-full text-center space-y-10">
          <div className="flex flex-col items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center border border-[#733857]/20">
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
            <h1 className="text-xl font-medium text-gray-900 mb-1" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>
              Your Cart
            </h1>
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-600">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
              </p>
              <span
                className="text-sm font-semibold"
                style={{ color: orderExperience.color, fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                {orderExperience.label}
              </span>
            </div>
          </div>
          
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
                <div className="col-span-2 text-center">
                  <span className="text-sm font-medium text-gray-600">Total</span>
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
                  const pendingOp = pendingOperations?.[item.productId];
                  const isQuantityUpdating = pendingOp && ['updating', 'removing'].includes(pendingOp.type);
                  
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
                  const unitFinalPrice = Number.isFinite(pricing.finalPrice) ? pricing.finalPrice : 0;
                  const unitMrp = Number.isFinite(pricing.mrp) ? pricing.mrp : unitFinalPrice;
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
                          </div>
                          
                          {/* Product Name & Price */}
                          <div className="flex-1">
                            <h3 className="font-medium text-[#733857]" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>
                              {item.name || 'Product'}
                            </h3>
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
                          
                          {/* Remove Button */}
                          <button 
                            onClick={() => removeFromCart(item.productId)}
                            className="text-gray-600 hover:text-red-500 transition-colors"
                            aria-label="Remove item"
                          >
                            Remove
                          </button>
                        </div>
                        
                        {/* Quantity Controls - Mobile */}
                        <div className="mt-3 flex justify-between items-center">
                          <div className="flex items-center border border-gray-300 rounded-lg">
                            <button 
                              type="button"
                              onClick={() => handleQuantityChangeWithAnimation(item.productId, -1, stock)}
                              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors rounded-l-lg"
                                disabled={item.quantity <= 1 || isQuantityUpdating}
                            >
                              -
                            </button>
                            <motion.span
                              key={`jelly-mobile-cart-${item.productId}-${jellyAnimations[item.productId] || 0}`}
                              initial={{ 
                                scaleX: 1, 
                                scaleY: 1,
                                y: animationDirections[item.productId] === 'up' ? -10 : animationDirections[item.productId] === 'down' ? 10 : 0,
                                opacity: animationDirections[item.productId] ? 0.7 : 1
                              }}
                              animate={{ scaleX: 1, scaleY: 1, y: 0, opacity: 1 }}
                              transition={{ 
                                type: "spring", 
                                stiffness: 500, 
                                damping: 25,
                                duration: 0.3
                              }}
                              className="w-12 h-8 flex items-center justify-center text-sm font-medium text-gray-900 bg-white border-l border-r border-gray-300"
                            >
                              {item.quantity}
                            </motion.span>
                            <button 
                              type="button"
                              onClick={() => handleQuantityChangeWithAnimation(item.productId, 1, stock)}
                              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors rounded-r-lg"
                              disabled={!canIncrease || isQuantityUpdating}
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
                          <h3 className="font-medium text-[#733857] mb-1" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>
                            {item.name || 'Product'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {variantLabel || variant.size || variant.weight || 'Standard'}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Egg (or) Eggless: <span className="font-medium text-gray-800">{eggLabel}</span>
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
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button 
                            type="button"
                            onClick={() => handleQuantityChangeWithAnimation(item.productId, -1, stock)}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors rounded-l-lg"
                            disabled={item.quantity <= 1 || isQuantityUpdating}
                          >
                            -
                          </button>
                          <motion.span
                            key={`jelly-cart-${item.productId}-${jellyAnimations[item.productId] || 0}`}
                            initial={{ 
                              scaleX: 1, 
                              scaleY: 1,
                              y: animationDirections[item.productId] === 'up' ? -10 : animationDirections[item.productId] === 'down' ? 10 : 0,
                              opacity: animationDirections[item.productId] ? 0.7 : 1
                            }}
                            animate={{ scaleX: 1, scaleY: 1, y: 0, opacity: 1 }}
                            transition={{ 
                              type: "spring", 
                              stiffness: 500, 
                              damping: 25,
                              duration: 0.3
                            }}
                            className="w-12 h-8 flex items-center justify-center text-sm font-medium text-gray-900 bg-white border-l border-r border-gray-300"
                          >
                            {item.quantity}
                          </motion.span>
                          <button 
                            type="button"
                            onClick={() => handleQuantityChangeWithAnimation(item.productId, 1, stock)}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors rounded-r-lg"
                            disabled={!canIncrease || isQuantityUpdating}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Total - spans 2 */}
                      <div className="hidden md:flex col-span-2 items-center justify-center relative">
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
                        <button 
                          onClick={() => removeFromCart(item.productId)}
                          className="text-gray-300 hover:text-red-500 transition-colors absolute top-0 right-4"
                          aria-label="Remove item"
                        >
                          <FaTrash size={10} />
                        </button>
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
                    <span className="text-xl font-bold text-black pr-2" style={{fontFamily: 'Montserrat, Arial, sans-serif'}}>
                      Total : {formatCurrency(discountedCartTotal)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Checkout Button */}
              <div className="px-4 md:flex md:justify-center mt-6">
                <button 
                  onClick={handleCheckout}
                  disabled={!canProceedToCheckout()}
                  className={`w-full md:max-w-xs py-2 px-5 rounded-lg font-medium text-sm text-center transition-all duration-200 ${
                    canProceedToCheckout()
                      ? 'bg-[#733857] hover:bg-[#8d4466] text-white shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  style={{fontFamily: 'Montserrat, Arial, sans-serif'}}
                >
                  {canProceedToCheckout() ? "Checkout" : getCheckoutButtonText()}
                </button>
              </div>
              
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


    </ShopClosureOverlay>
  );
};

export default Cart;
