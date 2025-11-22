import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import api, { createOrderWithEmail, verifyPaymentWithEmail } from '../../services/apiService';
import { sendOrderPlacedEmail } from '../../services/orderEmailService';

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
  // Donation functionality with persistence
  const [donationAmount, setDonationAmount] = useState(() => {
    const saved = localStorage.getItem('lapatisserie_donation_amount');
    return saved ? parseInt(saved) : 0;
  });
  const [selectedDonation, setSelectedDonation] = useState(() => {
    const saved = localStorage.getItem('lapatisserie_selected_donation');
    return saved ? parseInt(saved) : null;
  });
  const [showDonationThanks, setShowDonationThanks] = useState(false);
  const [isEditingDonation, setIsEditingDonation] = useState(false);
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

  // Save donation data to localStorage
  useEffect(() => {
    localStorage.setItem('lapatisserie_donation_amount', donationAmount.toString());
  }, [donationAmount]);

  useEffect(() => {
    if (selectedDonation !== null) {
      localStorage.setItem('lapatisserie_selected_donation', selectedDonation.toString());
    } else {
      localStorage.removeItem('lapatisserie_selected_donation');
    }
  }, [selectedDonation]);

  // Donation helper functions
  const updateDonationAmount = useCallback((amount) => {
    setDonationAmount(amount);
    if (amount === 0) {
      localStorage.removeItem('lapatisserie_donation_amount');
    }
  }, []);

  const updateSelectedDonation = useCallback((amount) => {
    setSelectedDonation(amount);
  }, []);

  const clearDonationData = useCallback(() => {
    setDonationAmount(0);
    setSelectedDonation(null);
    localStorage.removeItem('lapatisserie_donation_amount');
    localStorage.removeItem('lapatisserie_selected_donation');
  }, []);

  // Handle navigation
  const handleNavigate = (path) => {
    clearAutoRedirect();
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
    const total = discountedCartTotal + deliveryCharge - appliedFreeCash + donationAmount;
    return isNaN(total) ? 0 : Math.max(0, total);
  }, [discountedCartTotal, deliveryCharge, appliedFreeCash, donationAmount]);

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
  const successPageRef = useRef(null);

  useEffect(() => {
    if (!isOrderComplete) {
      setCompletedPaymentMethod(null);
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

  useEffect(() => {
    if (!isOrderComplete) {
      return;
    }

    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      if (successPageRef.current) {
        successPageRef.current.scrollIntoView({ block: 'start', behavior: 'auto' });
      }
    };

    // Scroll immediately and shortly after layout settles
    scrollToTop();
    const recheck = setTimeout(scrollToTop, 60);

    return () => clearTimeout(recheck);
  }, [isOrderComplete]);

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
  // Log which API base will be used for order creation (Render API)
  const orderApiBase = import.meta.env.VITE_API_URL;
      console.log(`🧭 [Order] Creating order via API: ${orderApiBase || 'N/A'} (method: ${paymentMethod})`);
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

          // Free products should have 0 price
          const finalPrice = item.isFreeProduct ? 0 : pricing.finalPrice;
          const finalOriginalPrice = item.isFreeProduct ? 0 : pricing.mrp;

          return {
            productId: item.productId || item._id,
            productName: item.name || prod?.name || 'Product',
            quantity: item.quantity,
            price: finalPrice,
            originalPrice: finalOriginalPrice,
            variantIndex,
            variantLabel: variantLabel || '',
            variant: variantSnapshot,
            isFreeProduct: item.isFreeProduct || false
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
        donationDetails: donationAmount > 0 ? {
          donationAmount: donationAmount,
          initiativeName: 'கற்பிப்போம் பயிலகம் - Education Initiative',
          initiativeDescription: 'Supporting student education and learning resources'
        } : null,
        orderSummary: {
          cartTotal: discountedCartTotal,
          discountedTotal: discountedCartTotal,
          deliveryCharge: deliveryCharge,
          freeCashDiscount: appliedFreeCash,
          grandTotal: grandTotal
        }
      };

  // Route order creation to primary API (Render)
  const data = await createOrderWithEmail(orderData);

      // Fire post-order email ONLY for online payments at verification time (not here)
      // For COD, email is sent after order placement since there's no verification step
      // Note: Online payment email is sent in handleRazorpayPayment's handler after verification
      console.log('[Email] Order placed email will be sent after payment verification for online payments');

      // Log the outcome and expected email behavior
      if (data?.success !== false) {
        console.log(`✅ [Order] create-order success via ${orderApiBase || 'N/A'}`);
      } else {
        console.warn(`⚠️ [Order] create-order response indicated failure via ${orderApiBase || 'N/A'}`);
      }
      
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
            const verifyData = await verifyPaymentWithEmail({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature});
            if (verifyData.success) {
              console.log('✅ Payment verified successfully');
              // Log which API verified
              const verifyApiBase = import.meta.env.VITE_API_URL;
              console.log(`📬 [Order] Online payment verified via ${verifyApiBase || 'N/A'}`);
              setCompletedPaymentMethod('razorpay');
              setIsOrderComplete(true);
              setOrderNumber(verifyData.orderNumber);
              // Trigger order placed email (Vercel) after successful online payment verification
              if (verifyData.orderNumber && user?.email) {
                sendOrderPlacedEmail({
                  orderNumber: verifyData.orderNumber,
                  userEmail: user.email,
                  paymentMethod: 'razorpay',
                  grandTotal: grandTotal
                }).then(r => {
                  if (r?.success || r?.skipped) {
                    console.log('[Email] Online payment order email dispatched (or skipped).');
                  } else {
                    console.warn('[Email] Online payment email failure (non-blocking):', r?.error);
                  }
                }).catch(err => {
                  console.warn('[Email] Online payment email unexpected error:', err.message);
                });
              } else {
                console.log('[Email] Skipping online payment email (missing orderNumber or email)');
              }
              try {
                await clearCart();
                console.log('🧹 Cart cleared after successful payment');
                clearDonationData();
                console.log('💝 Donation data cleared after successful payment');
              } catch (cartError) {
                console.error('❌ Failed to clear cart after payment:', cartError);
              }
            } else {
              console.error('❌ Payment verification failed:', verifyData.message);
              const verifyApiBase = import.meta.env.VITE_API_URL;
              console.log(`🚫 [Order] Payment verification failed via ${verifyApiBase || 'N/A'} (email not triggered)`);
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
          contact: user?.phone || ''},
        theme: {
          color: '#733857',
          backdrop_color: 'rgba(115, 56, 87, 0.6)'},
        modal: {
          backdropclose: false,
          escape: true,
          handleback: true,
          confirm_close: true,
          ondismiss: async () => {
            console.log('🚫 Razorpay popup dismissed/cancelled by user');
            setIsProcessing(false);
            try {
              // Cancel the order on the same backend used for creation (Render)
              const cancelResponse = await fetch(`${import.meta.env.VITE_API_URL}/payments/cancel-order`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${user?.token || localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                  razorpay_order_id: orderData.orderId})});
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
          }}};
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
        const orderApiBase = import.meta.env.VITE_API_URL;
        console.log(`ℹ️ [Order] Duplicate COD order via ${orderApiBase || 'N/A'}`);
      } else {
        console.log('✅ New COD order created:', orderData.orderNumber);
        const orderApiBase = import.meta.env.VITE_API_URL;
        console.log(`📬 [Order] COD order placed via ${orderApiBase || 'N/A'}`);
      }
      
      setOrderNumber(orderData.orderNumber);
      setCompletedPaymentMethod('cod');
      setIsOrderComplete(true);

      // Fire post-order email for COD (skip if duplicate)
      if (!orderData.isDuplicate && orderData.orderNumber && user?.email) {
        sendOrderPlacedEmail({
          orderNumber: orderData.orderNumber,
          userEmail: user.email,
          paymentMethod: 'cod',
          grandTotal: grandTotal
        }).then(r => {
          if (r?.success || r?.skipped) {
            console.log('[Email] COD order placed email dispatched (or skipped).');
          } else {
            console.warn('[Email] COD order email failure (non-blocking):', r?.error);
          }
        }).catch(err => {
          console.warn('[Email] COD order email unexpected error:', err.message);
        });
      } else {
        console.log('[Email] Skipping COD order email (duplicate or missing data)');
      }
      
      try {
        await clearCart();
        clearDonationData();
        console.log('🧹 Cart and donation data cleared after COD order');
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
      <div
        ref={successPageRef}
        tabIndex={-1}
        className="min-h-screen  px-4 py-10"
        style={{  }}
      >
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

            {/* Education Initiative Thank You Banner */}
            {donationAmount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="mt-6 w-full border-2 border-[#733857]/20 bg-gradient-to-r from-amber-50/80 via-white to-pink-50/80 p-6 text-center shadow-sm"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: 'spring', stiffness: 300 }}
                className="flex justify-center mb-3"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-[#733857] to-[#8d4466] flex items-center justify-center">
                </div>
              </motion.div>                <h3 className="text-lg font-bold text-[#412434] mb-2">Thank You for Supporting Education</h3>
                <p className="text-sm text-[#8d4466] mb-3 leading-relaxed">
                  Your Rs.{donationAmount} contribution will help provide online learning resources to underprivileged children 
                  through our கற்றல் பயிலகம் initiative under Aramsei Payilagam.
                </p>
                
                <div className="bg-white/60 text-center">
                  <div className="flex items-center justify-center text-xs text-[#733857]">
                    <span className="font-medium">Your donation has been added to the Education Fund</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 4. Updated Button Styles (Sharp Corners) */}
            <div className="mt-8 sm:mt-10 flex w-full flex-col-reverse gap-3 sm:gap-4 sm:flex-row sm:justify-center px-2 sm:px-0">
              <HoverButton
                onClick={() => handleNavigate('/')}
                text="Back to Home"
                hoverText="Go Home"
                variant="outline"
                size="medium"
                className="w-full sm:w-auto"
              />
              <HoverButton
                onClick={() => handleNavigate('/products')}
                text="Browse Products"
                hoverText="View Products"
                variant="primary"
                size="medium"
                className="w-full sm:w-auto"
              />
              <HoverButton
                onClick={() => handleNavigate('/orders')}
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
      </div>
    );
  }

  // --- Location Error Page (Unchanged) ---
  if (showLocationError) {
    return (
      <div className="container mx-auto min-h-screen px-3 py-4 pt-4 sm:px-4 sm:py-8 sm:pt-8" style={{  }}>
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
    <div className="-mt-2 sm:-mt-3 md:-mt-4" style={{  }}>
      <ShopClosureOverlay overlayType="page" showWhenClosed={!isOpen}>
  <div className="min-h-screen bg-[#f8f5f6] pb-12 overflow-x-hidden">

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
                    
                    // Free products should have 0 price
                    const rawUnitPrice = item.isFreeProduct ? 0 : (pricing ? pricing.finalPrice : Number(item?.price) || 0);
                    const safeUnitPrice = Number.isFinite(rawUnitPrice) ? rawUnitPrice : 0;
                    const mrpValue = item.isFreeProduct ? 0 : (pricing ? pricing.mrp : rawUnitPrice);
                    const safeMrp = Number.isFinite(mrpValue) ? mrpValue : safeUnitPrice;
                    const discountPercentage = Number.isFinite(pricing?.discountPercentage) ? pricing.discountPercentage : 0;
                    const hasDiscount = discountPercentage > 0 && !item.isFreeProduct;
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
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-900">{item.name}</p>
                            {item.isFreeProduct && (
                              <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                                FREE
                              </span>
                            )}
                          </div>
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
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative bg-gradient-to-br from-amber-50 to-yellow-50 p-3 rounded-lg border-2"
                      style={{
                        borderColor: '#D4AF37',
                        boxShadow: '0 2px 8px rgba(212, 175, 55, 0.2)'
                      }}
                    >
                      <label className="relative flex items-center justify-between text-sm cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          <motion.div 
                            className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{
                              background: 'linear-gradient(135deg, #3E2723 0%, #5D4037 100%)',
                              boxShadow: '0 2px 4px rgba(62, 39, 35, 0.3)'
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <motion.div
                              initial={{ rotate: 0 }}
                              animate={{ rotate: useFreeCash ? 360 : 0 }}
                              transition={{ duration: 0.6, ease: 'easeInOut' }}
                            >
                              <svg className="w-4 h-4" style={{ color: '#D4AF37' }} fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
                              </svg>
                            </motion.div>
                          </motion.div>
                          <div>
                            <span className="font-semibold" style={{ color: '#3E2723' }}>
                              Apply Free Cash
                            </span>
                            <div className="text-xs" style={{ color: '#D4AF37' }}>
                              Save {formatCurrency(totalFreeCashAvailable)} instantly
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2.5">
                          <div className="text-right">
                            <div className="text-sm font-bold" style={{ color: '#D4AF37' }}>
                              {formatCurrency(totalFreeCashAvailable)}
                            </div>
                            <div className="text-xs" style={{ color: '#5D4037' }}>Available</div>
                          </div>
                          
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 border-2 bg-white focus:ring-2 rounded transition-all duration-300"
                              style={{ 
                                accentColor: '#D4AF37',
                                borderColor: '#D4AF37'
                              }}
                              checked={useFreeCash}
                              onChange={(e) => setUseFreeCash(e.target.checked)}
                            />
                          </motion.div>
                        </div>
                      </label>
                      
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ 
                          height: useFreeCash ? 'auto' : 0,
                          opacity: useFreeCash ? 1 : 0
                        }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 pt-2" style={{ borderTop: '1px solid #D4AF37' }}>
                          <div className="flex justify-between items-center p-2 rounded-lg" style={{ 
                            background: 'linear-gradient(135deg, #3E2723 0%, #5D4037 100%)',
                            boxShadow: '0 2px 6px rgba(212, 175, 55, 0.2)'
                          }}>
                            <div className="flex items-center gap-1.5">
                              <svg className="w-4 h-4" style={{ color: '#D4AF37' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="font-medium text-sm" style={{ color: '#FFD700' }}>Free Cash Applied</span>
                            </div>
                            <span className="font-bold text-sm" style={{ color: '#D4AF37' }}>
                              -{formatCurrency(appliedFreeCash)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                      
                      <motion.div
                        initial={{ height: 'auto', opacity: 1 }}
                        animate={{ 
                          height: useFreeCash ? 0 : 'auto',
                          opacity: useFreeCash ? 0 : 1
                        }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 pt-2" style={{ borderTop: '1px solid #D4AF37' }}>
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#5D4037' }}>
                            <svg className="w-3.5 h-3.5" style={{ color: '#D4AF37' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Check the box above to apply your free cash and save money!</span>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}

                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span className="font-medium text-slate-900">{formatCurrency(deliveryCharge)}</span>
                  </div>

                  {/* Show donation as a line item when selected */}
                  {donationAmount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex justify-between items-center py-1"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Donation to Hope Fund</span>
                        <svg className="w-3 h-3 text-[#733857]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                      <span className="font-medium text-[#733857]">+{formatCurrency(donationAmount)}</span>
                    </motion.div>
                  )}

                  {/* Charity Donation Widget */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between py-3 px-4 transition-all duration-300 relative"
                    style={{
                      background: 'linear-gradient(90deg, #dec4d7 0%, #f4e6f1 60%, rgba(255,255,255,0.95) 100%)',
                      clipPath: 'polygon(2% 0, 100% 0, 100% 100%, 0% 100%)',
                      boxShadow: '0 2px 4px rgba(115, 56, 87, 0.12)'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-semibold text-[#733857]">Donate to கற்பிப்போம் பயிலகம்</span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setShowDonationThanks(true)}
                          className="p-1 text-[#733857] hover:bg-[#733857]/10 rounded-full transition-all duration-200"
                          title="Learn more about this education initiative"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
                          </svg>
                        </motion.button>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 hover:border-[#733857]/40 transition-colors">
                        <span className="text-sm text-[#733857] font-medium">₹</span>
                        {isEditingDonation ? (
                          <motion.input
                            type="number"
                            min="1"
                            max="1000"
                            value={selectedDonation || ''}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              if (value >= 0) {
                                updateSelectedDonation(value);
                                // Don't auto-set donationAmount here
                              }
                            }}
                            onBlur={() => setIsEditingDonation(false)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setIsEditingDonation(false);
                              }
                            }}
                            autoFocus
                            whileFocus={{ scale: 1.02 }}
                            className="w-12 text-sm text-[#412434] bg-transparent text-center font-semibold"
                            placeholder="4"
                          />
                        ) : (
                          <span className="w-12 text-sm text-[#412434] text-center font-semibold">
                            {selectedDonation || 4}
                          </span>
                        )}
                        <motion.button
                          initial={{ opacity: 0.6 }}
                          animate={{ opacity: 0.8 }}
                          whileHover={{ opacity: 1, scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setIsEditingDonation(true);
                            // Reset donation state to allow re-adding
                            updateDonationAmount(0);
                          }}
                          className="ml-1 p-1.5 rounded-md bg-white border border-[#733857] hover:border-[#8d4466] transition-all duration-200"
                        >
                          <motion.svg 
                            className="w-3 h-3 text-[#733857]" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </motion.svg>
                        </motion.button>
                      </div>
                    </div>
                    
                    <motion.button
                      whileHover={{ 
                        scale: 1.05,
                        boxShadow: "0 3px 10px rgba(115, 56, 87, 0.25)"
                      }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.3 }}
                      onClick={() => {
                        if (donationAmount > 0) {
                          // Remove donation
                          updateDonationAmount(0);
                        } else {
                          // Add donation with current selected amount
                          const amount = selectedDonation || 4;
                          updateDonationAmount(amount);
                        }
                      }}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md border-2 border-[#733857] bg-white text-[#733857] transition-all duration-300 shadow-sm hover:shadow-lg hover:bg-[#733857] hover:text-white`}
                    >
                      <motion.span
                        transition={{ duration: 0.3 }}
                      >
                        {donationAmount > 0 ? 'ADDED' : 'ADD'}
                      </motion.span>
                    </motion.button>
                  </motion.div>

                  {/* Message when amount is selected but not added */}
                  {!donationAmount && selectedDonation > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2"
                    >
                      <div className="flex items-center gap-2 text-xs p-2 bg-purple-50/50 border-l-2 border-purple-300 rounded">
                        <svg className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span className="text-gray-600 italic">
                          Optional: Click <strong className="text-purple-600">ADD</strong> if you wish to contribute ₹{selectedDonation} to help students
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {/* Dynamic total update with enhanced styling */}
                  {donationAmount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 pt-3"
                    >
                      <div className="flex justify-between items-center text-sm p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[#8d4466] font-bold">Education Fund Contribution</span>
                        </div>
                        <span className="font-bold text-[#733857] text-lg">Rs.{donationAmount}</span>
                      </div>
                    </motion.div>
                  )}

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

            {/* --- Free Cash Information Section --- */}
          


            {/* --- Payment Card (Compact • Responsive) --- */}
              <div className="rounded-3xl border border-[#733857]/20 bg-white p-5 sm:p-6 lg:p-7 shadow-sm">
                {/* Heading */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <h1 className="text-lg sm:text-xl font-semibold uppercase tracking-[0.14em] text-[#1a1a1a]">Payment</h1>
                    <p className="text-xs sm:text-[11px] uppercase tracking-[0.14em] text-[rgba(26,26,26,0.55)]">Select a method</p>
                  </div>
                </div>

                {/* Methods as tiles */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Razorpay */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('razorpay')}
                    className={`group flex items-center justify-between rounded-2xl border px-4 py-4 sm:px-5 sm:py-5 transition-all ${
                      isRazorpaySelected
                        ? 'border-[#733857] bg-[#f8f0f4] ring-2 ring-[#733857]/40'
                        : 'border-slate-200 hover:border-[#733857]/50 bg-white'
                    }`}
                    aria-pressed={isRazorpaySelected}
                  >
                    <div className="flex items-center gap-3">
                      <img src="/images/razorpay.svg" alt="Razorpay" className="h-5 w-auto" />
                      <div className="text-left">
                        <p className="text-sm sm:text-base font-semibold text-[#412434]">Pay Online</p>
                        <p className="mt-0.5 text-[11px] sm:text-xs text-[#6f5260]">UPI • Card • Netbanking • Wallet</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] sm:text-xs font-bold rounded-full px-2 py-1 ${
                        isRazorpaySelected ? 'bg-[#733857] text-white' : 'bg-slate-100 text-[#733857]'
                      }`}
                    >
                      Secure
                    </span>
                  </button>

                  {/* COD */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('cod')}
                    className={`group flex items-center justify-between rounded-2xl border px-4 py-4 sm:px-5 sm:py-5 transition-all ${
                      isCodSelected
                        ? 'border-[#412434] bg-[#f3edf0] ring-2 ring-[#412434]/30'
                        : 'border-slate-200 hover:border-[#412434]/50 bg-white'
                    }`}
                    aria-pressed={isCodSelected}
                  >
                    <div className="flex items-center gap-3">
                      <img src="/images/cod.svg" alt="Cash on Delivery" className="h-5 w-auto" />
                      <div className="text-left">
                        <p className="text-sm sm:text-base font-semibold text-[#412434]">Cash on Delivery</p>
                        <p className="mt-0.5 text-[11px] sm:text-xs text-[#6f5260]">Pay at your doorstep</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] sm:text-xs font-bold rounded-full px-2 py-1 ${
                        isCodSelected ? 'bg-[#412434] text-white' : 'bg-slate-100 text-[#412434]'
                      }`}
                    >
                      COD
                    </span>
                  </button>
                </div>

                {/* Short helper bar */}
                <div className="mt-4 rounded-lg border border-dashed border-[#d9c4cd] bg-[#f9f4f6] px-4 py-3 sm:px-5 text-[12px] sm:text-xs text-[#412434]">
                  {isRazorpaySelected ? (
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <span className="font-semibold text-[#733857] uppercase tracking-[0.12em]">Razorpay</span>
                      <span className="text-[#6f5260]">Pay {formatCurrency(grandTotal)} securely</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <span className="font-semibold text-[#412434] uppercase tracking-[0.12em]">Pay on delivery</span>
                      <span className="text-[#6f5260]">Have {formatCurrency(grandTotal)} ready</span>
                    </div>
                  )}
                </div>

                {/* Terms */}
                <label className="mt-5 flex items-start gap-3 text-[12px] sm:text-[13px] text-slate-600">
                  <input
                    type="checkbox"
                    checked={hasAcceptedTerms}
                    onChange={(e) => setHasAcceptedTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 border border-slate-400 text-[#733857] focus:ring-[#733857]"
                  />
                  <span>
                    I accept the <a href="/terms" className="text-[#733857] underline">terms</a> and <a href="/privacy-policy" className="text-[#733857] underline">privacy</a>.
                  </span>
                </label>

                {!hasAcceptedTerms && (
                  <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-[rgba(26,26,26,0.55)]">Accept terms to continue</p>
                )}

                {/* CTA */}
                <StyleButton
                  onClick={handlePlaceOrder}
                  disabled={isPlaceOrderDisabled}
                  className="place-order-btn mt-5"
                >
                  {(() => {
                    if (isProcessing) return isCodSelected ? 'Placing order…' : 'Processing…';
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

      {/* Donation Information Modal */}
      {showDonationThanks && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDonationThanks(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 "
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
             
              
              <h3 className="text-xl font-bold text-[#412434] mb-2">கற்பிப்போம் பயிலகம் - Education Initiative</h3>
              <p className="text-sm text-[#8d4466] mb-4 leading-relaxed">
                An Initiative under Aramsei Payilagam providing FREE ONLINE CLASSES to underprivileged children. 
                Your contribution helps provide educational resources and technology access.
              </p>
              
             

             
            </div>
          </motion.div>
        </motion.div>
      )}

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