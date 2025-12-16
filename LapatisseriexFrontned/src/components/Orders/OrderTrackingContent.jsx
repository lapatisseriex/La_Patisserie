import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, Truck, CheckCircle, MapPin, CreditCard, Banknote, Calendar, X, BadgeCheck, ChefHat, Home } from 'lucide-react';
import { calculatePricing } from '../../utils/pricingUtils';
import { resolveOrderItemVariantLabel } from '../../utils/variantUtils';
import OfferBadge from '../common/OfferBadge';
import { useAuth } from '../../hooks/useAuth';
import { getOrderExperienceInfo } from '../../utils/orderExperience';
import { longTimeoutAxiosInstance } from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import webSocketService from '../../services/websocketService';
import './OrderCard.css';

const OrderTrackingContent = ({ order, onOrderUpdate }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const orderExperience = useMemo(() => getOrderExperienceInfo(user), [user]);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [localOrder, setLocalOrder] = useState(order);
  const dialogRef = useRef(null);

  // Listen for WebSocket order status updates
  useEffect(() => {
    // Ensure WebSocket is connected with MongoDB user ID (not Firebase UID)
    // _id is the MongoDB ObjectId which is used for notifications and WebSocket mapping
    const userId = user?._id;
    if (userId) {
      console.log('🔌 OrderTracking: Ensuring WebSocket connection for user:', userId);
      webSocketService.connect(userId);
    } else if (user) {
      console.warn('⚠️ No MongoDB _id found in user object. User:', user);
    }

    const handleOrderStatusUpdate = (data) => {
      console.log('📦 Order status update received:', data);
      
      // Check if this update is for the current order
      if (data.orderNumber === localOrder.orderNumber) {
        console.log('✅ Update matches current order, showing toast');
        
        // Show toast notification
        toast.info(data.message || 'Order status updated. Refresh to see changes.', {
          position: 'top-center',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          icon: '🚚'
        });

        // Update local order status
        setLocalOrder(prev => ({
          ...prev,
          orderStatus: data.status
        }));

        // Notify parent component if callback provided
        if (onOrderUpdate) {
          onOrderUpdate(data);
        }
      }
    };

    // Subscribe to order status updates
    webSocketService.onOrderStatusUpdate(handleOrderStatusUpdate);

    // Cleanup on unmount - only unsubscribe, don't disconnect
    return () => {
      webSocketService.offOrderStatusUpdate(handleOrderStatusUpdate);
    };
  }, [localOrder.orderNumber, onOrderUpdate, user?._id]); // Only depend on _id, not entire user object

  // Update local order when prop changes
  useEffect(() => {
    setLocalOrder(order);
  }, [order]);
  const formatAmount = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.round(parsed) : 0;
  };
  const cartItemsWithPricing = useMemo(() => {
    if (!localOrder?.cartItems) return [];

    return localOrder.cartItems.map((item) => {
      const pricing = item?.variant ? calculatePricing(item.variant) : null;
      const parsedMrp = Number.isFinite(pricing?.mrp) ? pricing.mrp : Number(item?.originalPrice);
      const parsedPrice = Number.isFinite(pricing?.finalPrice) ? pricing.finalPrice : Number(item?.price);
      const unitMrp = Number.isFinite(parsedMrp) ? parsedMrp : Number.isFinite(parsedPrice) ? parsedPrice : 0;
      const unitFinalPrice = Number.isFinite(parsedPrice) ? parsedPrice : unitMrp;
      const quantity = Number.isFinite(Number(item?.quantity)) ? Number(item.quantity) : 0;
      const originalLineTotal = unitMrp * quantity;
      const lineTotal = unitFinalPrice * quantity;
      const inferredDiscount = unitMrp > 0 ? Math.max(0, Math.round(((unitMrp - unitFinalPrice) / unitMrp) * 100)) : 0;
      const discountPercentage = Number.isFinite(pricing?.discountPercentage)
        ? pricing.discountPercentage
        : inferredDiscount;
      const hasDiscount = unitMrp > unitFinalPrice && discountPercentage > 0;

      return {
        ...item,
        quantity,
        unitMrp,
        unitFinalPrice,
        lineTotal,
        originalLineTotal,
        discountPercentage,
        hasDiscount,
        variantLabel: resolveOrderItemVariantLabel(item)
      };
    });
  }, [localOrder?.cartItems]);
  const summary = useMemo(() => {
    if (!localOrder) return null;

    const parseAmount = (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const rawSummary = localOrder.orderSummary || {};
    const subtotalFromSummary = parseAmount(rawSummary.cartTotal ?? rawSummary.subtotal);
    const discountedTotalFromSummary = parseAmount(
      rawSummary.discountedTotal ?? rawSummary.discountedCartTotal ?? rawSummary.totalAfterDiscount
    );
    const discountFromSummary = parseAmount(rawSummary.totalDiscount ?? rawSummary.discount);
    const deliveryChargeFromSummary = parseAmount(rawSummary.deliveryCharge);
    const freeCashUsedFromSummary = parseAmount(rawSummary.freeCashDiscount ?? rawSummary.freeCashUsed);
    const grandTotalFromSummary = parseAmount(rawSummary.grandTotal ?? rawSummary.finalAmount);

    const derivedTotals = cartItemsWithPricing.reduce(
      (acc, item) => {
        acc.subtotal += item.originalLineTotal;
        acc.discounted += item.lineTotal;
        return acc;
      },
      { subtotal: 0, discounted: 0 }
    );

    const resolvedSubtotal = derivedTotals.subtotal > 0
      ? derivedTotals.subtotal
      : Math.max(0, subtotalFromSummary ?? 0);

    const resolvedDiscounted = derivedTotals.discounted > 0
      ? derivedTotals.discounted
      : Math.max(0, discountedTotalFromSummary ?? grandTotalFromSummary ?? resolvedSubtotal);

    let discountTotal = Number.isFinite(discountFromSummary)
      ? discountFromSummary
      : resolvedSubtotal - resolvedDiscounted;
  discountTotal = Math.max(0, Number.isFinite(discountTotal) ? Math.abs(discountTotal) : 0);
    const deliveryChargeRaw = deliveryChargeFromSummary ?? parseAmount(localOrder?.deliveryCharge);
    const deliveryCharge = Math.max(0, Number.isFinite(deliveryChargeRaw) ? deliveryChargeRaw : 0);
    const freeCashRaw = freeCashUsedFromSummary ?? parseAmount(localOrder?.freeCashUsed);
    const freeCashUsed = Math.max(0, Number.isFinite(freeCashRaw) ? Math.abs(freeCashRaw) : 0);
    const computedGrandTotal = resolvedDiscounted + deliveryCharge - freeCashUsed;
    const grandTotal = Math.max(0, grandTotalFromSummary ?? computedGrandTotal);

    return {
      subtotal: resolvedSubtotal,
      discountedTotal: resolvedDiscounted,
      discountTotal,
      deliveryCharge,
      freeCashUsed,
      grandTotal};
  }, [localOrder, cartItemsWithPricing]);
  
  if (!localOrder) return null;

  const handleProductClick = (item) => {
    // Try multiple possible product ID paths
    const productId = item?.productId?._id || item?.productId || item?._id || item?.id;
    
    if (productId) {
      navigate(`/product/${productId}`);
    } else {
      console.log('Product ID not found for navigation:', item);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      'pending': {
        icon: Package,
        color: '#6b7280',
        label: 'PAYMENT PENDING'
      },
      'placed': {
        icon: Package,
        color: '#733857',
        label: 'ORDER PLACED'
      },
      'confirmed': {
        icon: CheckCircle,
        color: '#10b981',
        label: 'CONFIRMED'
      },
      'preparing': {
        icon: Clock,
        color: '#f59e0b',
        label: 'PREPARING'
      },
      'ready': {
        icon: CheckCircle,
        color: '#7c3aed',
        label: 'READY FOR DISPATCH'
      },
      'out_for_delivery': {
        icon: Truck,
        color: '#8d4466',
        label: 'OUT FOR DELIVERY'
      },
      'delivered': {
        icon: CheckCircle,
        color: '#059669',
        label: 'DELIVERED'
      },
      'cancelled': {
        icon: Package,
        color: '#dc2626',
        label: 'CANCELLED'
      }
    };
    return configs[status] || configs['placed'];
  };

  // Check if order can be cancelled
  // Rules:
  // 1. Order must not be in out_for_delivery, delivered, or cancelled status
  // 2. ONLY COD orders can be cancelled (offline payment)
  // 3. Razorpay/online paid orders CANNOT be cancelled
  const canCancel = !['out_for_delivery', 'delivered', 'cancelled'].includes(localOrder.orderStatus)
                    && localOrder.paymentMethod === 'cod';

  const handleCancelClick = () => {
    if (dialogRef.current) {
      if (dialogRef.current.open) {
        return;
      }
      setCancelReason('');
      setIsCancelling(false);
      setShowCancelConfirm(true);
      dialogRef.current.showModal();
    }
  };

  const handleDialogClose = () => {
    setShowCancelConfirm(false);
  };

  const handleDialogCancel = (event) => {
    if (isCancelling) {
      event.preventDefault();
    }
  };

  const closeCancelDialog = () => {
    if (dialogRef.current?.open) {
      dialogRef.current.close();
    }
  };

  const handleKeepOrder = () => {
    setIsCancelling(false);
    closeCancelDialog();
    setCancelReason('');
  };

  const handleCancelConfirm = async () => {
    const reasonToSend = cancelReason || 'Cancelled by user';
    setIsCancelling(true);
    setShowCancelConfirm(false);
    closeCancelDialog();

    try {
      const token = localStorage.getItem('authToken');
      await longTimeoutAxiosInstance.put(
        `${import.meta.env.VITE_API_URL}/payments/orders/${localOrder.orderNumber}/cancel`,
        { cancelReason: reasonToSend },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Show success message
        toast.success('One order cancelled', {
        position: "top-center",
        autoClose: 3000});

        // Best-effort WebSocket notify so Admin sees live banner
        try {
          const sock = webSocketService.getSocket?.();
          if (sock && sock.connected) {
            sock.emit('orderCancelled', { orderNumber: localOrder.orderNumber });
            sock.emit('orderStatusUpdated', { orderNumber: localOrder.orderNumber, status: 'cancelled' });
          }
        } catch {}

      // Delay navigation to show the success message
      setTimeout(() => {
        navigate('/orders');
      }, 1000);
    } catch (error) {
      console.error('Error cancelling order:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to cancel order. Please try again.';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'The cancellation is taking longer than expected. Please check your orders page to see if the order was cancelled.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || 'Order cannot be cancelled at this stage.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You are not authorized to cancel this order.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Order not found.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again in a few moments.';
      }
      
      // Use toast for better user experience
      toast.error(errorMessage, {
        position: "top-center",
        autoClose: 5000});
    } finally {
      setIsCancelling(false);
      setCancelReason('');
    }
  };

  const StatusTimeline = ({ order }) => {
    const orderStatus = order?.orderStatus || 'placed';
    const baseSequence = ['placed', 'out_for_delivery', 'delivered'];

    let sequence = [...baseSequence];
    if (orderStatus === 'cancelled') {
      sequence = ['placed', 'cancelled'];
    }

    const timelineGradient = 'linear-gradient(135deg, #733857 0%, #8d4466 50%, #412434 100%)';
    const successGradient = 'linear-gradient(135deg, #059669 0%, #10b981 100%)';
    const dangerGradient = 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)';

    const timelineConfig = {
      pending: {
        label: 'Awaiting payment confirmation',
        description: 'We are waiting for the payment gateway to confirm your order.',
        icon: Clock,
        accent: '#6b7280'
      },
      placed: {
        label: 'Order placed',
        description: 'We’ve received your order and shared the details with our kitchen.',
        icon: CreditCard,
        accent: '#733857'
      },
      confirmed: {
        label: 'Order confirmed',
        description: 'Our pastry team has confirmed your order and locked the schedule.',
        icon: BadgeCheck,
        accent: '#8d4466'
      },
      preparing: {
        label: 'Preparing your desserts',
        description: 'Your desserts are being handcrafted by our chefs.',
        icon: ChefHat,
        accent: '#f59e0b'
      },
      ready: {
        label: 'Packed & ready',
        description: 'Your order is packed and ready for dispatch.',
        icon: Package,
        accent: '#6366f1'
      },
      out_for_delivery: {
        label: 'Out for delivery',
        description: 'Our delivery partner is on the way to your location.',
        icon: Truck,
        accent: '#8d4466'
      },
      delivered: {
        label: 'Delivered',
        description: 'Order successfully delivered. Enjoy your treats!',
        icon: Home,
        accent: '#059669'
      },
      cancelled: {
        label: 'Cancelled',
        description: 'This order was cancelled. Contact support if you need assistance.',
        icon: X,
        accent: '#dc2626'
      }
    };

    const statusTimestamps = (() => {
      const map = {};
      if (!order) return map;

      const candidateCollections = [
        order?.statusHistory,
        order?.statusTimeline,
        order?.statusLogs,
        order?.statusUpdates,
        order?.timeline
      ];

      candidateCollections.forEach((collection) => {
        if (Array.isArray(collection)) {
          collection.forEach((entry) => {
            if (!entry) return;
            const key = entry.status || entry.state || entry.key;
            const value = entry.timestamp || entry.time || entry.date || entry.updatedAt || entry.createdAt;
            if (key && value && !map[key]) {
              map[key] = value;
            }
          });
        } else if (collection && typeof collection === 'object') {
          Object.entries(collection).forEach(([key, value]) => {
            if (!key || value === undefined || value === null || map[key]) return;
            if (typeof value === 'object') {
              map[key] = value.timestamp || value.time || value.date || value.updatedAt || value.createdAt;
            } else {
              map[key] = value;
            }
          });
        }
      });

      if (order?.createdAt && !map.placed) {
        map.placed = order.createdAt;
      }
      if (order?.paymentStatus === 'pending' && order?.createdAt && !map.pending) {
        map.pending = order.createdAt;
      }
      if (order?.estimatedDeliveryTime) {
        map.ready = map.ready || order.estimatedDeliveryTime;
        map.out_for_delivery = map.out_for_delivery || order.estimatedDeliveryTime;
      }
      if (order?.actualDeliveryTime) {
        map.delivered = map.delivered || order.actualDeliveryTime;
      } else if (order.orderStatus === 'delivered' && order.updatedAt) {
        map.delivered = map.delivered || order.updatedAt;
      }
      if (order.cancelledAt) {
        map.cancelled = map.cancelled || order.cancelledAt;
      } else if (order.orderStatus === 'cancelled' && order.updatedAt) {
        map.cancelled = map.cancelled || order.updatedAt;
      }

      if (!map.out_for_delivery && map.ready) {
        map.out_for_delivery = map.ready;
      }
      if (!map.placed && (order.createdAt || orderStatus === 'placed')) {
        map.placed = order.createdAt || order.updatedAt;
      }

      return map;
    })();

    const formatTimestamp = (statusKey) => {
      const raw = statusTimestamps?.[statusKey];
      if (!raw) return null;
      const date = new Date(raw);
      if (Number.isNaN(date.getTime())) return null;
      return {
        dateLabel: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        timeLabel: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };
    };

    const statusAliasMap = {
      pending: 'placed',
      confirmed: 'placed',
      preparing: 'placed',
      ready: 'out_for_delivery'
    };

    const normalizedStatus = (() => {
      if (sequence.includes(orderStatus)) return orderStatus;
      if (orderStatus === 'cancelled') return 'cancelled';
      const alias = statusAliasMap[orderStatus];
      return alias && sequence.includes(alias) ? alias : sequence[0];
    })();

    const currentIndex = Math.max(0, sequence.indexOf(normalizedStatus));

    const buildVisuals = (statusKey, state) => {
      const config = timelineConfig[statusKey] || timelineConfig.placed;
      const accent = config.accent || '#733857';

      const baseCircle = {
        backgroundColor: '#ffffff',
        color: accent,
        border: `2px solid ${statusKey === 'pending' ? 'rgba(107, 114, 128, 0.35)' : 'rgba(115, 56, 87, 0.2)'}`,
        boxShadow: 'none',
        transform: 'scale(1)'
      };

      if (state === 'complete') {
        return {
          config,
          circleStyles: {
            backgroundColor: statusKey === 'delivered' ? '#059669' : statusKey === 'cancelled' ? '#dc2626' : accent,
            color: '#ffffff',
            border: 'none',
            boxShadow: statusKey === 'delivered'
              ? '0 6px 18px rgba(5, 150, 105, 0.25)'
              : statusKey === 'cancelled'
                ? '0 6px 18px rgba(220, 38, 38, 0.25)'
                : '0 6px 18px rgba(115, 56, 87, 0.22)',
            transform: 'scale(1)'
          },
          iconColor: '#ffffff',
          labelColor: statusKey === 'cancelled' ? '#b91c1c' : '#733857',
          descriptionColor: 'rgba(26, 26, 26, 0.6)',
          timestampColor: 'rgba(26, 26, 26, 0.6)'
        };
      }

      if (state === 'current') {
        return {
          config,
          circleStyles: {
            background: statusKey === 'delivered'
              ? successGradient
              : statusKey === 'cancelled'
                ? dangerGradient
                : timelineGradient,
            color: '#ffffff',
            border: 'none',
            boxShadow: statusKey === 'delivered'
              ? '0 10px 24px rgba(5, 150, 105, 0.30)'
              : statusKey === 'cancelled'
                ? '0 10px 24px rgba(220, 38, 38, 0.30)'
                : '0 10px 24px rgba(115, 56, 87, 0.28)',
            transform: 'scale(1.05)'
          },
          iconColor: '#ffffff',
          labelColor: statusKey === 'cancelled' ? '#b91c1c' : '#733857',
          descriptionColor: 'rgba(26, 26, 26, 0.65)',
          timestampColor: 'rgba(26, 26, 26, 0.6)'
        };
      }

      return {
        config,
        circleStyles: baseCircle,
        iconColor: accent,
        labelColor: 'rgba(26, 26, 26, 0.45)',
        descriptionColor: 'rgba(26, 26, 26, 0.4)',
        timestampColor: 'rgba(26, 26, 26, 0.35)'
      };
    };

    const getConnectorGradient = (currentStatus, nextStatus) => {
      if (nextStatus === 'cancelled') {
        return dangerGradient;
      }
      if (nextStatus === 'delivered' || currentStatus === 'delivered') {
        return successGradient;
      }
      return timelineGradient;
    };

    const renderDesktopStep = (statusKey, index) => {
      const state = index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming';
      const { config, circleStyles, iconColor, labelColor, descriptionColor, timestampColor } = buildVisuals(statusKey, state);
      const timestamp = formatTimestamp(statusKey);
      const IconComponent = config.icon || Package;

      return (
        <div
          key={statusKey}
          className="flex flex-col items-center text-center gap-3"
          style={{ minWidth: '8.5rem', flex: '0 0 8.5rem' }}
        >
          <div
            className={`flex items-center justify-center rounded-full transition-all duration-300 ${state === 'current' ? 'w-14 h-14' : 'w-12 h-12'}`}
            style={circleStyles}
          >
            <IconComponent className="w-5 h-5" style={{ color: iconColor }} />
          </div>
          <div className="space-y-2">
            <p
              className="text-sm font-semibold uppercase tracking-[0.18em]"
              style={{ color: labelColor }}
            >
              {config.label}
            </p>
            {timestamp ? (
              <p className="text-xs font-medium" style={{ color: timestampColor }}>
                {timestamp.dateLabel} • {timestamp.timeLabel}
              </p>
            ) : (
              <p className="text-xs font-medium italic" style={{ color: 'rgba(26, 26, 26, 0.35)' }}>
                Awaiting update
              </p>
            )}
            <p
              className="text-xs leading-relaxed max-w-[180px] mx-auto"
              style={{ color: descriptionColor }}
            >
              {config.description}
            </p>
            {state === 'current' && (
              <div
                className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full"
                style={{
                  backgroundColor: statusKey === 'cancelled' ? 'rgba(220, 38, 38, 0.12)' : 'rgba(115, 56, 87, 0.12)',
                  color: statusKey === 'cancelled' ? '#b91c1c' : '#733857'
                }}
              >
                {statusKey === 'cancelled' ? 'Order cancelled' : 'Current status'}
              </div>
            )}
          </div>
        </div>
      );
    };

    const renderConnector = (index) => {
      if (index >= sequence.length - 1) return null;
      const connectorFilled = index < currentIndex;
      const currentStatus = sequence[index];
      const nextStatus = sequence[index + 1];
      const connectorGradient = getConnectorGradient(currentStatus, nextStatus);

      return (
        <div
          key={`connector-${currentStatus}`}
          className="h-0.5 relative top-8 mx-3"
          style={{ flex: '0 0 110px', minWidth: '110px' }}
        >
          <div className="w-full h-0.5 bg-gray-200 rounded-full"></div>
          <div
            className="absolute top-0 left-0 h-0.5 rounded-full transition-all duration-500 ease-out"
            style={{
              width: connectorFilled ? '100%' : '0%',
              background: connectorGradient
            }}
          ></div>
        </div>
      );
    };

    const renderMobileStep = (statusKey, index) => {
      const state = index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming';
      const { config, circleStyles, iconColor, labelColor, descriptionColor, timestampColor } = buildVisuals(statusKey, state);
      const timestamp = formatTimestamp(statusKey);
      const IconComponent = config.icon || Package;

      return (
        <div key={`mobile-${statusKey}`} className="relative pl-14">
          <div className="absolute left-0 top-1 flex flex-col items-center">
            <div
              className={`flex items-center justify-center rounded-full transition-all duration-300 ${state === 'current' ? 'w-12 h-12' : 'w-10 h-10'}`}
              style={circleStyles}
            >
              <IconComponent className="w-5 h-5" style={{ color: iconColor }} />
            </div>
            {index < sequence.length - 1 && (
              <div className="w-px h-14 mt-3 bg-gray-200">
                <div
                  className="w-px rounded-full transition-all duration-500 ease-out"
                  style={{
                    height: index < currentIndex ? '100%' : '0%',
                    background: getConnectorGradient(statusKey, sequence[index + 1])
                  }}
                ></div>
              </div>
            )}
          </div>
          <div className="pb-8">
            <p
              className="text-sm font-semibold uppercase tracking-[0.14em]"
              style={{ color: labelColor }}
            >
              {config.label}
            </p>
            {timestamp ? (
              <p className="text-xs font-medium mt-1" style={{ color: timestampColor }}>
                {timestamp.dateLabel} • {timestamp.timeLabel}
              </p>
            ) : (
              <p className="text-xs font-medium italic mt-1" style={{ color: 'rgba(26, 26, 26, 0.35)' }}>
                Awaiting update
              </p>
            )}
            <p
              className="text-xs leading-relaxed mt-2"
              style={{ color: descriptionColor }}
            >
              {config.description}
            </p>
            {state === 'current' && (
              <div
                className="inline-flex items-center mt-3 px-3 py-1 text-xs font-semibold rounded-full"
                style={{
                  backgroundColor: statusKey === 'cancelled' ? 'rgba(220, 38, 38, 0.12)' : 'rgba(115, 56, 87, 0.12)',
                  color: statusKey === 'cancelled' ? '#b91c1c' : '#733857'
                }}
              >
                {statusKey === 'cancelled' ? 'Order cancelled' : 'Current status'}
              </div>
            )}
          </div>
        </div>
      );
    };

    return (
      <div className="w-full">
        <div className="hidden sm:block">
          <div className="overflow-x-auto pb-6 -mx-4 sm:-mx-6">
            <div className="flex items-start gap-0 min-w-max px-4 sm:px-6">
              {sequence.map((statusKey, index) => (
                <React.Fragment key={`desktop-${statusKey}`}>
                  {renderDesktopStep(statusKey, index)}
                  {renderConnector(index)}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="sm:hidden flex flex-col gap-6 mt-2">
          {sequence.map((statusKey, index) => renderMobileStep(statusKey, index))}
        </div>
      </div>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusConfig = getStatusConfig(localOrder.orderStatus);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto px-4 sm:px-0">
      {/* Order Header Card - Responsive */}
      <div 
        className="bg-white border border-gray-100 p-4 sm:p-6 rounded-lg"
        style={{ 
          animation: 'fadeIn 0.3s ease-out',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}
      >
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4 sm:gap-0">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-light mb-1" style={{ color: '#1a1a1a' }}>
              Order #{localOrder.orderNumber}
            </h2>
            <div className="flex items-center text-sm" style={{ color: 'rgba(26, 26, 26, 0.5)' }}>
              <Calendar className="w-4 h-4 mr-1.5" />
              Placed on {formatDate(localOrder.createdAt)} at {formatTime(localOrder.createdAt)}
            </div>
            <div className="mt-2">
              <span
                className="text-xs font-semibold tracking-wide"
                style={{ color: orderExperience.color }}
              >
                {orderExperience.label}
              </span>
            </div>
          </div>
          
          {/* Status Badge - Responsive */}
          <div
            className="flex items-center gap-2 sm:gap-2.5 px-3 py-2 rounded-lg sm:rounded-none sm:px-3 sm:py-1.5 self-start sm:self-auto"
            style={{ backgroundColor: 'rgba(115, 56, 87, 0.05)' }}
          >
            {(() => {
              // Get appropriate PNG based on status
              const statusToPng = {
                'placed': '/checkout.png',
                'confirmed': '/support.png',
                'preparing': '/clock.png',
                'ready': '/delivery.png',
                'out_for_delivery': '/market-capitalization.png',
                'delivered': '/delivery-box.png',
                'pending': '/checkout.png',
                'cancelled': '/checkout.png'
              };
              return (
                <img 
                  src={statusToPng[localOrder.orderStatus] || '/checkout.png'} 
                  alt={statusConfig.label}
                  className="w-4 h-4 sm:w-5 sm:h-5" 
                  style={{ 
                    filter: `hue-rotate(${statusConfig.color === '#733857' ? '0deg' : statusConfig.color === '#10b981' ? '90deg' : '30deg'}) saturate(1.5)`
                  }}
                />
              );
            })()}
            <span 
              className="text-xs sm:text-sm font-bold tracking-wide sm:tracking-widest"
              style={{ color: statusConfig.color }}
            >
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Total Amount - Responsive */}
        <div className="pt-3 sm:pt-4 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-sm" style={{ color: 'rgba(26, 26, 26, 0.6)' }}>Total Amount</span>
            <span className="text-xl sm:text-2xl font-medium" style={{ color: '#733857' }}>
              ₹{formatAmount(summary?.grandTotal ?? localOrder.amount ?? 0)}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center mt-2 text-sm gap-2 sm:gap-0" style={{ color: 'rgba(26, 26, 26, 0.5)' }}>
            <div className="flex items-center">
              {localOrder.paymentMethod === 'cod' ? (
                <>
                  <Banknote className="w-4 h-4 mr-1.5" />
                  Cash on Delivery
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-1.5" />
                  Paid Online
                </>
              )}
            </div>
            <span className="hidden sm:inline mx-2">•</span>
            <span>Payment {localOrder.paymentStatus}</span>
          </div>
        </div>
      </div>

      {/* Order Progress - Responsive */}
      <div 
        className="bg-white border border-gray-100 p-4 sm:p-6 rounded-lg"
        style={{ 
          animation: 'fadeIn 0.4s ease-out 0.1s both',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}
      >
        <h3 className="text-base sm:text-lg font-medium mb-4 sm:mb-6" style={{ color: '#1a1a1a' }}>
          Order Progress
        </h3>
  <StatusTimeline order={localOrder} />
      </div>

      {/* Order Items - Responsive */}
      <div 
        className="bg-white border border-gray-100 p-4 sm:p-6 rounded-lg"
        style={{ 
          animation: 'fadeIn 0.4s ease-out 0.2s both',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}
      >
        <h3 className="text-base sm:text-lg font-medium mb-4 sm:mb-6" style={{ color: '#1a1a1a' }}>
          Order Items ({localOrder.cartItems?.length || 0})
        </h3>
        <div className="space-y-4">
          {cartItemsWithPricing.map((item, index) => {
            const itemStatus = item.dispatchStatus;
            const itemStatusConfig = itemStatus === 'delivered' 
              ? { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.08)', label: 'Delivered', icon: CheckCircle }
              : itemStatus === 'dispatched'
              ? { color: '#8d4466', bgColor: 'rgba(141, 68, 102, 0.08)', label: 'Dispatched', icon: Truck }
              : { color: '#733857', bgColor: 'rgba(115, 56, 87, 0.08)', label: 'Preparing', icon: Clock };
            const ItemIcon = itemStatusConfig.icon;
            const safeUnitPrice = Number.isFinite(item.unitFinalPrice) ? item.unitFinalPrice : 0;
            const hasDiscount = Boolean(item.hasDiscount);
            const discountPercentage = Number.isFinite(item.discountPercentage) ? item.discountPercentage : 0;
            const lineTotal = Number.isFinite(item.lineTotal) ? item.lineTotal : safeUnitPrice * item.quantity;
            const originalLineTotal = Number.isFinite(item.originalLineTotal) ? item.originalLineTotal : lineTotal;

            return (
              <div 
                key={index} 
                className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0"
              >
                {/* Clickable Product Image */}
                <div 
                  className="w-16 h-16 bg-gray-100 overflow-hidden flex-shrink-0 cursor-pointer hover:shadow-lg transition-all duration-300 rounded-lg hover:scale-105"
                  onClick={() => handleProductClick(item)}
                  title={`View ${item.productName} details`}
                >
                  {item.productImage ? (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-full h-full object-cover hover:brightness-110 transition-all duration-300"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentNode.style.background = 'linear-gradient(135deg, #733857 0%, #8d4466 50%, #412434 100%)';
                      }}
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center text-white font-semibold hover:bg-opacity-80 transition-all duration-300"
                      style={{ background: 'linear-gradient(135deg, #733857 0%, #8d4466 50%, #412434 100%)' }}
                    >
                      {item.productName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <p 
                      className="font-medium cursor-pointer hover:text-[#733857] transition-colors duration-300" 
                      style={{ color: '#1a1a1a' }}
                      onClick={() => handleProductClick(item)}
                      title={`View ${item.productName} details`}
                    >
                      {item.productName}
                    </p>
                    {itemStatus && (
                      <div 
                        className="inline-flex items-center px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: itemStatusConfig.bgColor,
                          color: itemStatusConfig.color
                        }}
                      >
                        <ItemIcon className="w-3 h-3 mr-1" />
                        {itemStatusConfig.label}
                      </div>
                    )}
                  </div>
                  <p className="text-sm" style={{ color: 'rgba(26, 26, 26, 0.5)' }}>
                    Quantity: {item.quantity}
                    {item.variantLabel && (
                      <>
                        {' '}
                        •
                        {' '}
                        <span className="font-medium" style={{ color: '#1a1a1a' }}>{item.variantLabel}</span>
                      </>
                    )}
                  </p>
                  {item.dispatchedAt && (
                    <p className="text-xs mt-1" style={{ color: 'rgba(26, 26, 26, 0.4)' }}>
                      Dispatched: {formatDate(item.dispatchedAt)} at {formatTime(item.dispatchedAt)}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div className="w-full sm:w-auto text-left sm:text-right sm:flex-shrink-0">
                  {hasDiscount && (
                    <div className="text-xs line-through" style={{ color: 'rgba(26, 26, 26, 0.45)' }}>
                      ₹{formatAmount(originalLineTotal)}
                    </div>
                  )}
                  <p className="font-medium" style={{ color: '#733857' }}>
                    ₹{formatAmount(lineTotal)}
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(26, 26, 26, 0.5)' }}>
                    ₹{formatAmount(safeUnitPrice)} each
                  </p>
                  {hasDiscount && (
                    <div className="mt-1 flex justify-start sm:justify-end">
                      <OfferBadge label={`${discountPercentage}% OFF`} className="text-[10px]" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Summary */}
      {summary && (
        <div 
          className="bg-white border border-gray-100 p-4 sm:p-6"
          style={{ 
            animation: 'fadeIn 0.4s ease-out 0.3s both',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <h3 className="text-base sm:text-lg font-medium mb-4" style={{ color: '#1a1a1a' }}>
            Order Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span style={{ color: 'rgba(26, 26, 26, 0.6)' }}>Subtotal</span>
              <span style={{ color: '#1a1a1a' }}>₹{formatAmount(summary.subtotal)}</span>
            </div>
            {summary.discountTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: '#10b981' }}>Discount</span>
                <span style={{ color: '#10b981' }}>-₹{formatAmount(summary.discountTotal)}</span>
              </div>
            )}
            {summary.deliveryCharge > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: 'rgba(26, 26, 26, 0.6)' }}>Delivery Charge</span>
                <span style={{ color: '#1a1a1a' }}>₹{formatAmount(summary.deliveryCharge)}</span>
              </div>
            )}
            {summary.freeCashUsed > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: '#10b981' }}>Free Cash Used</span>
                <span style={{ color: '#10b981' }}>-₹{formatAmount(summary.freeCashUsed)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-medium pt-3 border-t border-gray-100">
              <span style={{ color: '#1a1a1a' }}>Total</span>
              <span style={{ color: '#733857' }}>₹{formatAmount(summary.grandTotal)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Information */}
      {(localOrder.deliveryLocation || localOrder.deliveryAddress || localOrder.userDetails?.userAddress?.fullAddress) && (
        <div 
          className="bg-white border border-gray-100 p-4 sm:p-6"
          style={{ 
            animation: 'fadeIn 0.4s ease-out 0.4s both',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <h3 className="text-base sm:text-lg font-medium mb-4" style={{ color: '#1a1a1a' }}>
            Delivery Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-start">
              <MapPin className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" style={{ color: '#733857' }} />
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: '#1a1a1a' }}>
                  Delivery Address
                </p>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(26, 26, 26, 0.6)' }}>
                  {localOrder.userDetails?.userAddress?.fullAddress ? (
                    <>
                      {localOrder.hostelName && `${localOrder.hostelName}, `}
                      {localOrder.userDetails.userAddress.fullAddress}
                    </>
                  ) : localOrder.deliveryAddress ? (
                    <>
                      {localOrder.deliveryAddress.hostelName && `${localOrder.deliveryAddress.hostelName}, `}
                      {localOrder.deliveryAddress.area}, {localOrder.deliveryAddress.city}
                    </>
                  ) : (
                    <>
                      {localOrder.hostelName && `${localOrder.hostelName}, `}
                      {localOrder.deliveryLocation}
                    </>
                  )}
                </p>
              </div>
            </div>
            {localOrder.estimatedDeliveryTime && (
              <div className="flex items-start pt-3 border-t border-gray-100">
                <Clock className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" style={{ color: '#733857' }} />
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: '#1a1a1a' }}>
                    Estimated Delivery
                  </p>
                  <p className="text-sm" style={{ color: 'rgba(26, 26, 26, 0.6)' }}>
                    {formatDate(localOrder.estimatedDeliveryTime)} at {formatTime(localOrder.estimatedDeliveryTime)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancel Order Button - Only show if order can be cancelled */}
      {canCancel && !isCancelling && (
        <div 
          className="bg-white border border-gray-100 p-4 sm:p-6 flex flex-col sm:flex-row sm:justify-end gap-3"
          style={{ 
            animation: 'fadeIn 0.4s ease-out 0.5s both',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <button
            onClick={handleCancelClick}
            disabled={isCancelling}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-3 text-sm font-bold tracking-widest transition-all duration-300 border disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              color: isCancelling ? '#9ca3af' : '#733857',
              borderColor: isCancelling ? '#d1d5db' : '#733857',
              letterSpacing: '0.08em',
              backgroundColor: isCancelling ? '#f9fafb' : 'transparent'
            }}
            onMouseEnter={(e) => {
              if (!isCancelling) {
                e.currentTarget.style.backgroundColor = '#733857';
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (!isCancelling) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#733857';
              }
            }}
          >
            {isCancelling ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                <span>CANCELLING...</span>
              </>
            ) : (
              <>
                <X className="h-4 w-4" />
                <span>CANCEL ORDER</span>
              </>
            )}
          </button>
        </div>
      )}

      <dialog
        ref={dialogRef}
        className="order-cancel-dialog"
        data-open={showCancelConfirm ? 'true' : 'false'}
        onCancel={handleDialogCancel}
        onClose={handleDialogClose}
        aria-label={`Cancel order ${localOrder.orderNumber}`}
      >
        <div className="order-dialog-canvas">
          <button
            type="button"
            className="order-dialog-close-button"
            onClick={handleKeepOrder}
            disabled={isCancelling}
          >
            <span>Close</span>
            <X className="order-dialog-close-icon" />
          </button>

          <div className="order-dialog-wrapper">
            <h2 className="order-dialog-title">Cancel Order #{localOrder.orderNumber}?</h2>
            
            <textarea
              placeholder="Reason for cancellation (optional)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="order-dialog-textarea"
              rows={3}
              disabled={isCancelling}
            />
            <div className="order-dialog-actions">
              <button
                type="button"
                className="order-dialog-secondary"
                onClick={handleKeepOrder}
                disabled={isCancelling}
              >
                Keep Order
              </button>
              <button
                type="button"
                className="order-dialog-primary"
                onClick={handleCancelConfirm}
                disabled={isCancelling}
              >
                {isCancelling ? 'Cancelling...' : 'Yes, cancel order'}
              </button>
            </div>
          </div>
        </div>
      </dialog>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default OrderTrackingContent;