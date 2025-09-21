import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaMapMarkerAlt, FaCreditCard, FaWallet, FaExclamationTriangle } from 'react-icons/fa';
import { BsCashCoin } from 'react-icons/bs';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { useLocation } from '../../context/LocationContext/LocationContext';
import { useShopStatus } from '../../context/ShopStatusContext';
import ShopClosureOverlay from '../common/ShopClosureOverlay';

const Payment = () => {
  const { isOpen, checkShopStatusNow } = useShopStatus();
  const { cartItems, cartTotal, couponDiscount, clearCart } = useCart();
  const { user } = useAuth();
  const { hasValidDeliveryLocation, getCurrentLocationName, locations } = useLocation();
  const navigate = useNavigate();
  const [showLocationError, setShowLocationError] = useState(false);
  
  // Check for valid delivery location and handle gracefully
  useEffect(() => {
    console.log('Payment component - checking delivery location');
    console.log('User:', user);
    console.log('Cart Items:', cartItems);
    console.log('Cart Total:', cartTotal);
    console.log('Has valid delivery location:', hasValidDeliveryLocation());
    console.log('Current location name:', getCurrentLocationName());
    
    // For testing, let's temporarily bypass location validation when no user is logged in
    const bypassLocationCheck = !user; // If no user is logged in, bypass location check
    
    if (!bypassLocationCheck && !hasValidDeliveryLocation()) {
      console.log('No valid delivery location found');
      setShowLocationError(true);
      // Don't redirect immediately, show error message instead
      // navigate('/cart');
    } else {
      setShowLocationError(false);
    }
  }, [hasValidDeliveryLocation, navigate, user, cartItems, cartTotal]);
  
  // Delivery charge (free above 500, else 49)
  const deliveryCharge = cartTotal >= 500 ? 0 : 49;
  
  // Tax calculation (5% of total)
  const taxAmount = cartTotal * 0.05;
  
  // Grand total
  const grandTotal = cartTotal + deliveryCharge + taxAmount - couponDiscount;

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    nameOnCard: '',
    expiryDate: '',
    cvv: '',
  });
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOrderComplete, setIsOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'cardNumber') {
      // Format card number with spaces
      const formatted = value.replace(/\s/g, '')
        .replace(/(\d{4})/g, '$1 ')
        .trim();
      setCardDetails({
        ...cardDetails,
        cardNumber: formatted,
      });
    } else {
      setCardDetails({
        ...cardDetails,
        [name]: value,
      });
    }
  };

  const validateCardDetails = () => {
    if (selectedPaymentMethod === 'card') {
      if (cardDetails.cardNumber.length < 19) return false; // 16 digits + 3 spaces
      if (!cardDetails.nameOnCard) return false;
      if (!cardDetails.expiryDate) return false;
      if (cardDetails.cvv.length < 3) return false;
    } else if (selectedPaymentMethod === 'upi') {
      if (!upiId.includes('@')) return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check shop status in real-time before processing payment
    const currentStatus = await checkShopStatusNow();
    
    if (!currentStatus.isOpen) {
      // Shop is now closed, UI will update automatically
      return;
    }
    
    if (!validateCardDetails()) {
      alert('Please fill all the required fields correctly');
      return;
    }
    
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsOrderComplete(true);
      setOrderNumber(`ORD${Math.floor(100000 + Math.random() * 900000)}`);
      clearCart();
    }, 2000);
  };

  if (isOrderComplete) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaCheckCircle className="text-green-500 text-4xl" />
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Order Successful!</h2>
            <p className="text-black mb-1">Thank you for your purchase</p>
            <p className="text-black text-sm mb-6">Your order has been placed successfully</p>
            
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <p className="text-black font-medium">Order Number:</p>
              <p className="text-2xl font-bold text-black tracking-wide">{orderNumber}</p>
            </div>
            
            <p className="text-black mb-6">
              We have sent you an email with the order details and tracking information.
              You will also receive updates about your order status.
            </p>
            
            <div className="flex flex-col md:flex-row justify-center gap-4">
              <Link 
                to="/" 
                className="px-8 py-3 bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-colors"
              >
                Return to Homepage
              </Link>
              <Link 
                to="/products" 
                className="px-8 py-3 border border-white text-black font-medium rounded-md hover:bg-gray-100 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show location error if no valid delivery location
  if (showLocationError) {
    return (
      <div className="container mx-auto px-4 py-8 pt-8 min-h-screen">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-6">
            <Link to="/cart" className="flex items-center text-black hover:text-black transition-colors">
              <FaArrowLeft className="mr-2" />
              <span>Back to Cart</span>
            </Link>
            <h1 className="text-2xl font-bold text-center flex-grow">Checkout</h1>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaExclamationTriangle className="text-red-500 text-4xl" />
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Delivery Location Required</h2>
            <p className="text-black mb-6">
              Please select a delivery location to proceed with checkout.
            </p>
            
            <div className="space-y-4">
              <Link 
                to="/cart" 
                className="block w-full px-6 py-3 bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-colors"
              >
                Go Back to Cart
              </Link>
              <p className="text-sm text-black">
                You can select your delivery location from the cart page.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ShopClosureOverlay overlayType="page" showWhenClosed={!isOpen}>
      <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center mb-6">
          <Link to="/cart" className="flex items-center text-black hover:text-black transition-colors">
            <FaArrowLeft className="mr-2" />
            <span>Back to Cart</span>
          </Link>
          <h1 className="text-2xl font-bold text-center flex-grow">Checkout</h1>
        </div>
        
        {/* Delivery Location Info */}
        {user && hasValidDeliveryLocation() && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <FaMapMarkerAlt className="text-green-600 mr-2" />
              <div>
                <p className="text-green-800 font-medium">Delivering to:</p>
                <p className="text-green-700">{getCurrentLocationName()}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-8 mb-8 lg:mb-0">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="font-semibold text-lg text-black pb-4 border-b border-white mb-4">
                Shipping Address
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-black text-sm font-medium mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-white rounded-md focus:outline-none focus:ring-1 focus:ring-white focus:border-white"
                      placeholder="First Name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-black text-sm font-medium mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-white rounded-md focus:outline-none focus:ring-1 focus:ring-white focus:border-white"
                      placeholder="Last Name"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-black text-sm font-medium mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-white rounded-md focus:outline-none focus:ring-1 focus:ring-white focus:border-white mb-2"
                    placeholder="House number and street name"
                    required
                  />
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-white rounded-md focus:outline-none focus:ring-1 focus:ring-white focus:border-white"
                    placeholder="Apartment, suite, unit, etc. (optional)"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-black text-sm font-medium mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-white rounded-md focus:outline-none focus:ring-1 focus:ring-white focus:border-white"
                      placeholder="City"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-black text-sm font-medium mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-white rounded-md focus:outline-none focus:ring-1 focus:ring-white focus:border-white"
                      placeholder="State"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-black text-sm font-medium mb-2">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-white rounded-md focus:outline-none focus:ring-1 focus:ring-white focus:border-white"
                      placeholder="Postal Code"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-black text-sm font-medium mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border border-white rounded-md focus:outline-none focus:ring-1 focus:ring-white focus:border-white"
                    placeholder="Phone Number"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-black text-sm font-medium mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-white rounded-md focus:outline-none focus:ring-1 focus:ring-white focus:border-white"
                    placeholder="Email Address"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="font-semibold text-lg text-black pb-4 border-b border-white mb-4">
                Payment Method
              </h2>
              
              <div className="space-y-6">
                <div className="flex space-x-4">
                  <div 
                    onClick={() => setSelectedPaymentMethod('card')}
                    className={`flex-1 p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedPaymentMethod === 'card' 
                        ? 'border-white bg-pink-50' 
                        : 'border-white hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center mb-3">
                      <FaCreditCard className={`mr-2 ${selectedPaymentMethod === 'card' ? 'text-black' : 'text-black'}`} />
                      <span className="font-medium">Credit/Debit Card</span>
                    </div>
                    <div className="flex space-x-2">
                      <img src="https://cdn-icons-png.flaticon.com/512/196/196578.png" alt="Visa" className="h-6" />
                      <img src="https://cdn-icons-png.flaticon.com/512/196/196561.png" alt="MasterCard" className="h-6" />
                      <img src="https://cdn-icons-png.flaticon.com/512/196/196539.png" alt="American Express" className="h-6" />
                    </div>
                  </div>
                  
                  <div 
                    onClick={() => setSelectedPaymentMethod('upi')}
                    className={`flex-1 p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedPaymentMethod === 'upi' 
                        ? 'border-white bg-pink-50' 
                        : 'border-white hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center mb-3">
                      <FaWallet className={`mr-2 ${selectedPaymentMethod === 'upi' ? 'text-black' : 'text-black'}`} />
                      <span className="font-medium">UPI Payment</span>
                    </div>
                    <div className="flex space-x-2">
                      <img src="https://cdn-icons-png.flaticon.com/512/270/270799.png" alt="UPI" className="h-6" />
                    </div>
                  </div>
                  
                  <div 
                    onClick={() => setSelectedPaymentMethod('cod')}
                    className={`flex-1 p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedPaymentMethod === 'cod' 
                        ? 'border-white bg-pink-50' 
                        : 'border-white hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center mb-3">
                      <BsCashCoin className={`mr-2 ${selectedPaymentMethod === 'cod' ? 'text-black' : 'text-black'}`} />
                      <span className="font-medium">Cash on Delivery</span>
                    </div>
                    <p className="text-xs text-black">
                      Pay when your order arrives
                    </p>
                  </div>
                </div>
                
                {selectedPaymentMethod === 'card' && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-black text-sm font-medium mb-2">
                        Card Number *
                      </label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={cardDetails.cardNumber}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-white rounded-md focus:outline-none focus:ring-1 focus:ring-white focus:border-white"
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-black text-sm font-medium mb-2">
                        Name on Card *
                      </label>
                      <input
                        type="text"
                        name="nameOnCard"
                        value={cardDetails.nameOnCard}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-white rounded-md focus:outline-none focus:ring-1 focus:ring-white focus:border-white"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-black text-sm font-medium mb-2">
                          Expiry Date *
                        </label>
                        <input
                          type="text"
                          name="expiryDate"
                          value={cardDetails.expiryDate}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-white rounded-md focus:outline-none focus:ring-1 focus:ring-white focus:border-white"
                          placeholder="MM/YY"
                          maxLength="5"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-black text-sm font-medium mb-2">
                          CVV *
                        </label>
                        <input
                          type="password"
                          name="cvv"
                          value={cardDetails.cvv}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-white rounded-md focus:outline-none focus:ring-1 focus:ring-white focus:border-white"
                          placeholder="***"
                          maxLength="4"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className={`w-full py-3 text-white font-medium rounded-md ${
                          isProcessing 
                            ? 'bg-white cursor-not-allowed' 
                            : 'bg-white hover:bg-gray-800'
                        } transition-colors flex items-center justify-center`}
                      >
                        {isProcessing ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          `Pay ₹${grandTotal.toFixed(2)}`
                        )}
                      </button>
                    </div>
                  </form>
                )}
                
                {selectedPaymentMethod === 'upi' && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-black text-sm font-medium mb-2">
                        UPI ID *
                      </label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full px-3 py-2 border border-white rounded-md focus:outline-none focus:ring-1 focus:ring-white focus:border-white"
                        placeholder="name@upi"
                        required
                      />
                    </div>
                    
                    <div>
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className={`w-full py-3 text-white font-medium rounded-md ${
                          isProcessing 
                            ? 'bg-white cursor-not-allowed' 
                            : 'bg-white hover:bg-gray-800'
                        } transition-colors flex items-center justify-center`}
                      >
                        {isProcessing ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          `Pay ₹${grandTotal.toFixed(2)}`
                        )}
                      </button>
                    </div>
                  </form>
                )}
                
                {selectedPaymentMethod === 'cod' && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                      <p className="text-yellow-700 text-sm">
                        You will pay ₹{grandTotal.toFixed(2)} when your order is delivered.
                        Please keep the exact amount ready to ensure a smooth delivery experience.
                      </p>
                    </div>
                    
                    <div>
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className={`w-full py-3 text-white font-medium rounded-md ${
                          isProcessing 
                            ? 'bg-white cursor-not-allowed' 
                            : 'bg-white hover:bg-gray-800'
                        } transition-colors flex items-center justify-center`}
                      >
                        {isProcessing ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          `Place Order - ₹${grandTotal.toFixed(2)}`
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h2 className="font-semibold text-lg text-black pb-4 border-b border-white mb-4">
                Order Summary
              </h2>
              
              <div className="max-h-[300px] overflow-y-auto mb-4 pr-2">
                {cartItems.map((item) => (
                  <div key={`${item.id || item._id}-${JSON.stringify(item.options)}`} className="flex items-center py-3 border-b border-white">
                    <div className="w-16 h-16 flex-shrink-0">
                      <img 
                        src={item.image || (item.images && item.images[0]) || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iI0Q1RDlERCIvPgo8L3N2Zz4K'} 
                        alt={item.name} 
                        className="w-full h-full object-cover rounded-md"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iI0Q1RDlERCIvPgo8L3N2Zz4K';
                        }}
                      />
                    </div>
                    <div className="ml-3 flex-grow">
                      <p className="text-sm font-medium">{item.name}</p>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-black">
                          {item.options.weight && `${item.options.weight} • `}
                          {item.options.flavor && `${item.options.flavor}`}
                        </p>
                        <div className="text-xs">
                          <span className="font-medium">₹{item.price}</span>
                          <span className="text-black"> × {item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2 text-black">
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
            </div>
          </div>
        </div>
        </div>
      </div>
    </ShopClosureOverlay>
  );
};

export default Payment;





