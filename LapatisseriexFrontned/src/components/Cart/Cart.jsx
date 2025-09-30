import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTrash, FaArrowLeft, FaMapMarkerAlt, FaTag, FaShoppingCart, FaExclamationTriangle } from 'react-icons/fa';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { useLocation } from '../../context/LocationContext/LocationContext';
import { useShopStatus } from '../../context/ShopStatusContext';
import ShopClosureOverlay from '../common/ShopClosureOverlay';

const Cart = () => {
  const { isOpen, checkShopStatusNow } = useShopStatus();
  const { cartItems, cartTotal, cartCount, updateQuantity, removeFromCart, clearCart } = useCart();
  
  // Use our hooks
  const { user } = useAuth();
  const { 
    locations,
    loading: locationsLoading,
    updateUserLocation,
    getCurrentLocationName,
    hasValidDeliveryLocation
  } = useLocation();
  
  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const [couponError, setCouponError] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  
  const navigate = useNavigate();

  // Delivery charge (free above 500, else 49)
  const deliveryCharge = cartTotal >= 500 ? 0 : 49;
  
  // Tax calculation (5% of total)
  const taxAmount = cartTotal * 0.05;
  
  // Grand total
  const grandTotal = cartTotal + deliveryCharge + taxAmount - couponDiscount;

  const handleQuantityChange = (productId, newQuantity) => {
    updateQuantity(productId, newQuantity);
  };

  // Simple coupon system (you can enhance this later)
  const availableCoupons = {
    'WELCOME10': { discount: 50, minOrder: 200 },
    'SAVE20': { discount: 100, minOrder: 500 },
    'FIRST50': { discount: 150, minOrder: 800 }
  };

  // Handle coupon application
  const applyCoupon = (code) => {
    const coupon = availableCoupons[code.toUpperCase()];
    if (!coupon) {
      return { success: false, message: 'Invalid coupon code' };
    }
    if (cartTotal < coupon.minOrder) {
      return { success: false, message: `Minimum order of ₹${coupon.minOrder} required` };
    }
    setAppliedCoupon(code.toUpperCase());
    setCouponDiscount(coupon.discount);
    return { success: true, message: `Coupon applied! You saved ₹${coupon.discount}` };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
  };
  
  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      setCouponMessage('Please enter a coupon code');
      setCouponError(true);
      return;
    }
    
    const result = applyCoupon(couponCode);
    setCouponMessage(result.message);
    setCouponError(!result.success);
    
    // Clear message after 3 seconds
    setTimeout(() => {
      setCouponMessage('');
    }, 3000);
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
      // Check shop status before proceeding
      const currentStatus = await checkShopStatusNow();
      
      if (!currentStatus.isOpen) {
        // Shop is closed, the UI will show the overlay
        return;
      }
      
      navigate('/reservedmethod');
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
            <h2 className="text-2xl font-semibold text-black mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Looks like you haven't added any items to your cart yet</p>
            <Link 
              to="/products" 
              className="bg-gradient-to-r from-rose-400 to-pink-500 text-white font-medium py-3 px-8 rounded-md hover:from-rose-500 hover:to-pink-600 transition-all duration-300 shadow-md hover:shadow-lg"
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
      <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Back button - hidden on mobile, visible on desktop with top padding */}
        <div className="hidden md:flex items-center mb-6 pt-4">
          <Link to="/products" className="flex items-center text-black hover:text-gray-600 transition-colors">
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
                      <h2 className="font-semibold text-lg text-black">Cart Items ({cartItems.length})</h2>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <FaMapMarkerAlt className={`${hasValidDeliveryLocation() ? 'text-gray-500' : 'text-amber-500'} mr-1`} />
                      <span className="mr-2">{user?.location ? `${user.location.area}, ${user.location.city}` : 'Select Location'}</span>
                    </div>
                  </div>
                  <button 
                    className="text-black hover:text-blue-600 transition-colors text-sm font-medium"
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
                {cartItems.map((item) => (
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
                        <h3 className="font-medium text-black text-sm md:text-base pr-2">{item.name || 'Product'}</h3>
                        <button 
                          onClick={() => {
                            console.log('🗑️ Deleting cart item:', item.productId);
                            removeFromCart(item.productId);
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                        >
                          <FaTrash />
                        </button>
                      </div>
                      
                      {/* Quantity controls and price - mobile optimized */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <button 
                            onClick={() => {
                              console.log('➖ Decreasing quantity for:', item.productId, 'from', item.quantity, 'to', item.quantity - 1);
                              handleQuantityChange(item.productId, item.quantity - 1);
                            }}
                            className="w-7 h-7 md:w-8 md:h-8 rounded-l-md bg-gray-100 flex items-center justify-center border border-gray-200 text-sm"
                          >
                            -
                          </button>
                          <input
                            type="text"
                            className="w-8 h-7 md:w-10 md:h-8 text-center text-xs md:text-sm border-t border-b border-gray-200"
                            value={item.quantity}
                            readOnly
                          />
                          <button
                            onClick={() => {
                              console.log('➕ Increasing quantity for:', item.productId, 'from', item.quantity, 'to', item.quantity + 1);
                              handleQuantityChange(item.productId, item.quantity + 1);
                            }}
                            className="w-7 h-7 md:w-8 md:h-8 rounded-r-md bg-gray-100 flex items-center justify-center border border-gray-200 text-sm"
                          >
                            +
                          </button>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-medium text-black text-sm md:text-base">₹{Math.round(item.price * item.quantity)}</div>
                          <div className="text-xs md:text-sm text-gray-500">₹{Math.round(item.price)} each</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-[130px] md:top-[140px]">
              <h2 className="font-semibold text-lg text-black pb-4 border-b border-gray-200 mb-4">
                Order Summary
              </h2>
              
              {/* Coupon Code */}
              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <FaTag className="text-gray-600 mr-2" />
                  <h3 className="font-medium">Have a coupon?</h3>
                </div>
                
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 p-3 rounded-md">
                    <div>
                      <span className="font-medium text-green-700">{appliedCoupon}</span>
                      <p className="text-xs text-green-600">
                        Coupon applied successfully!
                      </p>
                    </div>
                    <button 
                      onClick={removeCoupon}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex">
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                      />
                      <button
                        onClick={handleApplyCoupon}
                        className="bg-gradient-to-r from-rose-400 to-pink-500 text-white px-4 py-2 rounded-r-md hover:from-rose-500 hover:to-pink-600 transition-all duration-300"
                      >
                        Apply
                      </button>
                    </div>
                    {couponMessage && (
                      <p className={`text-xs mt-1 ${couponError ? 'text-red-500' : 'text-green-500'}`}>
                        {couponMessage}
                      </p>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      Try: WELCOME10, SAVE20, FIRST50
                    </div>
                  </div>
                )}
              </div>
              
              {/* Price Breakdown */}
              <div className="space-y-3 text-gray-700">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium">₹{cartTotal}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  <span className="font-medium">
                    {deliveryCharge === 0 ? (
                      <span className="text-green-500">Free</span>
                    ) : (
                      `₹${deliveryCharge}`
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Tax (5%)</span>
                  <span className="font-medium">₹{taxAmount.toFixed(2)}</span>
                </div>
                
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon Discount</span>
                    <span className="font-medium">-₹{couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{grandTotal.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    (Including all taxes)
                  </p>
                </div>
              </div>
              
              {/* Checkout Buttons */}
              <div className="mt-6">
                <button 
                  onClick={handleCheckout}
                  className={`w-full bg-gradient-to-r from-rose-400 to-pink-500 text-white font-medium py-3 rounded-md mb-3 ${
                    hasValidDeliveryLocation() ? 'hover:from-rose-500 hover:to-pink-600 transition-all duration-300 shadow-md hover:shadow-lg' : 'opacity-80 cursor-not-allowed'
                  }`}
                >
                  Proceed to Checkout
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
