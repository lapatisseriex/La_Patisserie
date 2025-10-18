import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaMapMarkerAlt, FaCreditCard, FaWallet, FaExclamationTriangle } from 'react-icons/fa';
import { BsCashCoin } from 'react-icons/bs';
import { Building, ChevronLeft } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../context/LocationContext/LocationContext';
import { useShopStatus } from '../../context/ShopStatusContext';
import ShopClosureOverlay from '../common/ShopClosureOverlay';
import { calculateCartTotals, calculatePricing, formatCurrency } from '../../utils/pricingUtils';
import api from '../../services/apiService';

const Payment = () => {
  const { isOpen, checkShopStatusNow } = useShopStatus();
  const { cartItems, cartTotal, clearCart, refreshCart } = useCart();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { hasValidDeliveryLocation, getCurrentLocationName, locations } = useLocation();
  const navigate = useNavigate();
  const [showLocationError, setShowLocationError] = useState(false);
  const [userDataLoaded, setUserDataLoaded] = useState(false);
  
    // Free cash state
  const [useFreeCash, setUseFreeCash] = useState(false);

  // Refresh cart data when component mounts to get latest product info
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Track user data loading
  useEffect(() => {
    // Mark user data as loaded when we have authentication result
    if (!authLoading) {
      setUserDataLoaded(true);
    }
  }, [user, authLoading, isAuthenticated]);

  // Check for valid delivery location and handle gracefully
  useEffect(() => {
    // For testing, let's temporarily bypass location validation when no user is logged in
    const bypassLocationCheck = !user; // If no user is logged in, bypass location check
    
    if (!bypassLocationCheck && typeof hasValidDeliveryLocation === 'function' && !hasValidDeliveryLocation()) {
      setShowLocationError(true);
      // Don't redirect immediately, show error message instead
      // navigate('/cart');
    } else {
      setShowLocationError(false);
    }
  }, [hasValidDeliveryLocation, navigate, user, cartItems, cartTotal]);
  
  // Calculate cart total using centralized pricing logic for consistency
  const cartTotalsData = useMemo(() => {
    // Use the same centralized cart total calculation as other components
    const totals = calculateCartTotals(cartItems);
    return totals;
  }, [cartItems]);

  const discountedCartTotal = useMemo(() => {
    const finalTotal = cartTotalsData.finalTotal || 0;
    return isNaN(finalTotal) ? 0 : finalTotal;
  }, [cartTotalsData]);

  // Calculate delivery charge based on user's location
  const deliveryCharge = useMemo(() => {
    // If cart total is above ₹500, delivery is free regardless of location
    if (discountedCartTotal >= 500) {
      return 0;
    }
    
    // Get user's selected location
    const userLocationId = user?.location?._id || user?.location?.locationId || user?.locationId;
    
    // Try to get user location - first check if location object exists directly, then search in locations array
    const userLocation = user?.location || 
      (userLocationId && locations?.length > 0 && locations.find(loc => loc._id === userLocationId));
    
    if (userLocation) {
      const charge = userLocation.deliveryCharge ?? 49; // Use nullish coalescing to handle 0 values
      return isNaN(charge) ? 49 : charge;
    }
    
    // Default delivery charge if no location selected
    return 49;
  }, [discountedCartTotal, user, locations]);
  
  // Calculate total free cash available from all cart items
  const totalFreeCashAvailable = useMemo(() => {
    const result = cartItems.reduce((total, item) => {
      try {
        // Access product details from cart item
        const productDetails = item.productDetails || item.product || item;
        const variantIndex = item.variantIndex || productDetails?.variantIndex || 0;
        
        // Get free cash from variant
        let freeCash = 0;
        if (productDetails?.variants && productDetails.variants[variantIndex]) {
          freeCash = parseFloat(productDetails.variants[variantIndex].freeCashExpected) || 0;
        }
        
        // Multiply by quantity and ensure it's a valid number
        const itemFreeCash = isNaN(freeCash) ? 0 : freeCash * item.quantity;
        return total + itemFreeCash;
      } catch (error) {
        console.warn('❌ Error calculating free cash for item:', item, error);
        return total;
      }
    }, 0);
    
    return isNaN(result) ? 0 : result;
  }, [cartItems]);
  
  // Applied free cash discount
  const appliedFreeCash = useFreeCash ? totalFreeCashAvailable : 0;
  
  // Grand total using discounted cart total and free cash
  const grandTotal = useMemo(() => {
    const total = discountedCartTotal + deliveryCharge - appliedFreeCash;
    return isNaN(total) ? 0 : Math.max(0, total); // Ensure total is never negative or NaN
  }, [discountedCartTotal, deliveryCharge, appliedFreeCash]);

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

  // Create order on backend using centralized api (handles auth + retries)
  const createOrder = async (amount, paymentMethod = 'razorpay') => {
    try {
      const orderData = {
        amount: Math.round(amount * 100), // Convert to paise
        currency: 'INR',
        receipt: `order_${Date.now()}`,
        paymentMethod,
        cartItems: cartItems.map(item => {
          // Use centralized pricing calculation for consistency
          const prod = item.productDetails;
          const vi = Number.isInteger(item?.productDetails?.variantIndex) ? item.productDetails.variantIndex : 0;
          const variant = prod?.variants?.[vi];
          
          // Get pricing using centralized utility
          const pricing = calculatePricing(variant);
          
          return {
            productId: item.productId || item._id,
            productName: item.name,
            quantity: item.quantity,
            price: pricing.finalPrice, // Use centralized pricing calculation
            originalPrice: pricing.mrp, // Use centralized MRP calculation
            variantIndex: item.variantIndex || 0
          };
        }),
        userDetails: {
          name: user?.name || user?.displayName,
          email: user?.email,
          phone: user?.phone,
          city: user?.location?.city || user?.city,
          pincode: user?.location?.pincode || user?.pincode,
          country: user?.country || 'India'
        },
        deliveryLocation: user?.location?.fullAddress || getCurrentLocationName(),
        hostelName: user?.hostel?.name || null,
        orderSummary: {
          cartTotal: discountedCartTotal,
          discountedTotal: discountedCartTotal,
          deliveryCharge: deliveryCharge,
          freeCashDiscount: appliedFreeCash,
          grandTotal: grandTotal
        }
      };

      const { data } = await api.post('/payments/create-order', orderData);
      return data;
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

      // Check if Razorpay key is configured
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        alert('Payment gateway not configured. Please contact support.');
        setIsProcessing(false);
        return;
      }

      const options = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'La Patisserie',
        description: 'Payment for your delicious order',
        order_id: orderData.orderId,
        handler: async (response) => {
          // ✅ Prevent multiple simultaneous verification calls
          if (window.__paymentVerifying) {
            console.log('⚠️ Payment verification already in progress, skipping duplicate call');
            return;
          }
          
          window.__paymentVerifying = true;
          
          try {
            console.log('✅ Payment successful, verifying...');
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
              console.log('✅ Payment verified successfully');
              setIsOrderComplete(true);
              setOrderNumber(verifyData.orderNumber);
              // Clear cart - no stock restoration needed since stock is decremented on payment success
              try {
                await clearCart();
                console.log('🧹 Cart cleared after successful payment');
              } catch (cartError) {
                console.error('❌ Failed to clear cart after payment:', cartError);
                // Don't fail the order, just log the error
              }
            } else {
              console.error('❌ Payment verification failed:', verifyData.message);
              alert('Payment verification failed. Please contact support with your order details.');
              
              // Refresh cart to show items are still there
              try {
                await refreshCart();
              } catch (refreshError) {
                console.error('❌ Failed to refresh cart:', refreshError);
              }
            }
          } catch (error) {
            console.error('❌ Payment verification error:', error);
            alert('Payment verification failed. Please contact support if amount was debited.');
            
            // Refresh cart in case of error
            try {
              await refreshCart();
            } catch (refreshError) {
              console.error('❌ Failed to refresh cart:', refreshError);
            }
          } finally {
            window.__paymentVerifying = false;
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
          ondismiss: async () => {
            console.log('🚫 Razorpay popup dismissed/cancelled by user');
            setIsProcessing(false);
            
            // Cancel the order on backend since payment was not completed
            try {
              const cancelResponse = await fetch(`${import.meta.env.VITE_API_URL}/payments/cancel-order`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${user?.token || localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                  razorpay_order_id: orderData.orderId,
                }),
              });
              
              const cancelData = await cancelResponse.json();
              
              if (cancelData.success) {
                console.log('✅ Order cancelled successfully on backend');
                
                // Refresh cart to show items are still there
                try {
                  await refreshCart();
                  console.log('🔄 Cart refreshed after cancellation');
                } catch (refreshError) {
                  console.error('❌ Failed to refresh cart:', refreshError);
                }
              } else {
                console.warn('⚠️ Order cancellation response:', cancelData.message);
              }
            } catch (error) {
              console.error('❌ Failed to cancel order:', error);
            }
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

    // Optimistic UI: show success immediately while we call backend
    setIsProcessing(true);
    setIsOrderComplete(true);
    setOrderNumber('...');

    try {
      const orderData = await createOrder(grandTotal, 'cod');
      // Reconcile with real order number
      setOrderNumber(orderData.orderNumber);
      // Clear cart - stock already decremented for COD on backend
      try {
        await clearCart();
      } catch (cartError) {
        console.error('❌ Failed to clear cart after COD order:', cartError);
      }
    } catch (error) {
      console.error('COD order error:', error);
      // Rollback optimistic state
      setIsOrderComplete(false);
      setOrderNumber('');
      alert('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isOrderComplete) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 min-h-screen">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-4 sm:p-8">
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaCheckCircle className="text-green-500 text-4xl" />
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Order Successful!</h2>
            <p className="bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent mb-1">Thank you for your purchase</p>
            <p className="bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent text-sm mb-6">Your order has been placed successfully</p>
            
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <p className="bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent text-sm">Order Number:</p>
                <button 
                  onClick={() => refreshCart()}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                >
                  Refresh Cart
                </button>
              </div>  <p className="bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent font-medium">Order Number:</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent tracking-wide">{orderNumber}</p>
            </div>
            
            <p className="bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent mb-6">
              We have sent you an email with the order details and tracking information.
              You will also receive updates about your order status.
            </p>
            
            <div className="flex flex-col md:flex-row justify-center gap-4">
              <style>{`
                .return-home-btn:hover span {
                  color: white !important;
                  background: none !important;
                  -webkit-background-clip: unset !important;
                  background-clip: unset !important;
                }
              `}</style>
              <Link 
                to="/" 
                className="return-home-btn px-8 py-3 bg-white border-2 border-[#733857] font-medium rounded-md hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span style={{
                  background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent'
                }}>Return to Homepage</span>
              </Link>
              <Link 
                to="/products" 
                className="px-8 py-3 border border-white bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent font-medium rounded-md hover:bg-gray-100 transition-colors"
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
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 pt-4 sm:pt-8 min-h-screen">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-4 sm:mb-6">
            <Link to="/checkout" className="hidden sm:flex items-center bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent hover:from-[#8d4466] hover:via-[#412434] hover:to-[#733857] transition-colors">
              <FaArrowLeft className="mr-2 text-[#733857]" />
              <span>Back to Checkout</span>
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-center flex-grow bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">Payment</h1>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaExclamationTriangle className="text-red-500 text-4xl" />
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Delivery Location Required</h2>
            <p className="bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent mb-6">
              Please select a delivery location to proceed with payment.
            </p>
            
            <div className="space-y-4">
              <Link 
                to="/checkout" 
                className="block w-full px-6 py-3 bg-white border-2 border-[#733857] text-[#733857] font-medium rounded-md hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] hover:text-white transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Go Back to Checkout
              </Link>
              <p className="text-sm bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">
                You can verify your delivery location from the checkout page.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ShopClosureOverlay overlayType="page" showWhenClosed={!isOpen}>
      {/* Simple Navigation Bar */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/checkout" className="flex items-center gap-3 text-gray-600 hover:text-[#733857] transition-colors">
              <ChevronLeft className="h-5 w-5" />
              <span className="font-medium">Back to Checkout</span>
            </Link>
            <div className="flex items-center gap-2">
              <img src="/images/logo.png" alt="La Patisserie" className="h-8 w-auto" />
              <span className="font-semibold text-[#733857]">La Patisserie</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center mb-4 sm:mb-6">
          <Link to="/checkout" className="hidden sm:flex items-center bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent hover:from-[#8d4466] hover:via-[#412434] hover:to-[#733857] transition-colors">
            <FaArrowLeft className="mr-2 text-[#733857]" />
            <span>Back to Checkout</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-center sm:text-center flex-grow bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">Payment</h1>
        </div>
        
        {/* Delivery Information */}
        {user && hasValidDeliveryLocation() && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="space-y-2">
              <div className="flex items-center">
                <FaMapMarkerAlt className="text-green-600 mr-2" />
                <div>
                  <p className="text-green-800 font-medium text-sm sm:text-base">Delivering to:</p>
                  <p className="text-green-700 text-sm sm:text-base">{getCurrentLocationName()}</p>
                </div>
              </div>
              {user.hostel && (
                <div className="flex items-center">
                  <Building className="text-green-600 mr-2 h-4 w-4" />
                  <div>
                    <p className="text-green-800 font-medium text-sm sm:text-base">Hostel:</p>
                    <p className="text-green-700 text-sm sm:text-base">{user.hostel.name}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-8 mb-6 lg:mb-0">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
              <h2 className="font-semibold text-lg bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent pb-3 sm:pb-4 border-b border-white mb-3 sm:mb-4 flex items-center">
                <FaMapMarkerAlt className="mr-2 text-[#733857]" />
                Delivery Address
              </h2>
              
              {!userDataLoaded ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
                  <p className="bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">Loading user information...</p>
                </div>
              ) : user ? (
                <div className="space-y-4">

                  
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs sm:text-sm font-medium bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent mb-1">Name</p>
                      <p className="bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent font-medium text-sm sm:text-base">{user.name || user.displayName || user.firstName || 'Not provided'}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs sm:text-sm font-medium bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent mb-1">Phone</p>
                      <p className="bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent font-medium text-sm sm:text-base">{user.phone || user.phoneNumber || 'Not provided'}</p>
                    </div>
                    
                    <div className="col-span-2 lg:col-span-1">
                      <p className="text-xs sm:text-sm font-medium bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent mb-1">Email</p>
                      <p className="bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent font-medium text-sm sm:text-base">{user.email || 'Not provided'}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs sm:text-sm font-medium bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent mb-1">City</p>
                      <p className="bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent font-medium text-sm sm:text-base">
                        {user.location?.city || user.city || user.address?.city || 'Not provided'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs sm:text-sm font-medium bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent mb-1">Postal Code</p>
                      <p className="bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent font-medium text-sm sm:text-base">
                        {user.location?.pincode || user.pincode || user.postalCode || user.address?.postalCode || 'Not provided'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs sm:text-sm font-medium bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent mb-1">Country</p>
                      <p className="bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent font-medium text-sm sm:text-base">{user.country || user.address?.country || 'India'}</p>
                    </div>
                  </div>
                  
                  {/* Hostel information if available */}
                  {user.hostel && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 mb-1">Hostel Information</p>
                      <p className="text-blue-700 font-medium">{user.hostel.name}</p>
                      {user.hostel.address && (
                        <p className="text-blue-600 text-sm">{user.hostel.address}</p>
                      )}
                    </div>
                  )}
                  
                  {/* Current location display */}
                  {(hasValidDeliveryLocation() || user.location) && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-800 mb-1">Delivery Location</p>
                      <div className="text-green-700">
                        {user.location ? (
                          <div>
                            <p className="font-medium">{user.location.fullAddress || `${user.location.area}, ${user.location.city} - ${user.location.pincode}`}</p>
                            {user.location.deliveryCharge && (
                              <p className="text-xs mt-1">Delivery Charge: ₹{user.location.deliveryCharge}</p>
                            )}
                            {user.hostel && (
                              <p className="text-xs mt-1">Hostel: {user.hostel.name}</p>
                            )}
                          </div>
                        ) : (
                          <p>{getCurrentLocationName()}</p>
                        )}
                      </div>
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
              ) : isAuthenticated ? (
                <div className="text-center py-8">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-amber-800 mb-4">Your profile information is incomplete</p>
                    <Link 
                      to="/profile" 
                      className="inline-flex items-center bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      Complete Profile
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent mb-4">Please login to see your delivery address</p>
                  <button 
                    onClick={() => {
                      // You can implement opening the auth modal here
                      navigate('/auth'); // Redirect to auth page
                    }}
                    className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    Login
                  </button>
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="font-semibold text-lg bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent pb-3 sm:pb-4 border-b border-white mb-3 sm:mb-4">
                Payment Method
              </h2>
              
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Razorpay Payment */}
                  <div 
                    onClick={() => setSelectedPaymentMethod('razorpay')}
                    className={`p-4 sm:p-6 border-2 rounded-lg cursor-pointer transition-all duration-300 ${
                      selectedPaymentMethod === 'razorpay' 
                        ? 'border-yellow-500 bg-yellow-50 shadow-lg' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center mb-3 sm:mb-4">
                      <FaCreditCard className={`mr-2 sm:mr-3 text-xl sm:text-2xl ${selectedPaymentMethod === 'razorpay' ? 'text-yellow-600' : 'text-[#733857]'}`} />
                      <div>
                        <h3 className="font-semibold text-base sm:text-lg bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">Online Payment</h3>
                        <p className="text-xs sm:text-sm bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">Powered by Razorpay</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                      <img src="https://cdn.razorpay.com/static/assets/logo/payment.svg" alt="Razorpay" className="h-4 sm:h-6" />
                      <img src="https://cdn-icons-png.flaticon.com/512/196/196578.png" alt="Visa" className="h-4 sm:h-6" />
                      <img src="https://cdn-icons-png.flaticon.com/512/196/196561.png" alt="MasterCard" className="h-4 sm:h-6" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="h-4 sm:h-6" />
                    </div>
                    
                    <div className="text-xs bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">
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
                    className={`p-4 sm:p-6 border-2 rounded-lg cursor-pointer transition-all duration-300 ${
                      selectedPaymentMethod === 'cod' 
                        ? 'border-green-500 bg-green-50 shadow-lg' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center mb-3 sm:mb-4">
                      <BsCashCoin className={`mr-2 sm:mr-3 text-xl sm:text-2xl ${selectedPaymentMethod === 'cod' ? 'text-green-600' : 'text-[#733857]'}`} />
                      <div>
                        <h3 className="font-semibold text-base sm:text-lg bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">Cash on Delivery</h3>
                        <p className="text-xs sm:text-sm bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">Pay when you receive</p>
                      </div>
                    </div>
                    
                    <div className="text-xs bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent space-y-1">
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Pay in cash to delivery person
                      </div>
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        No online payment required
                      </div>
                    </div>
                    
                    <div className="mt-2 sm:mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
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
                      className={`group relative w-full rounded-lg overflow-hidden transition-all duration-300 font-semibold py-4 px-5 text-sm ${
                        isProcessing 
                          ? 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed' 
                          : 'bg-white border-2 border-[#733857] hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] hover:border-[#733857] transform hover:scale-[1.02] active:scale-[0.98] touch-manipulation shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {isProcessing ? (
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-gray-400">Processing Payment...</span>
                        </span>
                      ) : (
                        <span className="relative z-10 flex items-center justify-center gap-1.5">
                          <FaCreditCard className="w-4 h-4 transition-all duration-300 group-hover:rotate-12 group-hover:scale-110 group-active:rotate-12 group-active:scale-110 text-[#733857] group-hover:text-white" />
                          <span className="transform transition-all duration-300 group-hover:tracking-wider group-active:tracking-wider bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent group-hover:text-white font-semibold">
                            Pay ₹{grandTotal.toFixed(2)} with Razorpay
                          </span>
                          <svg className="w-3 h-3 transition-all duration-300 group-hover:translate-x-1 group-hover:scale-110 group-active:translate-x-1 group-active:scale-110 text-[#733857] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
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
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:sticky lg:top-6">
              <h2 className="font-semibold text-lg bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent pb-3 sm:pb-4 border-b border-white mb-3 sm:mb-4">
                Order Summary
              </h2>
              
              <div className="max-h-[250px] sm:max-h-[300px] overflow-y-auto mb-4 pr-1 sm:pr-2">
                {cartItems.map((item) => (
                  <div key={`${item.id || item._id}-${JSON.stringify(item.options)}`} className="flex items-center py-2 sm:py-3 border-b border-white">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
                      <img 
                        src={item.image || (item.images && item.images[0]) || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iI0Q1RDlERCIvPgo8L3N2Zz4K'} 
                        alt={item.name} 
                        className="w-full h-full object-cover rounded-md"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iI0Q1RDlERCIvPgo8L3N2Zz4K';
                        }}
                      />
                    </div>
                    <div className="ml-2 sm:ml-3 flex-grow">
                      <p className="text-xs sm:text-sm font-medium bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">{item.name}</p>
                      <div className="flex justify-between items-center">
                        <p className="text-xs bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">
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
                            // Use centralized pricing calculation for consistency
                            const prod = item.productDetails;
                            const vi = Number.isInteger(item?.productDetails?.variantIndex) ? item.productDetails.variantIndex : 0;
                            const variant = prod?.variants?.[vi];
                            const pricing = calculatePricing(variant);
                            
                            return (
                              <div className="space-y-1">
                                <div>
                                  <span className="font-medium text-green-600">₹{Math.round(pricing.finalPrice)}</span>
                                  <span className="bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent"> × {item.quantity}</span>
                                </div>
                                {pricing.discountPercentage > 0 && (
                                  <div className="text-green-600 font-medium text-xs">
                                    {pricing.discountPercentage}% OFF
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2 bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">
                {(() => {
                  // Use the centralized cart totals data
                  const totals = cartTotalsData;
                  
                  return (
                    <>
                      <div className="flex justify-between text-sm bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">
                        <span>Original Price</span>
                        <span className="line-through">₹{Math.round(totals.originalTotal)}</span>
                      </div>
                      {totals.totalSavings > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount Savings {totals.averageDiscountPercentage > 0 && `(${totals.averageDiscountPercentage}% OFF)`}</span>
                          <span className="font-medium">-₹{Math.round(totals.totalSavings)}</span>
                        </div>
                      )}
                      {/* Show average discount percentage prominently for multiple products */}
                      {cartItems.length > 1 && totals.averageDiscountPercentage > 0 && (
                        <div className="flex justify-between bg-green-50 p-2 rounded-md border border-green-100">
                          <span className="text-green-700 font-medium text-sm">Average Discount</span>
                          <span className="text-green-700 font-bold">{totals.averageDiscountPercentage}% OFF</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-medium">₹{Math.round(discountedCartTotal)}</span>
                      </div>
                    </>
                  );
                })()}
                
                {appliedFreeCash > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>Free Cash Applied</span>
                    <span className="font-medium">-₹{Math.round(appliedFreeCash)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <div>
                    <span>Delivery Charge</span>
                    {(() => {
                      const userLocation = user?.location || 
                        (user?.locationId && locations?.find(loc => loc._id === user.locationId));
                      
                      return userLocation ? (
                        <div className="text-xs bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">to {userLocation.area}</div>
                      ) : (
                        <div className="text-xs bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">default rate</div>
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
                
                {/* Free Cash Section */}
                {totalFreeCashAvailable > 0 && (
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useFreeCash}
                          onChange={(e) => setUseFreeCash(e.target.checked)}
                          className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">
                          Use Free Cash
                        </span>
                      </label>
                      <span className="text-sm bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">
                        ₹{totalFreeCashAvailable.toFixed(2)} available
                      </span>
                    </div>
                    
                    {useFreeCash && (
                      <div className="flex justify-between text-green-600 text-sm">
                        <span>Free Cash Applied</span>
                        <span className="font-medium">-₹{appliedFreeCash.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="text-xs bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent mt-1">
                      Free cash earned from previous purchases and promotions
                    </div>
                  </div>
                )}
                
                <div className="border-t border-white pt-3 mt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span className="bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">Total</span>
                    <span className="bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">₹{grandTotal.toFixed(2)}</span>
                  </div>
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





