import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaMapMarkerAlt, FaCreditCard, FaWallet, FaExclamationTriangle } from 'react-icons/fa';
import { BsCashCoin } from 'react-icons/bs';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../context/AuthContext/AuthContextRedux';
import { useLocation } from '../../context/LocationContext/LocationContext';
import { useShopStatus } from '../../context/ShopStatusContext';
import ShopClosureOverlay from '../common/ShopClosureOverlay';

const Payment = () => {
  const { isOpen, checkShopStatusNow } = useShopStatus();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { hasValidDeliveryLocation, getCurrentLocationName, locations } = useLocation();
  const navigate = useNavigate();
  const [showLocationError, setShowLocationError] = useState(false);
  
  // Coupon discount is managed locally in this component
  const [couponDiscount, setCouponDiscount] = useState(0);
  
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
  
  // Calculate discounted cart total - same logic as cart page
  const discountedCartTotal = useMemo(() => {
    const result = cartItems.reduce((total, item) => {
      const originalPrice = item.price; // ₹160
      const discountedPrice = originalPrice * 0.5; // 50% discount = ₹80
      return total + (discountedPrice * item.quantity);
    }, 0);
    
    console.log('Payment - Discounted total:', result, 'from items:', cartItems);
    return result;
  }, [cartItems]);

  // Calculate delivery charge based on user's location
  const deliveryCharge = useMemo(() => {
    // If cart total is above ₹500, delivery is free regardless of location
    if (discountedCartTotal >= 500) {
      return 0;
    }
    
    // Get user's selected location
    const userLocationId = user?.location?._id || user?.location?.locationId || user?.locationId;
    
    console.log('Payment - User:', user);
    console.log('Payment - User location:', user?.location);
    console.log('Payment - User location ID:', userLocationId);
    console.log('Payment - Available locations:', locations);
    
    // Try to get user location - first check if location object exists directly, then search in locations array
    const userLocation = user?.location || 
      (userLocationId && locations?.length > 0 && locations.find(loc => loc._id === userLocationId));
    
    console.log('Payment - Final user location:', userLocation);
    
    if (userLocation) {
      const charge = userLocation.deliveryCharge ?? 49; // Use nullish coalescing to handle 0 values
      console.log('Payment - Using delivery charge:', charge);
      return charge;
    }
    
    console.log('Payment - Using default delivery charge: 49');
    // Default delivery charge if no location selected
    return 49;
  }, [discountedCartTotal, user, locations]);
  
  // Tax calculation (5% of discounted total)
  const taxAmount = discountedCartTotal * 0.05;
  
  // Grand total using discounted cart total
  const grandTotal = discountedCartTotal + deliveryCharge + taxAmount - couponDiscount;

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('razorpay');
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

  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Create order on backend
  const createOrder = async (amount, paymentMethod = 'razorpay') => {
    try {
      console.log('Cart items structure for debugging:', cartItems);
      
      const orderData = {
        amount: Math.round(amount * 100), // Convert to paise
        currency: 'INR',
        receipt: `order_${Date.now()}`,
        paymentMethod,
        cartItems: cartItems.map(item => {
          console.log('Processing cart item:', item);
          return {
            productId: item.productId || item._id,
            productName: item.name,
            quantity: item.quantity,
            price: item.price,
            variantIndex: item.variantIndex || 0
          };
        }),
        userDetails: {
          name: user?.name || user?.displayName,
          email: user?.email,
          phone: user?.phone,
          city: user?.city,
          pincode: user?.pincode,
          country: user?.country || 'India'
        },
        deliveryLocation: getCurrentLocationName(),
        orderSummary: {
          cartTotal: cartTotal,
          discountedTotal: discountedCartTotal,
          deliveryCharge: deliveryCharge,
          taxAmount: taxAmount,
          couponDiscount: couponDiscount,
          grandTotal: grandTotal
        }
      };

      // Get authentication token from localStorage
      const authToken = localStorage.getItem('authToken');
      
      if (!authToken) {
        throw new Error('Authentication required. Please login again.');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  // Handle Razorpay Payment
  const handleRazorpayPayment = async () => {
    // Check shop status in real-time before processing payment
    const currentStatus = await checkShopStatusNow();
    
    if (!currentStatus.isOpen) {
      // Shop is now closed, UI will update automatically
      return;
    }

    if (!user) {
      alert('Please login to place an order');
      return;
    }

    setIsProcessing(true);

    try {
      // Load Razorpay script
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        alert('Failed to load payment gateway. Please try again.');
        setIsProcessing(false);
        return;
      }

      // Create order on backend
      const orderData = await createOrder(grandTotal, 'razorpay');

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'La Patisserie',
        description: 'Payment for your delicious order',
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch(`${import.meta.env.VITE_API_URL}/payments/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              setIsOrderComplete(true);
              setOrderNumber(verifyData.orderNumber);
              // Clear cart without restocking since stock already decremented on add/update
              clearCart({ restock: false });
            } else {
              alert('Payment verification failed. Please contact support.');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment verification failed. Please contact support.');
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: user?.name || user?.displayName || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#EAB308', // Yellow theme color
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to initiate payment. Please try again.');
      setIsProcessing(false);
    }
  };

  // Handle Cash on Delivery Order
  const handleCODOrder = async () => {
    // Check shop status in real-time before processing payment
    const currentStatus = await checkShopStatusNow();
    
    if (!currentStatus.isOpen) {
      // Shop is now closed, UI will update automatically
      return;
    }

    if (!user) {
      alert('Please login to place an order');
      return;
    }

    setIsProcessing(true);

    try {
  const orderData = await createOrder(grandTotal, 'cod');
      
      // For COD, directly mark order as placed
  setIsOrderComplete(true);
  setOrderNumber(orderData.orderNumber);
  // Clear cart without restocking since stock already decremented on add/update
  clearCart({ restock: false });
    } catch (error) {
      console.error('COD order error:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
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
                className="px-8 py-3 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-medium rounded-md hover:from-rose-500 hover:to-pink-600 transition-all duration-300 shadow-md hover:shadow-lg"
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
                className="block w-full px-6 py-3 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-medium rounded-md hover:from-rose-500 hover:to-pink-600 transition-all duration-300 shadow-md hover:shadow-lg"
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
              <h2 className="font-semibold text-lg text-black pb-4 border-b border-white mb-4 flex items-center">
                <FaMapMarkerAlt className="mr-2 text-yellow-600" />
                Delivery Address
              </h2>
              
              {user ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Name</p>
                      <p className="text-black font-medium">{user.name || user.displayName || 'Not provided'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Phone</p>
                      <p className="text-black font-medium">{user.phone || 'Not provided'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Email</p>
                      <p className="text-black font-medium">{user.email || 'Not provided'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">City</p>
                      <p className="text-black font-medium">{user.city || 'Not provided'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Postal Code</p>
                      <p className="text-black font-medium">{user.pincode || 'Not provided'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Country</p>
                      <p className="text-black font-medium">{user.country || 'India'}</p>
                    </div>
                  </div>
                  
                  {/* Current location display */}
                  {hasValidDeliveryLocation() && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-800 mb-1">Delivery Location</p>
                      <p className="text-green-700">{getCurrentLocationName()}</p>
                    </div>
                  )}
                  
                  {/* Edit profile link */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Link 
                      to="/profile" 
                      className="inline-flex items-center text-yellow-600 hover:text-yellow-700 font-medium transition-colors"
                    >
                      Edit Address Information
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">Please login to see your delivery address</p>
                  <button 
                    onClick={() => {
                      // You can implement opening the auth modal here
                      console.log('Open auth modal');
                    }}
                    className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    Login
                  </button>
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="font-semibold text-lg text-black pb-4 border-b border-white mb-4">
                Payment Method
              </h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Razorpay Payment */}
                  <div 
                    onClick={() => setSelectedPaymentMethod('razorpay')}
                    className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-300 ${
                      selectedPaymentMethod === 'razorpay' 
                        ? 'border-yellow-500 bg-yellow-50 shadow-lg' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center mb-4">
                      <FaCreditCard className={`mr-3 text-2xl ${selectedPaymentMethod === 'razorpay' ? 'text-yellow-600' : 'text-gray-600'}`} />
                      <div>
                        <h3 className="font-semibold text-lg text-gray-800">Online Payment</h3>
                        <p className="text-sm text-gray-600">Powered by Razorpay</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 mb-3">
                      <img src="https://cdn.razorpay.com/static/assets/logo/payment.svg" alt="Razorpay" className="h-6" />
                      <img src="https://cdn-icons-png.flaticon.com/512/196/196578.png" alt="Visa" className="h-6" />
                      <img src="https://cdn-icons-png.flaticon.com/512/196/196561.png" alt="MasterCard" className="h-6" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="h-6" />
                    </div>
                    
                    <div className="text-xs text-gray-600">
                      <div className="flex items-center mb-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Secure & Fast Payment
                      </div>
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Card, UPI, Net Banking & Wallets
                      </div>
                    </div>
                  </div>
                  
                  {/* Cash on Delivery */}
                  <div 
                    onClick={() => setSelectedPaymentMethod('cod')}
                    className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-300 ${
                      selectedPaymentMethod === 'cod' 
                        ? 'border-green-500 bg-green-50 shadow-lg' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center mb-4">
                      <BsCashCoin className={`mr-3 text-2xl ${selectedPaymentMethod === 'cod' ? 'text-green-600' : 'text-gray-600'}`} />
                      <div>
                        <h3 className="font-semibold text-lg text-gray-800">Cash on Delivery</h3>
                        <p className="text-sm text-gray-600">Pay when you receive</p>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Pay in cash to delivery person
                      </div>
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        No online payment required
                      </div>
                    </div>
                    
                    <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                      <strong>Note:</strong> Please keep exact change ready
                    </div>
                  </div>
                </div>
                
                {selectedPaymentMethod === 'razorpay' && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center mb-2">
                        <img src="https://cdn.razorpay.com/static/assets/logo/payment.svg" alt="Razorpay" className="h-6 mr-3" />
                        <span className="font-medium text-blue-800">Secure Payment Gateway</span>
                      </div>
                      <p className="text-blue-700 text-sm">
                        You will be redirected to Razorpay's secure payment gateway to complete your payment of ₹{grandTotal.toFixed(2)}.
                      </p>
                    </div>
                    
                    <button
                      onClick={handleRazorpayPayment}
                      disabled={isProcessing}
                      className={`w-full py-4 text-white font-medium rounded-lg transition-all duration-300 ${
                        isProcessing 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                      } flex items-center justify-center`}
                    >
                      {isProcessing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing Payment...
                        </>
                      ) : (
                        <>
                          <FaCreditCard className="mr-2" />
                          Pay ₹{grandTotal.toFixed(2)} with Razorpay
                        </>
                      )}
                    </button>
                  </div>
                )}
                
                {selectedPaymentMethod === 'cod' && (
                  <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center mb-2">
                        <BsCashCoin className="text-amber-600 mr-2 text-lg" />
                        <span className="font-medium text-amber-800">Cash on Delivery</span>
                      </div>
                      <p className="text-amber-700 text-sm">
                        You will pay ₹{grandTotal.toFixed(2)} in cash when your order is delivered.
                        Please keep the exact amount ready for a smooth delivery experience.
                      </p>
                    </div>
                    
                    <button
                      onClick={handleCODOrder}
                      disabled={isProcessing}
                      className={`w-full py-4 text-white font-medium rounded-lg transition-all duration-300 ${
                        isProcessing 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl'
                      } flex items-center justify-center`}
                    >
                      {isProcessing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Placing Order...
                        </>
                      ) : (
                        <>
                          <BsCashCoin className="mr-2" />
                          Place Order - ₹{grandTotal.toFixed(2)}
                        </>
                      )}
                    </button>
                  </div>
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
                          {(() => {
                            const opts = item.options || item.productDetails?.options || {};
                            const weight = opts.weight || item.productDetails?.weight || item.productDetails?.variant?.weight || '';
                            const flavor = opts.flavor || item.productDetails?.flavor || '';
                            const parts = [];
                            if (weight) parts.push(weight);
                            if (flavor) parts.push(flavor);
                            return parts.length ? parts.join(' • ') : null;
                          })()}
                        </p>
                        <div className="text-xs">
                          {(() => {
                            // Apply same 50% discount as cart
                            const originalPrice = item.price;
                            const discountedPrice = originalPrice * 0.5;
                            
                            return (
                              <div className="space-y-1">
                                <div>
                                  <span className="text-gray-500 line-through">₹{Math.round(originalPrice)}</span>
                                  <span className="font-medium text-green-600 ml-2">₹{Math.round(discountedPrice)}</span>
                                  <span className="text-black"> × {item.quantity}</span>
                                </div>
                                <div className="text-green-600 font-medium text-xs">50% OFF</div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2 text-black">
                {(() => {
                  // Simple calculation - 50% discount
                  const originalTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
                  const totalSavings = originalTotal * 0.5; // 50% savings
                  const discountedTotal = originalTotal - totalSavings;
                  
                  return (
                    <>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Original Price</span>
                        <span className="line-through">₹{Math.round(originalTotal)}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Discount Savings (50% OFF)</span>
                        <span className="font-medium">-₹{Math.round(totalSavings)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-medium">₹{Math.round(discountedTotal)}</span>
                      </div>
                    </>
                  );
                })()}
                
                <div className="flex justify-between">
                  <div>
                    <span>Delivery Charge</span>
                    {(() => {
                      const userLocation = user?.location || 
                        (user?.locationId && locations?.find(loc => loc._id === user.locationId));
                      
                      return userLocation ? (
                        <div className="text-xs text-gray-500">to {userLocation.area}</div>
                      ) : (
                        <div className="text-xs text-gray-500">default rate</div>
                      );
                    })()}
                  </div>
                  <span className="font-medium">
                    {deliveryCharge === 0 ? (
                      <span className="text-green-500">
                        Free
                        {discountedCartTotal >= 500 && (
                          <div className="text-xs">Orders ≥ ₹500</div>
                        )}
                      </span>
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





