import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../context/LocationContext/LocationContext';
import { useShopStatus } from '../../context/ShopStatusContext';
import ShopClosureOverlay from '../common/ShopClosureOverlay';
import OfferBadge from '../common/OfferBadge';
import ServiceAssuranceBanner from './ServiceAssuranceBanner';
import { WebsiteLiveTimerCompact } from '../WebsiteLiveTimer';
import FlipButton from '../common/FlipButton';
import StyleButton from '../common/StyleButton';
import HoverButton from '../common/HoverButton';
import { calculateCartTotals, calculatePricing, formatCurrency } from '../../utils/pricingUtils';
import { resolveOrderItemVariantLabel } from '../../utils/variantUtils';
import { getOrderExperienceInfo } from '../../utils/orderExperience';
import api from '../../services/apiService';
import NGOSidePanel from './NGOSidePanel';

const AUTO_REDIRECT_STORAGE_KEY = 'lapatisserie_payment_redirect';
const AUTO_REDIRECT_DELAY_MS = 20000;
const AUTO_REDIRECT_EXPIRY_MS = 2 * 60 * 1000; // expire redirect marker after 2 minutes
                  
const Payment = () => {
  // --- All original logic, hooks, and state are preserved ---
  const { isOpen, checkShopStatusNow, closingTime, nextOpeningTime, timezone, formatNextOpening, operatingHours } = useShopStatus();
  const { cartItems, cartTotal, clearCart, refreshCart } = useCart();
  const { user } = useAuth();
  const { hasValidDeliveryLocation, getCurrentLocationName, locations } = useLocation();
  const navigate = useNavigate();
  const [showLocationError, setShowLocationError] = useState(false);
  const [useFreeCash, setUseFreeCash] = useState(false);
  const [showNGOPanel, setShowNGOPanel] = useState(false);
  const redirectTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const [redirectCountdown, setRedirectCountdown] = useState(null);

  const clearAutoRedirect = useCallback(() => {
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setRedirectCountdown(null);
    try {
      sessionStorage.removeItem(AUTO_REDIRECT_STORAGE_KEY);
    } catch {}
  }, [setRedirectCountdown]);

  // Handle navigation with side panel trigger
  const handleNavigateWithPanel = (path) => {
    // Set flag in sessionStorage to show panel after navigation
    clearAutoRedirect();
    sessionStorage.setItem('showNGOPanel', 'true');
    navigate(path);
  };

  const orderExperience = useMemo(() => getOrderExperienceInfo(user), [user]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(AUTO_REDIRECT_STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw);
      const timestamp = Number(parsed?.timestamp);
      if (!Number.isFinite(timestamp)) {
        sessionStorage.removeItem(AUTO_REDIRECT_STORAGE_KEY);
        return;
      }
      if (Date.now() - timestamp > AUTO_REDIRECT_EXPIRY_MS) {
        sessionStorage.removeItem(AUTO_REDIRECT_STORAGE_KEY);
        return;
      }
      navigate('/orders', { replace: true });
    } catch (error) {
      sessionStorage.removeItem(AUTO_REDIRECT_STORAGE_KEY);
    }
  }, [navigate]);

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
  const [lastOrderAttempt, setLastOrderAttempt] = useState(null); // Prevent rapid clicks
  const [processingOrderId, setProcessingOrderId] = useState(null); // Track current processing order
  const [isOrderComplete, setIsOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [completedPaymentMethod, setCompletedPaymentMethod] = useState(null);
  // COD-specific loading UX (2-second detailed loading)
  const [codCountdown, setCodCountdown] = useState(null);
  const codCountdownTimerRef = useRef(null);

  useEffect(() => {
    if (!isOrderComplete) {
      setCompletedPaymentMethod(null);
    }
  }, [isOrderComplete]);

  // Auto-open NGO panel after payment success (with minimal delay)
  useEffect(() => {
    if (isOrderComplete) {
      // Scroll to top immediately to prevent auto-scroll to footer
      window.scrollTo({ top: 0, behavior: 'instant' });
      
      // Replace the entire history stack to prevent going back to checkout/payment
      // Push a new state for the payment confirmation
      window.history.pushState({ orderComplete: true }, '', '/payment');
      
      // Show NGO panel after 800ms (just enough for smooth transition)
      const timer = setTimeout(() => {
        setShowNGOPanel(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isOrderComplete]);

  useEffect(() => {
    if (!isOrderComplete) {
      clearAutoRedirect();
      return;
    }

    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    const payload = {
      orderNumber,
      timestamp: Date.now()
    };

    try {
      sessionStorage.setItem(AUTO_REDIRECT_STORAGE_KEY, JSON.stringify(payload));
    } catch {}

    setRedirectCountdown(Math.ceil(AUTO_REDIRECT_DELAY_MS / 1000));

    redirectTimerRef.current = setTimeout(() => {
      try {
        sessionStorage.removeItem(AUTO_REDIRECT_STORAGE_KEY);
      } catch {}
      navigate('/orders', { replace: true });
    }, AUTO_REDIRECT_DELAY_MS);

    countdownTimerRef.current = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev === null) {
          return prev;
        }
        if (prev <= 1) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [isOrderComplete, orderNumber, navigate, clearAutoRedirect]);

  // Handle browser back button - redirect to products page (skip checkout)
  useEffect(() => {
    if (isOrderComplete) {
      const handlePopState = (e) => {
        // When user presses back from payment confirmation, go to products page
        navigate('/products', { replace: true });
      };

      window.addEventListener('popstate', handlePopState);
      
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isOrderComplete, navigate]);

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

  // Cleanup effect to reset rapid click prevention after timeout
  useEffect(() => {
    if (lastOrderAttempt) {
      const timer = setTimeout(() => {
        setLastOrderAttempt(null);
      }, 5000); // Clear after 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [lastOrderAttempt]);

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
      
      // Handle duplicate order response
      if (data.isDuplicate) {
        console.log('⚠️ Duplicate order detected, using existing order:', data.orderNumber);
      }
      
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
    setCompletedPaymentMethod(null);
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
              setCompletedPaymentMethod('razorpay');
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
              setCompletedPaymentMethod(null);
              alert('Payment verification failed. Please contact support with your order details.');
              try {
                await refreshCart();
              } catch (refreshError) {
                console.error('❌ Failed to refresh cart:', refreshError);
              }
            }
          } catch (error) {
            console.error('❌ Payment verification error:', error);
            setCompletedPaymentMethod(null);
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
      setCompletedPaymentMethod(null);
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
    // Begin 2-second detailed loading and prevent double click
    setIsProcessing(true);
    setCompletedPaymentMethod(null);
    setIsOrderComplete(false);
    setOrderNumber('');
    // Start a visible 2-second countdown overlay for COD
    setCodCountdown(2);
    if (codCountdownTimerRef.current) {
      clearInterval(codCountdownTimerRef.current);
    }
    codCountdownTimerRef.current = setInterval(() => {
      setCodCountdown((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          if (codCountdownTimerRef.current) {
            clearInterval(codCountdownTimerRef.current);
            codCountdownTimerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    try {
      console.log('🛒 Placing COD order for amount:', grandTotal);
  // Ensure at least 2 seconds of loading before showing success
  const minDelay = new Promise((resolve) => setTimeout(resolve, 2000));
      const orderPromise = createOrder(grandTotal, 'cod');
      const [orderData] = await Promise.all([orderPromise, minDelay]);
      
      if (orderData.isDuplicate) {
        console.log('✅ Using existing order (duplicate detected):', orderData.orderNumber);
      } else {
        console.log('✅ New COD order created:', orderData.orderNumber);
      }
      
      setOrderNumber(orderData.orderNumber);
      setCompletedPaymentMethod('cod');
      setIsOrderComplete(true);
      
      try {
        await clearCart();
      } catch (cartError) {
        console.error('❌ Failed to clear cart after COD order:', cartError);
        // Don't fail the order if cart clear fails
      }
    } catch (error) {
      console.error('COD order error:', error);
      setIsOrderComplete(false);
      setOrderNumber('');
      setCompletedPaymentMethod(null);
      
      // More informative error message
      const errorMessage = error.response?.data?.message || 'Failed to place order. Please try again.';
      alert(errorMessage);
    } finally {
      // Cleanup countdown overlay
      if (codCountdownTimerRef.current) {
        clearInterval(codCountdownTimerRef.current);
        codCountdownTimerRef.current = null;
      }
      setCodCountdown(null);
      setIsProcessing(false);
    }
  };

  const handlePlaceOrder = async () => {
    // Enhanced duplicate order prevention
    if (isProcessing || !hasAcceptedTerms) {
      console.log('Order blocked - already processing or terms not accepted');
      return;
    }

    // Prevent rapid clicks within 2 seconds
    const now = Date.now();
    if (lastOrderAttempt && (now - lastOrderAttempt) < 2000) {
      console.log('Order blocked - too rapid clicking');
      return;
    }

    // Generate unique order attempt ID to track this specific request
    const attemptId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setLastOrderAttempt(now);
    setProcessingOrderId(attemptId);
    
    console.log(`Starting order attempt: ${attemptId}`);

    if (selectedPaymentMethod === 'razorpay') {
      await handleRazorpayPayment();
    } else {
      await handleCODOrder();
    }
    
    // Clear the processing order ID after completion
    setProcessingOrderId(null);
  };

if (isOrderComplete) {
    const isCodSuccess = completedPaymentMethod === 'cod';
    const isOnlineSuccess = completedPaymentMethod === 'razorpay';
    const successTitle = isCodSuccess ? 'Order placed — Cash on Delivery' : 'Payment confirmed';
    const successSubtitle = isCodSuccess
      ? 'Your COD order is confirmed. Please keep cash ready when your desserts arrive.'
      : 'Thank you for choosing La Patisserie. A confirmation email with your order details is on the way.';
    const paymentMethodLabel = isCodSuccess ? 'Cash on Delivery' : 'Online payment';
    const paymentStatusHint = isCodSuccess
      ? 'Payment will be collected at delivery.'
      : 'Payment captured successfully via Razorpay.';

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
            <h2 className="text-3xl font-semibold text-slate-900">{successTitle}</h2>
            <p className="mt-3 text-base text-slate-500">
              {successSubtitle}
            </p>

            {/* 3. Integrated Order Details */}
            <div className="mt-8 w-full border-t border-slate-200 pt-8">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">Order number</p>
                <p className="text-lg font-semibold text-slate-900">{orderNumber}</p>
              </div>
            </div>

            <div className="mt-6 w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Payment method</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{paymentMethodLabel}</p>
              <p className="mt-2 text-sm text-slate-600">{paymentStatusHint}</p>
              {isCodSuccess && (
                <p className="mt-2 text-sm text-slate-600">
                  No online charge was processed for this order. Please pay the delivery partner directly.
                </p>
              )}
              {isOnlineSuccess && (
                <p className="mt-2 text-sm text-slate-600">
                  You will receive a payment receipt via email shortly.
                </p>
              )}
            </div>

            {/* 4. Updated Button Styles (Sharp Corners) */}
            <div className="mt-8 sm:mt-10 flex w-full flex-col-reverse gap-3 sm:gap-4 sm:flex-row sm:justify-center px-2 sm:px-0">
              <HoverButton
                onClick={() => handleNavigateWithPanel('/')}
                text="Back to Home"
                hoverText="Go Home"
                variant="outline"
                size="medium"
                className="w-full sm:w-auto"
              />
              <HoverButton
                onClick={() => handleNavigateWithPanel('/products')}
                text="Browse Products"
                hoverText="View Products"
                variant="primary"
                size="medium"
                className="w-full sm:w-auto"
              />
              <HoverButton
                onClick={() => handleNavigateWithPanel('/orders')}
                text="My Orders"
                hoverText="View Orders"
                variant="secondary"
                size="medium"
                className="w-full sm:w-auto"
              />
            </div>
            {redirectCountdown !== null && (
              <p className="mt-4 text-sm text-slate-500">
                Redirecting to your orders in {Math.max(redirectCountdown, 0)} second{Math.max(redirectCountdown, 0) === 1 ? '' : 's'}...
              </p>
            )}
            
          </div>
        </div>

        {/* NGO Side Panel */}
        <NGOSidePanel isOpen={showNGOPanel} onClose={() => setShowNGOPanel(false)} />
      </div>
    );
  }

  // --- Location Error Page (Unchanged) ---
  if (showLocationError) {
    return (
      <div className="container mx-auto min-h-screen px-3 py-4 pt-4 sm:px-4 sm:py-8 sm:pt-8" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-4 sm:mb-6">
            <div className="hidden sm:flex">
              <HoverButton
                onClick={() => navigate('/checkout')}
                text="Back"
                hoverText="Back to Checkout"
                variant="outline"
                size="small"
                className="text-xs uppercase tracking-[0.22em]"
              />
            </div>
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
              <HoverButton
                onClick={() => navigate('/checkout')}
                text="Go Back to Checkout"
                hoverText="Return to Checkout"
                variant="outline"
                size="medium"
                className="w-full"
              />
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

  // Enhanced button disabled state with rapid click prevention
  const isPlaceOrderDisabled = isProcessing || !hasAcceptedTerms || cartItems.length === 0 || 
    (lastOrderAttempt && (Date.now() - lastOrderAttempt) < 2000);

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
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-[#733857]">La Patisserie</span>
                <span
                  className="text-xs font-semibold tracking-wide"
                  style={{ color: orderExperience.color }}
                >
                  {orderExperience.label}
                </span>
              </div>
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
                    const rawUnitPrice = pricing ? pricing.finalPrice : Number(item?.price) || 0;
                    const safeUnitPrice = Number.isFinite(rawUnitPrice) ? rawUnitPrice : 0;
                    const mrpValue = pricing ? pricing.mrp : rawUnitPrice;
                    const safeMrp = Number.isFinite(mrpValue) ? mrpValue : safeUnitPrice;
                    const discountPercentage = Number.isFinite(pricing?.discountPercentage) ? pricing.discountPercentage : 0;
                    const hasDiscount = discountPercentage > 0;
                    const lineTotal = safeUnitPrice * (item.quantity || 1);
                    const originalTotal = hasDiscount ? safeMrp * (item.quantity || 1) : lineTotal;

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
                          {hasDiscount && (
                            <OfferBadge label={`${discountPercentage}% OFF`} className="text-[10px]" />
                          )}
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <div className="flex items-center gap-2">
                              <span>
                                {formatCurrency(safeUnitPrice)} × {item.quantity}
                              </span>
                              {hasDiscount && (
                                <span className="text-[11px] text-slate-400 line-through">
                                  {formatCurrency(safeMrp)}
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              {hasDiscount && (
                                <div className="text-[11px] text-slate-400 line-through">
                                  {formatCurrency(originalTotal)}
                                </div>
                              )}
                              <span className="font-medium text-slate-900">{formatCurrency(lineTotal)}</span>
                            </div>
                          </div>
                          {hasDiscount && (
                            <span className="text-[11px] font-medium text-emerald-600">
                              {discountPercentage}% off applied
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

              <div className="mt-6 space-y-4">
                {/* Razorpay Payment Method */}
                <div className="relative">
                  <FlipButton
                    frontText="Pay Online"
                    backText="Razorpay Secure"
                    selected={isRazorpaySelected}
                    onClick={() => setSelectedPaymentMethod('razorpay')}
                    className="payment-method-flip w-full"
                  />
                  {isRazorpaySelected && (
                    <div className="mt-3 p-4 bg-[#f7eef3] border border-[#733857] rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <img src="/images/razorpay.svg" alt="Razorpay" className="h-4 w-auto" />
                        <span className="text-sm font-semibold text-[#733857]">Razorpay Secure Checkout</span>
                        <span className="text-xs bg-[#733857] text-white px-2 py-1 rounded">Recommended</span>
                      </div>
                      <p className="text-xs text-[#6f5260] mb-3">
                        Pay instantly with UPI, cards, net banking or wallets through Razorpay's protected gateway.
                      </p>
                      <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d4466]">
                        <span className="border border-[#d9c4cd] px-2 py-1 rounded">UPI</span>
                        <span className="border border-[#d9c4cd] px-2 py-1 rounded">Cards</span>
                        <span className="border border-[#d9c4cd] px-2 py-1 rounded">Net Banking</span>
                        <span className="border border-[#d9c4cd] px-2 py-1 rounded">Wallets</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cash on Delivery Method */}
                <div className="relative">
                  <FlipButton
                    frontText="Cash on Delivery"
                    backText="Pay at Doorstep"
                    selected={isCodSelected}
                    onClick={() => setSelectedPaymentMethod('cod')}
                    className="payment-method-flip w-full"
                  />
                  {isCodSelected && (
                    <div className="mt-3 p-4 bg-[#f1e8ed] border border-[#412434] rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <img src="/images/cod.svg" alt="Cash on Delivery" className="h-4 w-auto" />
                        <span className="text-sm font-semibold text-[#412434]">Cash on Delivery</span>
                      </div>
                      <p className="text-xs text-[#6f5260]">
                        Pay once your desserts arrive. We will reconfirm the order and bring an invoice along.
                      </p>
                    </div>
                  )}
                </div>
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

              <StyleButton
                onClick={handlePlaceOrder}
                disabled={isPlaceOrderDisabled}
                className="place-order-btn mt-6"
              >
                {(() => {
                  if (isProcessing) return isCodSelected ? 'Placing your order…' : 'Processing…';
                  if (lastOrderAttempt && (Date.now() - lastOrderAttempt) < 2000) return 'Please wait…';
                  if (!hasAcceptedTerms) return 'Accept terms to continue';
                  return placeOrderLabel;
                })()}
              </StyleButton>
              {/* COD detailed loading overlay */}
              {isProcessing && isCodSelected && !isOrderComplete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                  <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-xl">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#f5e3ea] border-t-[#733857]"></div>
                    <h3 className="text-lg font-semibold text-slate-900">Placing your COD order…</h3>
                    <p className="mt-2 text-sm text-slate-600">This takes about 2 seconds. Please don’t refresh or press back.</p>
                    {typeof codCountdown === 'number' && (
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#733857]">
                        About {Math.max(codCountdown, 0)} second{Math.max(codCountdown, 0) === 1 ? '' : 's'} remaining…
                      </p>
                    )}
                  </div>
                </div>
              )}
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