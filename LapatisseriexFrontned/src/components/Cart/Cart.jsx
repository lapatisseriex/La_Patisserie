import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTrash, FaArrowLeft, FaMapMarkerAlt, FaShoppingCart, FaExclamationTriangle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../context/LocationContext/LocationContext';
import { useShopStatus } from '../../context/ShopStatusContext';
import ShopClosureOverlay from '../common/ShopClosureOverlay';
import { toast } from 'react-toastify';
import { calculatePricing, calculateCartTotals, formatCurrency } from '../../utils/pricingUtils';

const Cart = () => {
  const { isOpen, checkShopStatusNow } = useShopStatus();
  const { cartItems, cartCount, updateQuantity, removeFromCart, clearCart, error: cartError } = useCart();
  
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
  
  // Grand total using discounted cart total
  const grandTotal = useMemo(() => {
    const total = discountedCartTotal + deliveryCharge;
    return isNaN(total) ? 0 : Math.max(0, total);
  }, [discountedCartTotal, deliveryCharge]);

  const handleQuantityChange = async (productId, newQuantity, maxStock) => {
    if (maxStock !== undefined && newQuantity > maxStock) {
      setStockError(`Cannot add more items. Only ${maxStock} available in stock.`);
      // Clear error after 3 seconds
      setTimeout(() => setStockError(''), 3000);
      return;
    }
    try {
      await updateQuantity(productId, newQuantity);
      setStockError(''); // Clear any previous error
    } catch (error) {
      setStockError(error?.message || 'Failed to update quantity');
      setTimeout(() => setStockError(''), 3000);
    }
  };

  // Enhanced quantity handler with animation
  const handleQuantityChangeWithAnimation = async (productId, currentQuantity, delta, maxStock) => {
    const newQuantity = Math.max(0, currentQuantity + delta);
    
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
      // Check shop status before proceeding
      const currentStatus = await checkShopStatusNow();
      
      if (!currentStatus.isOpen) {
        // Shop is closed, the UI will show the overlay
        return;
      }
      
      // Go to the checkout page (payment)
      navigate('/payment');
    } catch (error) {
      console.error('Error during checkout:', error);
    }
  };
  // If cart is empty
  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="text-center py-10">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaShoppingCart className="text-gray-400 text-4xl" />
            </div>
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent mb-2">Your cart is empty</h2>
            <p className="bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent mb-8">Looks like you haven't added any items to your cart yet</p>
            <style>{`
              .browse-products-btn span {
                background: linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%);
                -webkit-background-clip: text;
                background-clip: text;
                color: transparent;
                transition: all 0.3s ease;
              }
              .browse-products-btn:hover span {
                color: white !important;
                background: none !important;
                -webkit-background-clip: unset !important;
                background-clip: unset !important;
              }
            `}</style>
            <Link 
              to="/products" 
              className="browse-products-btn group bg-white border-2 border-[#733857] font-semibold py-3 px-8 rounded-lg hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] hover:border-[#733857] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
            >
              <span className="transition-all duration-300">
                Browse Products
              </span>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <ShopClosureOverlay overlayType="page" showWhenClosed={!isOpen}>
      <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Back button - hidden on mobile, visible on desktop with top padding */}
        <div className="hidden md:flex items-center mb-6 pt-4">
          <Link to="/products" className="flex items-center bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent hover:opacity-80 transition-opacity">
            <FaArrowLeft className="mr-2" />
            <span>Back</span>
          </Link>
        </div>
        
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-8 mb-8 lg:mb-0">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="pb-4 border-b border-gray-200 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-semibold text-lg bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">Cart Items ({cartItems.length})</h2>
                    </div>
                    <div className="flex items-center text-sm bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">
                      <FaMapMarkerAlt className={`${hasValidDeliveryLocation() ? 'text-gray-500' : 'text-amber-500'} mr-1`} />
                      <span className="mr-2">{user?.location ? `${user.location.area}, ${user.location.city}` : 'Select Location'}</span>
                    </div>
                  </div>
                  <button 
                    className="bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent hover:opacity-80 transition-opacity text-sm font-medium"
                    onClick={() => setShowLocationModal(true)}
                  >
                    {user?.location ? 'Change' : 'Select'}
                  </button>
                </div>
              </div>
              
              {/* Location Warning */}
              {!hasValidDeliveryLocation() && (
                <div className="bg-amber-50 text-amber-800 border border-amber-200 rounded-md p-4 mb-6">
                  <div className="flex items-start">
                    <FaExclamationTriangle className="text-amber-500 mt-0.5 mr-2" />
                    <div>
                      <p className="font-medium">Delivery location required</p>
                      <p className="text-sm mt-1">Please select a valid delivery location to place your order</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Cart item list */}
              <div className="space-y-6">
                {cartItems.some((i) => getItemAvailability(i).unavailable) && (
                  <div className="bg-red-50 text-red-700 border border-red-200 rounded-md p-3 text-sm">
                    One or more items are out of stock. Remove them to proceed to checkout.
                  </div>
                )}
                {stockError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
                    {stockError}
                  </div>
                )}
                {cartItems.map((item) => {
                  const { unavailable, tracks, stock } = getItemAvailability(item);
                  const maxReached = tracks && item.quantity >= stock;
                  const canIncrease = !unavailable && !maxReached;
                  return (
                  <div key={item.id} className="flex border-b border-gray-100 pb-6">
                    {/* Mobile-optimized image container */}
                    <div className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 mr-4">
                      <img 
                        src={item.image || '/placeholder-image.jpg'} 
                        alt={item.name || 'Product'} 
                        className="w-full h-full object-cover rounded-md"
                      />
                    </div>
                    
                    {/* Content section - takes remaining space */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent text-sm md:text-base pr-2">{item.name || 'Product'}</h3>
                        <button 
                          onClick={() => {
                            removeFromCart(item.productId);
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                        >
                          <FaTrash />
                        </button>
                      </div>
                      {unavailable && (
                        <div className="mb-2">
                          <span className="inline-block text-xs font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded px-2 py-0.5">
                            Product out of stock
                          </span>
                        </div>
                      )}
                      
                      {/* Quantity controls and price - mobile optimized */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <button 
                            onClick={() => {
                              handleQuantityChangeWithAnimation(item.productId, item.quantity, -1, stock);
                            }}
                            className={`w-7 h-7 md:w-8 md:h-8 rounded-l-md flex items-center justify-center border text-sm bg-gray-100 border-gray-200`}
                          >
                            -
                          </button>
                          <motion.input
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
                              y: 0,
                              opacity: 1
                            }}
                            transition={{
                              duration: 0.5,
                              times: [0, 0.2, 0.5, 0.8, 1],
                              ease: "easeInOut"
                            }}
                            type="text"
                            className="w-8 h-7 md:w-10 md:h-8 text-center text-xs md:text-sm border-t border-b border-gray-200"
                            value={item.quantity}
                            readOnly
                          />
                          <button
                            onClick={() => {
                              if (!canIncrease) return;
                              const nextQty = item.quantity + 1;
                              if (tracks && nextQty > stock) {
                                setStockError(`Cannot add more items. Only ${stock} available in stock.`);
                                setTimeout(() => setStockError(''), 3000);
                                return;
                              }
                              handleQuantityChangeWithAnimation(item.productId, item.quantity, 1, stock);
                            }}
                            disabled={!canIncrease}
                            className={`w-7 h-7 md:w-8 md:h-8 rounded-r-md flex items-center justify-center border text-sm ${
                              !canIncrease
                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                : 'bg-gray-100 border-gray-200'
                            }`}
                          >
                            +
                          </button>
                        </div>
                        
                        <div className="text-right">
                          {(() => {
                            // Get variant data from productDetails
                            const prod = item.productDetails;
                            const vi = Number.isInteger(item?.productDetails?.variantIndex) ? item.productDetails.variantIndex : 0;
                            const variant = prod?.variants?.[vi];
                            
                            if (!variant) {
                              // Skip item if no variant found - invalid cart item
                              console.warn('Cart item missing variant data:', item);
                              return (
                                <div className="font-medium bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent text-sm md:text-base">
                                  Invalid item
                                </div>
                              );
                            }
                            
                            // Use centralized pricing calculation
                            const pricing = calculatePricing(variant);
                            
                            return (
                              <>
                                <div className="font-medium bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent text-sm md:text-base">
                                  {formatCurrency(pricing.finalPrice * item.quantity)}
                                </div>
                                <div className="text-xs md:text-sm">
                                  <div className="space-y-1">
                                    {pricing.mrp > pricing.finalPrice && (
                                      <div className="bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">
                                        <span className="line-through">{formatCurrency(pricing.mrp)}</span>
                                        <span className="text-green-600 ml-1">{formatCurrency(pricing.finalPrice)}</span> each
                                      </div>
                                    )}
                                    {pricing.discountPercentage > 0 && (
                                      <div className="text-green-600 font-medium">{pricing.discountPercentage}% OFF</div>
                                    )}
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                          {maxReached && (
                            <div className="text-[10px] md:text-xs text-amber-600 mt-1">Max available stock reached</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );})}
              </div>
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-[130px] md:top-[140px]">
              <h2 className="font-semibold text-lg bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent pb-4 border-b border-gray-200 mb-4">
                Order Summary
              </h2>
              
              {/* Price Breakdown */}
              <div className="space-y-3">
                {(() => {
                  // Use pre-calculated averageDiscountPercentage from admin pricing logic
                  return (
                    <>
                      {originalTotal > discountedCartTotal && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">Original Price</span>
                            <span className="bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent line-through">{formatCurrency(originalTotal)}</span>
                          </div>
                          <div className="flex justify-between text-green-600">
                            <span>Discount Savings {averageDiscountPercentage > 0 && `(${averageDiscountPercentage}% OFF)`}</span>
                            <span className="font-medium">-{formatCurrency(totalSavings)}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between">
                        <span className="bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">Subtotal</span>
                        <span className="font-medium bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">{formatCurrency(discountedCartTotal)}</span>
                      </div>
                    </>
                  );
                })()}
                
                <div className="flex justify-between">
                  <div>
                    <span className="bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">Delivery Charge</span>
                    {(() => {
                      // Use the location object directly if it exists in user, otherwise search in locations array
                      const userLocation = user?.location || 
                        (user?.locationId && locations?.find(loc => loc._id === user.locationId));
                      
                      return userLocation ? (
                        <div className="text-xs bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">to {userLocation.area}</div>
                      ) : (
                        <div className="text-xs bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">default rate</div>
                      );
                    })()}
                  </div>
                  <span className="font-medium bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">
                    {deliveryCharge === 0 ? (
                      <span className="text-green-500">
                        Free
                        {discountedCartTotal >= FREE_DELIVERY_THRESHOLD && (
                          <div className="text-xs">Orders ≥ ₹{FREE_DELIVERY_THRESHOLD}</div>
                        )}
                      </span>
                    ) : (
                      `₹${deliveryCharge}`
                    )}
                  </span>
                </div>
                
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span className="bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">Total</span>
                    <span className="bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {/* Checkout Buttons */}
              <div className="mt-6">
                <button 
                  onClick={handleCheckout}
                  disabled={!hasValidDeliveryLocation()}
                  className={`group relative w-full rounded-lg overflow-hidden transition-all duration-300 font-semibold py-3 px-5 text-sm ${
                    hasValidDeliveryLocation()
                      ? 'bg-white border-2 border-[#733857] hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] hover:border-[#733857] transform hover:scale-[1.02] active:scale-[0.98] touch-manipulation'
                      : 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed'
                  }`}
                >
                  <span className="relative z-10 flex items-center justify-center gap-1.5">
                    <svg className={`w-3 h-3 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110 group-active:rotate-12 group-active:scale-110 ${
                      hasValidDeliveryLocation() 
                        ? 'text-[#733857] group-hover:text-white' 
                        : 'text-gray-400'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13v6a1 1 0 001 1h9a1 1 0 001-1v-6M17 13v6a1 1 0 01-1 1H8a1 1 0 01-1-1v-6" />
                    </svg>
                    <span className={`transform transition-all duration-300 group-hover:tracking-wider group-active:tracking-wider ${
                      hasValidDeliveryLocation() 
                        ? 'bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent group-hover:text-white' 
                        : 'text-gray-400'
                    }`}>
                      {hasValidDeliveryLocation() ? 'Proceed to Checkout' : 'Select Delivery Location'}
                    </span>
                    <svg className={`w-3 h-3 transition-all duration-300 group-hover:translate-x-1 group-hover:scale-110 group-active:translate-x-1 group-active:scale-110 ${
                      hasValidDeliveryLocation() 
                        ? 'text-[#733857] group-hover:text-white' 
                        : 'text-gray-400'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </button>
                
                {!hasValidDeliveryLocation() && (
                  <p className="text-amber-600 text-xs text-center mb-3">
                    Select a valid delivery location to continue
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-black mb-4">Select Delivery Location</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                We currently deliver to the following locations:
              </p>
              
              {locationsLoading ? (
                <div className="py-4 text-center text-gray-600">Loading locations...</div>
              ) : locations.length > 0 ? (
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                  {locations.map(location => (
                    <div 
                      key={location._id}
                      className={`p-3 border-b border-gray-100 last:border-0 cursor-pointer ${
                        selectedLocationId === location._id ? 'bg-pink-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedLocationId(location._id)}
                    >
                      <div className="flex items-start">
                        <input 
                          type="radio"
                          name="location"
                          className="mt-1 text-pink-500 focus:ring-pink-400"
                          checked={selectedLocationId === location._id}
                          onChange={() => setSelectedLocationId(location._id)}
                        />
                        <div className="ml-3">
                          <p className="font-medium text-black">{location.area}</p>
                          <p className="text-sm text-gray-600">{location.city}, {location.pincode}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center bg-gray-100 rounded-md">
                  No delivery locations available at this time.
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLocationModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleChangeLocation}
                disabled={!selectedLocationId || !locations.length}
                className={`px-4 py-2 bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-md transition-colors ${
                  (!selectedLocationId || !locations.length) 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:from-rose-500 hover:to-pink-600'
                }`}
              >
                Update Location
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </ShopClosureOverlay>
  );
};

export default Cart;
