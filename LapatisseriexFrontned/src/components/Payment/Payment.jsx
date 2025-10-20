import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../context/LocationContext/LocationContext';
import { useShopStatus } from '../../context/ShopStatusContext';
import ShopClosureOverlay from '../common/ShopClosureOverlay';
import ServiceAssuranceBanner from './ServiceAssuranceBanner';
import { WebsiteLiveTimerCompact } from '../WebsiteLiveTimer';
import { calculateCartTotals, calculatePricing, formatCurrency } from '../../utils/pricingUtils';
import { resolveOrderItemVariantLabel } from '../../utils/variantUtils';
import api from '../../services/apiService';
                  
const Payment = () => {
  // --- All original logic, hooks, and state are preserved ---
  const { isOpen, checkShopStatusNow, closingTime, nextOpeningTime, timezone, formatNextOpening, operatingHours } = useShopStatus();
  const { cartItems, cartTotal, clearCart, refreshCart } = useCart();
  const { user } = useAuth();
  const { hasValidDeliveryLocation, getCurrentLocationName, locations } = useLocation();
  const navigate = useNavigate();
  const [showLocationError, setShowLocationError] = useState(false);
  const [useFreeCash, setUseFreeCash] = useState(false);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  useEffect(() => {
    const bypassLocationCheck = !user;
    if (!bypassLocationCheck && typeof hasValidDeliveryLocation === 'function' && !hasValidDeliveryLocation()) {
      setShowLocationError(true);
    } else {
      setShowLocationError(false);
    }
  }, [hasValidDeliveryLocation, navigate, user, cartItems, cartTotal]);

  const cartTotalsData = useMemo(() => {
    const totals = calculateCartTotals(cartItems);
    return totals;
  }, [cartItems]);

  const discountedCartTotal = useMemo(() => {
    const finalTotal = cartTotalsData.finalTotal || 0;
    return isNaN(finalTotal) ? 0 : finalTotal;
  }, [cartTotalsData]);

  const deliveryCharge = useMemo(() => {
    const userLocationId = user?.location?._id || user?.location?.locationId || user?.locationId;
    const userLocation = user?.location ||
      (userLocationId && locations?.length > 0 && locations.find(loc => loc._id === userLocationId));
    
    if (userLocation) {
      const charge = userLocation.deliveryCharge ?? 49;
      return isNaN(charge) ? 49 : charge;
    }
    return 49;
  }, [user, locations]);

  const totalFreeCashAvailable = useMemo(() => {
    const result = cartItems.reduce((total, item) => {
      try {
        const productDetails = item.productDetails || item.product || item;
        const variantIndex = item.variantIndex || productDetails?.variantIndex || 0;
        
        let freeCash = 0;
        if (productDetails?.variants && productDetails.variants[variantIndex]) {
          freeCash = parseFloat(productDetails.variants[variantIndex].freeCashExpected) || 0;
        }
        
        const itemFreeCash = isNaN(freeCash) ? 0 : freeCash * item.quantity;
        return total + itemFreeCash;
      } catch (error) {
        console.warn('❌ Error calculating free cash for item:', item, error);
        return total;
      }
    }, 0);
    
    return isNaN(result) ? 0 : result;
  }, [cartItems]);
  
  const appliedFreeCash = useFreeCash ? totalFreeCashAvailable : 0;
  
  const grandTotal = useMemo(() => {
    const total = discountedCartTotal + deliveryCharge - appliedFreeCash;
    return isNaN(total) ? 0 : Math.max(0, total);
  }, [discountedCartTotal, deliveryCharge, appliedFreeCash]);

  const resolvedLocation = useMemo(() => {
    if (user?.location) {
      return user.location;
    }
    if (user?.locationId && Array.isArray(locations)) {
      return locations.find((loc) => loc._id === user.locationId) || null;
    }
    return null;
  }, [user, locations]);

  const locationName = useMemo(() => {
    if (resolvedLocation?.fullAddress) {
      return resolvedLocation.fullAddress;
    }
    if (resolvedLocation?.area && resolvedLocation?.city) {
      return `${resolvedLocation.area}, ${resolvedLocation.city}`;
    }
    if (typeof getCurrentLocationName === 'function') {
      return getCurrentLocationName();
    }
    return '';
  }, [resolvedLocation, getCurrentLocationName]);

  const deliveryPincode = resolvedLocation?.pincode || user?.pincode || user?.postalCode || '';
  const deliveryCity = resolvedLocation?.city || user?.city || '';
  const contactNumber = user?.phone || user?.phoneNumber || '';
  const canShowDeliveryCard = Boolean(user || locationName);
  const isServiceable = typeof hasValidDeliveryLocation === 'function' ? hasValidDeliveryLocation() : true;
  const customerName = user?.name || user?.displayName || user?.firstName || '';
  const hostelName = user?.hostel?.name || '';

  const getVariantInfo = (item) => {
    const prod = item?.productDetails || item?.product || item || {};
    const variants = Array.isArray(prod?.variants) ? prod.variants : Array.isArray(item?.variants) ? item.variants : [];
    const variantIndex = Number.isInteger(item?.productDetails?.variantIndex)
      ? item.productDetails.variantIndex
      : Number.isInteger(item?.variantIndex)
        ? item.variantIndex
        : 0;
    const variantFromArray = variants?.[variantIndex];
    const selectedVariant = item?.productDetails?.selectedVariant || item?.selectedVariant || variantFromArray || item?.variant;
    const variantLabel = resolveOrderItemVariantLabel({
      ...item,
      variants,
      variantIndex,
      variant: item?.variant || selectedVariant,
      selectedVariant,
      variantLabel: item?.variantLabel || prod?.variantLabel
    });

    return {
      variantIndex,
      variant: item?.variant || selectedVariant || variantFromArray || null,
      variantLabel
    };
  };

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('razorpay');
  const isRazorpaySelected = selectedPaymentMethod === 'razorpay';
  const isCodSelected = selectedPaymentMethod === 'cod';
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOrderComplete, setIsOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const timezoneAbbreviation = useMemo(() => {
    if (!timezone) {
      return null;
    }

    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'short'
      }).formatToParts(new Date());
      return parts.find(part => part.type === 'timeZoneName')?.value || null;
    } catch (error) {
      console.warn('❌ Error deriving timezone abbreviation:', error);
      return null;
    }
  }, [timezone]);

  const supportHoursLabel = useMemo(() => {
    if (!operatingHours) {
      return null;
    }

    const formatWallClock = (value) => {
      if (!value || typeof value !== 'string') {
        return null;
      }

      const [rawHour, rawMinute] = value.split(':');
      const hour = Number(rawHour);
      const minute = Number(rawMinute);
      if (Number.isNaN(hour) || Number.isNaN(minute)) {
        return null;
      }

      const suffix = hour >= 12 ? 'PM' : 'AM';
      const normalizedHour = hour % 12 || 12;
      return `${normalizedHour}:${minute.toString().padStart(2, '0')} ${suffix}`;
    };

    const startLabel = formatWallClock(operatingHours.startTime);
    const endLabel = formatWallClock(operatingHours.endTime);
    const tzSuffix = timezoneAbbreviation ? ` ${timezoneAbbreviation}` : '';

    if (startLabel && endLabel) {
      return `${startLabel} – ${endLabel}${tzSuffix}`;
    }

    if (startLabel || endLabel) {
      const parts = [];
      if (startLabel) parts.push(`Starts ${startLabel}`);
      if (endLabel) parts.push(`Ends ${endLabel}`);
      return `${parts.join(' • ')}${tzSuffix}`;
    }

    return null;
  }, [operatingHours, timezoneAbbreviation]);

  const supportStatusDetail = useMemo(() => {
    const formatClockTime = (isoString) => {
      if (!isoString) return null;
      try {
        return new Date(isoString).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: timezone || 'Asia/Kolkata'
        });
      } catch (error) {
        console.warn('❌ Error formatting support time:', error);
        return null;
      }
    };

    if (isOpen) {
      const closingLabel = formatClockTime(closingTime);
      if (closingLabel) {
        return `We're here right now — closes at ${closingLabel}${timezoneAbbreviation ? ` ${timezoneAbbreviation}` : ''}`;
      }
      return 'We are here to help right now.';
    }

    const formatted = formatNextOpening?.(nextOpeningTime, timezone);
    if (formatted) {
      const trimmed = formatted.trim();
      const normalized = trimmed.startsWith('at ')
        ? trimmed.slice(3)
        : trimmed;
      return `Currently closed — opens ${normalized}${timezoneAbbreviation ? ` ${timezoneAbbreviation}` : ''}`;
    }

    return 'Leave us a message and we will get back soon.';
  }, [isOpen, closingTime, nextOpeningTime, timezone, formatNextOpening, timezoneAbbreviation]);

  // --- All payment handlers (loadRazorpayScript, createOrder, handleRazorpayPayment, handleCODOrder) are preserved exactly as they were ---
  
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const createOrder = async (amount, paymentMethod = 'razorpay') => {
    try {
      const orderData = {
        amount: Math.round(amount * 100), // Convert to paise
        currency: 'INR',
        receipt: `order_${Date.now()}`,
        paymentMethod,
        cartItems: cartItems.map(item => {
          const prod = item.productDetails || item.product || {};
          const variants = Array.isArray(prod?.variants) ? prod.variants : Array.isArray(item?.variants) ? item.variants : [];
          const variantIndex = Number.isInteger(item?.productDetails?.variantIndex)
            ? item.productDetails.variantIndex
            : Number.isInteger(item?.variantIndex)
              ? item.variantIndex
              : 0;
          const variantFromArray = variants?.[variantIndex];
          const selectedVariant = item?.productDetails?.selectedVariant || item?.selectedVariant || variantFromArray;

          const variantLabel = resolveOrderItemVariantLabel({
            ...item,
            variants,
            variantIndex,
            variant: item?.variant || selectedVariant,
            selectedVariant,
            variantLabel: item?.variantLabel || prod?.variantLabel
          });

          const pricingSource = item?.variant || selectedVariant || variantFromArray;
          const pricing = pricingSource ? calculatePricing(pricingSource) : { finalPrice: Number(item.price) || 0, mrp: Number(item.originalPrice) || Number(item.price) || 0 };
          const variantSnapshot = pricingSource ? { ...pricingSource } : null;

          return {
            productId: item.productId || item._id,
            productName: item.name || prod?.name || 'Product',
            quantity: item.quantity,
            price: pricing.finalPrice,
            originalPrice: pricing.mrp,
            variantIndex,
            variantLabel: variantLabel || '',
            variant: variantSnapshot
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

  const handleRazorpayPayment = async () => {
    const currentStatus = await checkShopStatusNow();
    if (!currentStatus.isOpen) {
      return;
    }
    if (!user) {
      alert('Please login to place an order');
      return;
    }
    setIsProcessing(true);
    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        alert('Failed to load payment gateway. Please try again.');
        setIsProcessing(false);
        return;
      }
      const orderData = await createOrder(grandTotal, 'razorpay');
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
        image: '/images/logo.png', // Your La Patisserie logo
        order_id: orderData.orderId,
        handler: async (response) => {
          if (window.__paymentVerifying) {
            console.log('⚠️ Payment verification already in progress, skipping duplicate call');
            return;
          }
          window.__paymentVerifying = true;
          try {
            console.log('✅ Payment successful, verifying...');
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
              try {
                await clearCart();
                console.log('🧹 Cart cleared after successful payment');
              } catch (cartError) {
                console.error('❌ Failed to clear cart after payment:', cartError);
              }
            } else {
              console.error('❌ Payment verification failed:', verifyData.message);
              alert('Payment verification failed. Please contact support with your order details.');
              try {
                await refreshCart();
              } catch (refreshError) {
                console.error('❌ Failed to refresh cart:', refreshError);
              }
            }
          } catch (error) {
            console.error('❌ Payment verification error:', error);
            alert('Payment verification failed. Please contact support if amount was debited.');
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
          color: '#733857',
          backdrop_color: 'rgba(115, 56, 87, 0.6)',
        },
        modal: {
          backdropclose: false,
          escape: true,
          handleback: true,
          confirm_close: true,
          ondismiss: async () => {
            console.log('🚫 Razorpay popup dismissed/cancelled by user');
            setIsProcessing(false);
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

  const handleCODOrder = async () => {
    const currentStatus = await checkShopStatusNow();
    if (!currentStatus.isOpen) {
      return;
    }
    if (!user) {
      alert('Please login to place an order');
      return;
    }
    setIsProcessing(true);
    setIsOrderComplete(true);
    setOrderNumber('...');
    try {
      const orderData = await createOrder(grandTotal, 'cod');
      setOrderNumber(orderData.orderNumber);
      try {
        await clearCart();
      } catch (cartError) {
        console.error('❌ Failed to clear cart after COD order:', cartError);
      }
    } catch (error) {
      console.error('COD order error:', error);
      setIsOrderComplete(false);
      setOrderNumber('');
      alert('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (isProcessing || !hasAcceptedTerms) {
      return;
    }

    if (selectedPaymentMethod === 'razorpay') {
      await handleRazorpayPayment();
    } else {
      await handleCODOrder();
    }
  };

if (isOrderComplete) {
    return (
      <div className="min-h-screen  px-4 py-10" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
        {/* Main content card with sharp corners */}
        <div className="mx-auto max-w-lg  p-8 sm:p-10">
          <div className="flex flex-col items-center text-center">
            
           
            <div className="mb-6 flex h-20 w-20 items-center justify-center  p-2">
              <img
                src="/images/logo.png" // <-- REPLACE THIS
                alt="La Patisserie Logo"
                className="h-full w-full object-contain"
              />
            </div>

            {/* 2. Page Hierarchy */}
            <h2 className="text-3xl font-semibold text-slate-900">Payment confirmed</h2>
            <p className="mt-3 text-base text-slate-500">
              Thank you for choosing La Patisserie. A confirmation email with your order details is on the way.
            </p>

            {/* 3. Integrated Order Details */}
            <div className="mt-8 w-full border-t border-slate-200 pt-8">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">Order number</p>
                <p className="text-lg font-semibold text-slate-900">{orderNumber}</p>
              </div>
            </div>

            {/* 4. Updated Button Styles (Sharp Corners) */}
            <div className="mt-10 flex w-full flex-col-reverse gap-4 sm:flex-row sm:justify-center">
              <Link
                to="/"
                className="w-full border border-slate-300 px-6 py-3 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 sm:w-auto"
              >
                Back to home
              </Link>
              <Link
                to="/products"
                className="w-full bg-[#733857] px-6 py-3 text-center text-sm font-medium text-white transition hover:bg-[#5e2c46] focus:outline-none focus:ring-2 focus:ring-[#733857] focus:ring-offset-2 sm:w-auto"
              >
                Continue shopping
              </Link>
                <Link
                to="/orders"
                className="w-full bg-[#cf91d9] px-6 py-3 text-center text-sm font-medium text-white transition hover:bg-[#f2a9ce] focus:outline-none focus:ring-2 focus:ring-[#733857] focus:ring-offset-2 sm:w-auto"
              >
               My Orders
              </Link>
            </div>
            
          </div>
        </div>
      </div>
    );
  }

  // --- Location Error Page (Unchanged) ---
  if (showLocationError) {
    return (
      <div className="container mx-auto min-h-screen px-3 py-4 pt-4 sm:px-4 sm:py-8 sm:pt-8" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-4 sm:mb-6">
            <Link to="/checkout" className="hidden sm:flex items-center text-xs font-bold uppercase tracking-[0.22em] text-[#733857] transition-colors hover:text-[#5e2c46]">
              Back to checkout
            </Link>
            <h1 className="flex-grow text-center text-xl font-bold text-[#733857] sm:text-2xl">Payment</h1>
          </div>

          <div className="bg-white p-8 text-center shadow-md">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center border border-red-200 bg-red-50 text-lg font-semibold text-red-500">
              !
            </div>
            <h2 className="mb-4 text-2xl font-bold text-red-600">Delivery Location Required</h2>
            <p className="mb-6 text-sm text-[#733857]">
              Please select a delivery location to proceed with payment.
            </p>

            <div className="space-y-4">
              <Link
                to="/checkout"
                className="block w-full border border-[#733857] px-6 py-3 text-xs font-bold uppercase tracking-[0.22em] text-[#733857] transition-colors hover:bg-[#733857] hover:text-white"
              >
                Go back to checkout
              </Link>
              <p className="text-sm text-[#733857]">
                You can verify your delivery location from the checkout page.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const placeOrderLabel = isRazorpaySelected
    ? `Place order • Pay ${formatCurrency(grandTotal)} securely`
    : `Place order • Pay ${formatCurrency(grandTotal)} on delivery`;

  const isPlaceOrderDisabled = isProcessing || !hasAcceptedTerms || cartItems.length === 0;

  // --- Main Payment Page (Redesigned Split-Screen Layout) ---
  return (
    <div className="-mt-2 sm:-mt-3 md:-mt-4" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      <ShopClosureOverlay overlayType="page" showWhenClosed={!isOpen}>
    <div className="min-h-screen bg-[#f8f5f6] pb-12">

        {/* --- Website Live Timer at the very top --- */}
        <div className="w-full bg-white border-b border-slate-200">
          <WebsiteLiveTimerCompact />
        </div>

        {/* --- Sticky Header --- */}
    <div className="sticky top-0 z-40 bg-[#f8f5f6]/95 backdrop-blur-sm">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link to="/checkout" className="text-xs font-bold uppercase tracking-[0.22em] text-slate-600 transition hover:text-[#733857]">
              Back to checkout
            </Link>
            <div className="flex items-center gap-2">
              <img src="/images/logo.png" alt="La Patisserie" className="h-8 w-auto" />
              <span className="text-sm font-semibold text-[#733857]">La Patisserie</span>
            </div>
          </div>
        </div>

        {/* --- Main Content Area --- */}
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 -mt-2">
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:gap-8">

            {/* --- Left Column: Order Summary (Sticky "Receipt") --- */}
            <aside className="h-full  p-4 sm:p-6 lg:sticky lg:top-[4.75rem] lg:col-span-5 lg:self-start lg:p-8">
              <h2 className="text-2xl font-semibold uppercase tracking-[0.18em] text-[#1a1a1a]">Order summary</h2>
            {cartItems.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500">Your cart is empty. Add a few desserts to continue.</p>
            ) : (
              <>
                {/* --- Item List --- */}
                <div className="mt-6 max-h-64 space-y-5 overflow-y-auto border-b border-slate-200 pb-6 pr-1 sm:max-h-80">
                  {cartItems.map((item) => {
                    const { variant, variantLabel } = getVariantInfo(item);
                    const fallbackLabel = (() => {
                      const opts = item.options || item.productDetails?.options || {};
                      const weight = opts.weight || item.productDetails?.weight || item.productDetails?.variant?.weight || '';
                      const flavor = opts.flavor || item.productDetails?.flavor || '';
                      const parts = [];
                      if (weight) parts.push(weight);
                      if (flavor) parts.push(flavor);
                      return parts.length ? parts.join(' • ') : '';
                    })();

                    const displayLabel = variantLabel || fallbackLabel || 'Standard';
                    const pricing = variant ? calculatePricing(variant) : null;
                    const unitPrice = pricing ? pricing.finalPrice : Number(item?.price) || 0;
                    const safeUnitPrice = Number.isFinite(unitPrice) ? unitPrice : 0;
                    const lineTotal = safeUnitPrice * (item.quantity || 1);
                    const hasDiscount = Boolean(pricing?.discountPercentage > 0);

                    return (
                      <div
                        key={`${item.id || item._id}-${JSON.stringify(item.options)}`}
                        className="flex gap-4"
                      >
                        <div className="h-14 w-14 flex-shrink-0 overflow-hidden border border-slate-200 bg-slate-100">
                          <img
                            src={item.image || (item.images && item.images[0]) || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iI0Q1RDlERCIvPgo8L3N2Zz4K'}
                            alt={item.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1HExampled...';
                            }}
                          />
                        </div>
                        <div className="flex flex-1 flex-col gap-1">
                          <p className="text-sm font-medium text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-500">{displayLabel}</p>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>
                              {formatCurrency(safeUnitPrice)} × {item.quantity}
                            </span>
                            <span className="font-medium text-slate-900">{formatCurrency(lineTotal)}</span>
                          </div>
                          {hasDiscount && (
                            <span className="text-[11px] font-medium text-emerald-600">
                              {pricing?.discountPercentage}% off applied
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* --- Price Breakdown --- */}
                <div className="mt-6 space-y-3 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span>Original total</span>
                    <span className="line-through text-slate-400">
                      {formatCurrency(cartTotalsData.originalTotal || discountedCartTotal)}
                    </span>
                  </div>
                  {cartTotalsData.totalSavings > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Savings</span>
                      <span>-{formatCurrency(cartTotalsData.totalSavings)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium text-slate-900">{formatCurrency(discountedCartTotal)}</span>
                  </div>

                  {totalFreeCashAvailable > 0 && (
                    <div className="border border-slate-200 bg-slate-50 p-3">
                      <label className="flex items-center justify-between text-sm font-medium text-slate-900">
                        <span>Use free cash</span>
                        <input
                          type="checkbox"
                          className="h-4 w-4 border border-slate-400 bg-white text-emerald-600 focus:ring-emerald-500"
                          checked={useFreeCash}
                          onChange={(e) => setUseFreeCash(e.target.checked)}
                        />
                      </label>
                      <p className="mt-2 text-xs text-slate-500">Available: {formatCurrency(totalFreeCashAvailable)}</p>
                      {useFreeCash && (
                        <div className="mt-2 flex justify-between text-emerald-600">
                          <span>Applied</span>
                          <span>-{formatCurrency(appliedFreeCash)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span className="font-medium text-slate-900">{formatCurrency(deliveryCharge)}</span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-base font-semibold text-slate-900">
                    <span className="text-xl">Total due</span>
                    <span className="text-2xl">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </>
            )}
          </aside>
            {/* --- Right Column: Actions (Delivery & Payment) --- */}
            <section className="space-y-6 lg:col-span-7">
            
            {/* --- Delivery Card (Redesigned) --- */}
            {canShowDeliveryCard && (
              <div className="rounded-3xl border border-[#733857]/20 bg-white shadow-sm">
                <div className="border-b border-[#733857]/20 px-4 py-5 sm:px-6">
                  <h2 className="text-lg font-semibold uppercase tracking-[0.15em] text-[#1a1a1a]">Delivery & Contact</h2>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[rgba(26,26,26,0.55)]">Confirm the details below</p>
                </div>
                
                <div className="px-4 py-5 sm:px-6 sm:py-6">
                  <div className="space-y-4">
                    {/* Delivery Location */}
                    <div className="flex items-start justify-between border-b border-[#733857]/15 pb-4">
                      <div className="flex-1">
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Delivering to</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {locationName || 'No location selected'}
                        </p>
                        {(deliveryCity || deliveryPincode) && (
                          <p className="mt-0.5 text-sm text-slate-600">
                            {[deliveryCity, deliveryPincode].filter(Boolean).join(' • ')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Hostel */}
                    {hostelName && (
                      <div className="flex items-start justify-between border-b border-[#733857]/15 pb-4">
                        <div className="flex-1">
                          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Hostel</p>
                          <p className="mt-1 text-sm font-semibold text-[#733857]">{hostelName}</p>
                        </div>
                      </div>
                    )}

                    {/* Recipient Name */}
                    <div className="flex items-start justify-between border-b border-[#733857]/15 pb-4">
                      <div className="flex-1">
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Recipient</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{customerName || 'Guest User'}</p>
                      </div>
                    </div>

                    {/* Contact Number */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Contact</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{contactNumber || 'No contact number'}</p>
                      </div>
                    </div>
                  </div>
                </div>

              
              </div>
            )}
            {/* --- End Delivery Card --- */}


            {/* --- Payment Card (Reference layout) --- */}
              <div className=" p-5 sm:p-6 lg:p-7">
              <div className="flex flex-col gap-1">
                <h1 className="text-lg font-semibold uppercase tracking-[0.14em] text-[#1a1a1a]">Payment</h1>
                <p className="text-xs uppercase tracking-[0.16em] text-[rgba(26,26,26,0.55)]">Choose how you would like to pay</p>
              </div>

              <div className="mt-6 space-y-3">
                <label
                  className={`relative flex cursor-pointer items-start gap-4 border px-4 py-4 transition sm:px-5 ${
                    isRazorpaySelected
                      ? 'border-[#733857] bg-[#f7eef3] shadow-sm'
                      : 'border-[#d9c4cd] bg-white hover:border-[#733857]'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment-method"
                    value="razorpay"
                    checked={isRazorpaySelected}
                    onChange={() => setSelectedPaymentMethod('razorpay')}
                    className="sr-only"
                  />
                  <span
                    className={`mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border ${
                      isRazorpaySelected ? 'border-[#733857]' : 'border-[#d9c4cd]'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isRazorpaySelected ? 'bg-[#733857]' : 'bg-transparent'
                      }`}
                    />
                  </span>
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                      <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-[#412434]">
                        <img src="/images/razorpay.svg" alt="Razorpay" className="h-4 w-auto" />
                        Razorpay secure checkout
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d4466] sm:text-xs">
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs text-[#6f5260]">
                      Pay instantly with UPI, cards, net banking or wallets through Razorpay&apos;s protected gateway.
                    </p>
                    <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d4466]">
                      <span className="border border-[#d9c4cd] px-2 py-1">UPI</span>
                      <span className="border border-[#d9c4cd] px-2 py-1">Cards</span>
                      <span className="border border-[#d9c4cd] px-2 py-1">Net banking</span>
                      <span className="border border-[#d9c4cd] px-2 py-1">Wallets</span>
                    </div>
                  </div>
                </label>

                <label
                  className={`relative flex cursor-pointer items-start gap-4 border px-4 py-4 transition sm:px-5 ${
                    isCodSelected
                      ? 'border-[#412434] bg-[#f1e8ed] shadow-sm'
                      : 'border-[#d0c6cb] bg-white hover:border-[#412434]'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment-method"
                    value="cod"
                    checked={isCodSelected}
                    onChange={() => setSelectedPaymentMethod('cod')}
                    className="sr-only"
                  />
                  <span
                    className={`mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border ${
                      isCodSelected ? 'border-[#412434]' : 'border-[#d0c6cb]'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isCodSelected ? 'bg-[#412434]' : 'bg-transparent'
                      }`}
                    />
                  </span>
                  <div className="flex flex-1 flex-col gap-2">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-[#412434]">
                      <img src="/images/cod.svg" alt="Cash on Delivery" className="h-4 w-auto" />
                      Cash on delivery
                    </span>
                    <p className="text-xs text-[#6f5260]">
                      Pay once your desserts arrive. We will reconfirm the order and bring an invoice along.
                    </p>
                  </div>
                </label>
              </div>

              <div className="mt-5 rounded border border-dashed border-[#d9c4cd] bg-[#f9f4f6] px-4 py-4 text-xs leading-relaxed text-[#412434] sm:px-5">
                {isRazorpaySelected ? (
                  <>
                    <span className="font-semibold uppercase tracking-[0.16em] text-[#733857]">Digital checkout</span>
                    <p className="mt-2 text-[13px] text-[#6f5260]">
                      We will redirect you to Razorpay to collect {formatCurrency(grandTotal)} securely with your preferred digital method.
                    </p>
                  </>
                ) : (
                  <>
                    <span className="font-semibold uppercase tracking-[0.16em] text-[#412434]">Pay on delivery</span>
                    <p className="mt-2 text-[13px] text-[#6f5260]">
                      Please keep {formatCurrency(grandTotal)} ready. Our delivery team carries change and a printed receipt.
                    </p>
                  </>
                )}
              </div>

              <label className="mt-6 flex items-start gap-3 text-xs leading-relaxed text-slate-600 sm:text-[13px]">
                <input
                  type="checkbox"
                  checked={hasAcceptedTerms}
                  onChange={(event) => setHasAcceptedTerms(event.target.checked)}
                  className="mt-1 h-4 w-4 border border-slate-400 text-[#733857] focus:ring-[#733857]"
                />
                <span>
                  I have reviewed my order details and accept the{' '}
                  <a
                    href="/terms"
                    className="text-[#733857] underline decoration-[#733857] underline-offset-2 transition hover:text-[#5e2c46]"
                  >
                    terms &amp; conditions
                  </a>{' '}
                  and{' '}
                  <a
                    href="/privacy-policy"
                    className="text-[#733857] underline decoration-[#733857] underline-offset-2 transition hover:text-[#5e2c46]"
                  >
                    privacy policy
                  </a>
                  .
                </span>
              </label>

              {!hasAcceptedTerms && (
                <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-[rgba(26,26,26,0.55)]">
                  Accept the terms to enable placing your order.
                </p>
              )}

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isPlaceOrderDisabled}
                 className={`mt-6 flex w-full items-center justify-center border px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] transition sm:px-5 sm:text-sm ${
                  isPlaceOrderDisabled
                    ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                    : 'border-[#733857] bg-[#733857] text-white hover:bg-[#5e2c46]'
                }`}
              >
                {isProcessing ? 'Processing…' : placeOrderLabel}
              </button>
            </div>

            {/* --- Sign In Prompt (Unchanged) --- */}
            {!user && (
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Sign in to speed things up</p>
                <p className="mt-2 text-sm text-slate-600">Log in before checkout so we can save your address and contact details.</p>
                <button
                  onClick={() => navigate('/auth')}
                  className="mt-4 inline-flex items-center justify-center border border-slate-200 px-4 py-2 text-sm font-medium text-[#733857] transition hover:bg-slate-50"
                >
                  Go to sign in
                </button>
              </div>
            )}
            </section>

          </div>
        </div>
        </div>
      </ShopClosureOverlay>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <ServiceAssuranceBanner
          className="mx-auto flex w-full max-w-7xl"
          supportStatusDetail={supportStatusDetail}
          supportHoursLabel={supportHoursLabel}
        />
      </div>
    </div>
  );
};

export default Payment;