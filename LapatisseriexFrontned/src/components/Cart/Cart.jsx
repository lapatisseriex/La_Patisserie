import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTrash, FaArrowLeft, FaMapMarkerAlt, FaTag, FaShoppingCart, FaExclamationTriangle } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { useLocation } from '../../context/LocationContext/LocationContext';
import { useShopStatus } from '../../context/ShopStatusContext';
import ShopClosureOverlay from '../common/ShopClosureOverlay';

const Cart = () => {
  const { isOpen, checkShopStatusNow } = useShopStatus();
  const { 
    cartItems, 
    cartTotal, 
    updateQuantity, 
    removeFromCart, 
    applyCoupon,
    removeCoupon,
    appliedCoupon,
    couponDiscount
  } = useCart();
  
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
  
  const navigate = useNavigate();

  // Delivery charge (free above 500, else 49)
  const deliveryCharge = cartTotal >= 500 ? 0 : 49;
  
  // Tax calculation (5% of total)
  const taxAmount = cartTotal * 0.05;
  
  // Grand total
  const grandTotal = cartTotal + deliveryCharge + taxAmount - couponDiscount;
  
  // Handle coupon application
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
    // First check if shop is still open in real-time
    const currentStatus = await checkShopStatusNow();
    
    if (!currentStatus.isOpen) {
      // Shop is now closed, the UI should update automatically
      return;
    }
    
    if (hasValidDeliveryLocation()) {
      navigate('/payment');
    } else {
      setShowLocationModal(true);
    }
  };
  
  // If cart is empty
  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="text-center py-10">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
              <FaShoppingCart className="text-white text-4xl" />
            </div>
            <h2 className="text-2xl font-semibold text-black mb-2">Your cart is empty</h2>
            <p className="text-black mb-8">Looks like you haven't added any items to your cart yet</p>
            <Link 
              to="/products" 
              className="bg-black text-white font-medium py-3 px-8 rounded-md transition-colors"
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
        <div className="flex items-center mb-6">
          <Link to="/products" className="flex items-center text-black transition-colors">
            <FaArrowLeft className="mr-2" />
            <span>Continue Shopping</span>
          </Link>
          <h1 className="text-2xl font-bold text-center flex-grow">Shopping Box</h1>
        </div>
        
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-8 mb-8 lg:mb-0">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center pb-4 border-b border-white mb-6">
                <h2 className="font-semibold text-lg text-black">Cart Items ({cartItems.length})</h2>
                <div className="flex items-center text-sm">
                  <FaMapMarkerAlt className={`${hasValidDeliveryLocation() ? 'text-black' : 'text-amber-500'} mr-1`} />
                  <span className="mr-2">{user?.location ? `${user.location.area}, ${user.location.city}` : 'Select Location'}</span>
                  <button 
                    className="text-black"
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
                  <div key={`${item._id || item.id}-${JSON.stringify(item.options)}`} className="flex flex-col md:flex-row border-b border-white pb-6">
                    <div className="md:w-1/4 mb-4 md:mb-0">
                      <img 
                        src={item.productSnapshot?.image || item.product?.images?.[0] || '/placeholder-image.jpg'} 
                        alt={item.productSnapshot?.name || item.product?.name || 'Product'} 
                        className="w-full h-32 object-cover rounded-md"
                      />
                    </div>
                    <div className="md:w-3/4 md:pl-6">
                      <div className="flex justify-between mb-2">
                        <h3 className="font-medium text-black">{item.productSnapshot?.name || item.product?.name || 'Product'}</h3>
                        <button 
                          onClick={() => removeFromCart(item._id || item.id, item.options)}
                          className="text-black hover:text-red-500 transition-colors"
                        >
                          <FaTrash />
                        </button>
                      </div>
                      
                      <div className="mb-4">
                        {item.options?.weight && (
                          <p className="text-sm text-black">Weight: {item.options.weight}</p>
                        )}
                        {item.options?.flavor && (
                          <p className="text-sm text-black">Flavor: {item.options.flavor}</p>
                        )}
                        {item.options?.message && (
                          <p className="text-sm text-black">Message: "{item.options.message}"</p>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <button 
                            onClick={() => updateQuantity(item._id || item.id, item.quantity - 1, item.options)}
                            className="w-8 h-8 rounded-l-md bg-white flex items-center justify-center border border-white"
                          >
                            -
                          </button>
                          <input
                            type="text"
                            className="w-10 h-8 text-center text-sm border-t border-b border-white"
                            value={item.quantity}
                            readOnly
                          />
                          <button
                            onClick={() => updateQuantity(item._id || item.id, item.quantity + 1, item.options)}
                            className="w-8 h-8 rounded-r-md bg-white flex items-center justify-center border border-white"
                          >
                            +
                          </button>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-medium text-black">₹{Math.round((item.productSnapshot?.price || item.product?.variants?.[0]?.price || 0) * item.quantity)}</div>
                          <div className="text-sm text-black">₹{Math.round(item.productSnapshot?.price || item.product?.variants?.[0]?.price || 0)} each</div>
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
              <h2 className="font-semibold text-lg text-black pb-4 border-b border-white mb-4">
                Order Summary
              </h2>
              
              {/* Coupon Code */}
              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <FaTag className="text-black mr-2" />
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
                        className="flex-grow px-3 py-2 border border-white rounded-l-md focus:outline-none focus:ring-1 focus:ring-white focus:border-white"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                      />
                      <button
                        onClick={handleApplyCoupon}
                        className="bg-black text-white px-4 py-2 rounded-r-md transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                    {couponMessage && (
                      <p className={`text-xs mt-1 ${couponError ? 'text-red-500' : 'text-green-500'}`}>
                        {couponMessage}
                      </p>
                    )}
                    <div className="text-xs text-black mt-2">
                      Try: SWEET10, WELCOME20, FLAT100
                    </div>
                  </div>
                )}
              </div>
              
              {/* Price Breakdown */}
              <div className="space-y-3 text-black">
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
                
                <div className="border-t border-white pt-3 mt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{grandTotal.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-black mt-1">
                    (Including all taxes)
                  </p>
                </div>
              </div>
              
              {/* Checkout Buttons */}
              <div className="mt-6">
                <button 
                  onClick={handleCheckout}
                  className={`w-full bg-black text-white font-medium py-3 rounded-md transition-colors mb-3 ${
                    hasValidDeliveryLocation() ? 'hover:bg-gray-800' : 'opacity-80 cursor-not-allowed'
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
              <p className="text-sm text-black mb-3">
                We currently deliver to the following locations:
              </p>
              
              {locationsLoading ? (
                <div className="py-4 text-center text-black">Loading locations...</div>
              ) : locations.length > 0 ? (
                <div className="max-h-60 overflow-y-auto border border-white rounded-md">
                  {locations.map(location => (
                    <div 
                      key={location._id}
                      className={`p-3 border-b border-white last:border-0 cursor-pointer ${
                        selectedLocationId === location._id ? 'bg-pink-50' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => setSelectedLocationId(location._id)}
                    >
                      <div className="flex items-start">
                        <input 
                          type="radio"
                          name="location"
                          className="mt-1 text-black focus:ring-white"
                          checked={selectedLocationId === location._id}
                          onChange={() => setSelectedLocationId(location._id)}
                        />
                        <div className="ml-3">
                          <p className="font-medium text-black">{location.area}</p>
                          <p className="text-sm text-black">{location.city}, {location.pincode}</p>
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
                className="px-4 py-2 border border-white rounded-md text-black transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleChangeLocation}
                disabled={!selectedLocationId || !locations.length}
                className={`px-4 py-2 bg-black text-white rounded-md transition-colors ${
                  (!selectedLocationId || !locations.length) 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-gray-800'
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






