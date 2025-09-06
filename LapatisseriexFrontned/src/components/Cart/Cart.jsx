import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTrash, FaArrowLeft, FaMapMarkerAlt, FaTag, FaShoppingCart } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import { useContext } from 'react';
import { AuthContext } from '../../App';

const Cart = () => {
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
  
  const { userLocation, setUserLocation } = useContext(AuthContext);
  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const [couponError, setCouponError] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [newLocation, setNewLocation] = useState(userLocation);
  
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
  const handleChangeLocation = () => {
    setUserLocation(newLocation);
    setShowLocationModal(false);
  };
  
  // Handle checkout
  const handleCheckout = () => {
    navigate('/payment');
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
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Looks like you haven't added any items to your cart yet</p>
            <Link 
              to="/products" 
              className="bg-cakePink text-white font-medium py-3 px-8 rounded-md hover:bg-pink-700 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-6">
          <Link to="/products" className="flex items-center text-gray-600 hover:text-cakePink transition-colors">
            <FaArrowLeft className="mr-2" />
            <span>Continue Shopping</span>
          </Link>
          <h1 className="text-2xl font-bold text-center flex-grow">Shopping Cart</h1>
        </div>
        
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-8 mb-8 lg:mb-0">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-6">
                <h2 className="font-semibold text-lg text-gray-800">Cart Items ({cartItems.length})</h2>
                <div className="flex items-center text-sm">
                  <FaMapMarkerAlt className="text-cakePink mr-1" />
                  <span className="mr-2">{userLocation}</span>
                  <button 
                    className="text-cakePink hover:underline"
                    onClick={() => setShowLocationModal(true)}
                  >
                    Change
                  </button>
                </div>
              </div>
              
              {/* Cart item list */}
              <div className="space-y-6">
                {cartItems.map((item) => (
                  <div key={`${item.id}-${JSON.stringify(item.options)}`} className="flex flex-col md:flex-row border-b border-gray-200 pb-6">
                    <div className="md:w-1/4 mb-4 md:mb-0">
                      <img 
                        src={item.images[0]} 
                        alt={item.name} 
                        className="w-full h-32 object-cover rounded-md"
                      />
                    </div>
                    <div className="md:w-3/4 md:pl-6">
                      <div className="flex justify-between mb-2">
                        <h3 className="font-medium text-gray-800">{item.name}</h3>
                        <button 
                          onClick={() => removeFromCart(item.id, item.options)}
                          className="text-gray-500 hover:text-red-500 transition-colors"
                        >
                          <FaTrash />
                        </button>
                      </div>
                      
                      <div className="mb-4">
                        {item.options.weight && (
                          <p className="text-sm text-gray-600">Weight: {item.options.weight}</p>
                        )}
                        {item.options.flavor && (
                          <p className="text-sm text-gray-600">Flavor: {item.options.flavor}</p>
                        )}
                        {item.options.message && (
                          <p className="text-sm text-gray-600">Message: "{item.options.message}"</p>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1, item.options)}
                            className="w-8 h-8 rounded-l-md bg-gray-100 flex items-center justify-center border border-gray-300"
                          >
                            -
                          </button>
                          <input
                            type="text"
                            className="w-10 h-8 text-center text-sm border-t border-b border-gray-300"
                            value={item.quantity}
                            readOnly
                          />
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.options)}
                            className="w-8 h-8 rounded-r-md bg-gray-100 flex items-center justify-center border border-gray-300"
                          >
                            +
                          </button>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-medium text-gray-800">₹{item.price * item.quantity}</div>
                          <div className="text-sm text-gray-500">₹{item.price} each</div>
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
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h2 className="font-semibold text-lg text-gray-800 pb-4 border-b border-gray-200 mb-4">
                Order Summary
              </h2>
              
              {/* Coupon Code */}
              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <FaTag className="text-gray-500 mr-2" />
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
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-cakePink focus:border-cakePink"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                      />
                      <button
                        onClick={handleApplyCoupon}
                        className="bg-gray-800 text-white px-4 py-2 rounded-r-md hover:bg-gray-700 transition-colors"
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
                      Try: SWEET10, WELCOME20, FLAT100
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
                  className="w-full bg-cakePink text-white font-medium py-3 rounded-md hover:bg-pink-700 transition-colors mb-3"
                >
                  Proceed to Checkout
                </button>
                <Link 
                  to="/payment" 
                  className="w-full block text-center bg-gray-800 text-white font-medium py-3 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Buy Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Update Delivery Location</h3>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Delivery Address
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cakePink focus:border-cakePink"
                placeholder="Enter your delivery location"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLocationModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleChangeLocation}
                className="px-4 py-2 bg-cakePink text-white rounded-md hover:bg-pink-700 transition-colors"
              >
                Update Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
