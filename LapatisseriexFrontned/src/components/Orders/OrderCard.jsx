import React, { useRef, useState } from 'react';
import { 
  Package, 
  Clock, 
  Truck, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  ChevronDown, 
  MapPin, 
  Calendar,
  CreditCard,
  Banknote,
  ShoppingBag,
  Eye,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { calculatePricing } from '../../utils/pricingUtils';
import { resolveOrderItemVariantLabel } from '../../utils/variantUtils';
import { longTimeoutAxiosInstance } from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import './OrderCard.css';

const OrderCard = ({ order, onOrderCancelled, isCancelledView = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const dialogRef = useRef(null);

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentIcon = (method) => {
    return method === 'razorpay' ? (
      <CreditCard className="h-4 w-4 text-blue-500" />
    ) : (
      <Banknote className="h-4 w-4 text-green-500" />
    );
  };

  const defaultProductImage = "/placeholder-image.jpg";
  
  const statusConfig = getStatusConfig(order.orderStatus);
  const isCancelled = order.orderStatus === 'cancelled';
  const showGreyTheme = isCancelled || isCancelledView;
  const statusColor = showGreyTheme ? '#6b7280' : statusConfig.color;
  const StatusIcon = showGreyTheme ? XCircle : statusConfig.icon;

  // Check if order can be cancelled
  // Rules:
  // 1. Order must not be in out_for_delivery, delivered, or cancelled status
  // 2. ONLY COD orders can be cancelled (offline payment)
  // 3. Razorpay/online paid orders CANNOT be cancelled
  const canCancel = !['out_for_delivery', 'delivered', 'cancelled'].includes(order.orderStatus) 
                    && order.paymentMethod === 'cod';

  const handleCancelClick = () => {
    if (dialogRef.current) {
      if (dialogRef.current.open) {
        return;
      }
      setShowCancelConfirm(true);
      setCancelReason('');
      setIsCancelling(false);
      dialogRef.current.showModal();
    }
  };

  const handleDialogClose = () => {
    setShowCancelConfirm(false);
    setCancelReason('');
    setIsCancelling(false);
  };

  const handleDialogCancel = (event) => {
    if (isCancelling) {
      event.preventDefault();
    }
  };

  const closeCancelDialog = () => {
    if (dialogRef.current && dialogRef.current.open) {
      dialogRef.current.close();
    }
  };

  const handleCancelConfirm = async () => {
    setIsCancelling(true);

    try {
      const token = localStorage.getItem('authToken');
      await longTimeoutAxiosInstance.put(
        `${import.meta.env.VITE_API_URL}/payments/orders/${order.orderNumber}/cancel`,
        { cancelReason: cancelReason || 'Cancelled by user' },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Show success message
      toast.success('Order cancelled successfully!', {
        position: "top-center",
        autoClose: 3000});

      if (onOrderCancelled) {
        onOrderCancelled(order.orderNumber);
      }

      closeCancelDialog();
    } catch (error) {
      console.error('Error cancelling order:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to cancel order. Please try again.';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'The cancellation is taking longer than expected. Please refresh the page to check if the order was cancelled.';
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
    }
  };

  return (
    <>
      <div
        className={`transition-all duration-300 mb-6 ${showGreyTheme ? 'bg-gray-100 border border-gray-200' : 'bg-white border border-gray-100 hover:shadow-lg'}`}
        style={{
          filter: showGreyTheme ? 'grayscale(0.15)' : 'none',
          opacity: showGreyTheme ? 0.9 : 1
        }}
      >
        {/* Header Section */}
        <div className="p-5 sm:p-6 pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="font-medium text-base tracking-wide" style={{ color: '#1a1a1a', letterSpacing: '0.03em' }}>
                  ORDER #{order.orderNumber}
                </h4>
                
                {/* Clean Flat Status Badge - No Background, No Rounded Corners */}
                <div className="flex items-center gap-2 px-2.5 py-1">
                  <StatusIcon 
                    className="w-3.5 h-3.5" 
                    style={{ 
                      color: statusColor,
                      strokeWidth: 2.5
                    }} 
                  />
                  <span 
                    className="text-xs font-bold tracking-widest"
                    style={{ 
                      color: statusColor,
                      letterSpacing: '0.12em'
                    }}
                  >
                    {statusConfig.label}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs" style={{ color: 'rgba(26, 26, 26, 0.5)' }}>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>{order.cartItems?.length || 0} item{(order.cartItems?.length || 0) !== 1 ? 's' : ''}</span>
                </div>
                {/* Dispatch Progress Indicator */}
                {order.cartItems && order.cartItems.length > 1 && order.orderStatus === 'out_for_delivery' && (
                  <div className="flex items-center gap-1">
                    <Truck className="h-3.5 w-3.5" style={{ color: '#8d4466' }} />
                    <span className="font-medium" style={{ color: '#8d4466' }}>
                      {order.cartItems.filter(item => item.dispatchStatus === 'dispatched').length}/{order.cartItems.length} dispatched
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-left md:text-right">
              <p className="text-2xl font-medium mb-1" style={{ color: showGreyTheme ? '#4b5563' : '#733857' }}>
                ₹{order.orderSummary?.grandTotal || order.amount}
              </p>
              <div className="flex items-center gap-1 text-xs" style={{ color: 'rgba(26, 26, 26, 0.5)' }}>
                {getPaymentIcon(order.paymentMethod)}
                <span>{order.paymentMethod === 'razorpay' ? 'Online' : 'Cash on Delivery'}</span>
              </div>
            </div>
          </div>

          {/* Product Images Preview */}
          {order.cartItems && order.cartItems.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {order.cartItems.slice(0, 4).map((item, index) => (
                  <Link key={index} to={`/product/${item.productId}`} className="flex-shrink-0 relative group">
                    <div className="w-14 h-14 overflow-hidden bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors">
                      <img
                        src={item.productImage || defaultProductImage}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = defaultProductImage;
                        }}
                      />
                    </div>
                    <div className="absolute -top-1 -right-1 text-white text-[10px] w-4 h-4 flex items-center justify-center font-bold" style={{ backgroundColor: statusColor }}>
                      {item.quantity}
                    </div>
                  </Link>
                ))}
                {order.cartItems.length > 4 && (
                  <div className="flex-shrink-0 w-14 h-14 bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center">
                    <span className="text-[10px] font-semibold" style={{ color: 'rgba(26, 26, 26, 0.5)' }}>
                      +{order.cartItems.length - 4}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Expandable Section */}
        {order.cartItems && order.cartItems.length > 0 && (
          <div className="border-t border-gray-100">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full px-5 sm:px-6 py-3 flex items-center justify-between text-xs font-medium hover:bg-gray-50 transition-colors tracking-wider"
              style={{ color: 'rgba(26, 26, 26, 0.7)', letterSpacing: '0.05em' }}
            >
              <span>ORDER DETAILS</span>
              <div className="transform transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                <ChevronDown className="h-3.5 w-3.5" />
              </div>
            </button>
            
            {isExpanded && (
              <div className="px-5 sm:px-6 pb-4 space-y-3 bg-gray-50">
                {/* Delivery Location */}
                {order.deliveryLocation && (
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(26, 26, 26, 0.6)' }}>
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{order.deliveryLocation}</span>
                  </div>
                )}
                
                {/* Product List */}
                <div className="space-y-2">
                  {order.cartItems.map((item, index) => {
                    const variantLabel = resolveOrderItemVariantLabel(item);

                    return (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-white border border-gray-100">
                        <div className="w-16 h-16 sm:w-12 sm:h-12 overflow-hidden bg-gray-50 flex-shrink-0">
                          <img
                            src={item.productImage || defaultProductImage}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = defaultProductImage;
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-sm truncate" style={{ color: '#1a1a1a' }}>
                            {item.productName}
                          </h5>
                          {variantLabel && (
                            <p className="text-xs" style={{ color: 'rgba(26, 26, 26, 0.6)' }}>
                              Variant: <span className="font-medium" style={{ color: '#1a1a1a' }}>{variantLabel}</span>
                            </p>
                          )}
                          {(() => {
                            if (item.variant) {
                              const pricing = calculatePricing(item.variant);
                              return (
                                <p className="text-xs" style={{ color: 'rgba(26, 26, 26, 0.5)' }}>
                                  Qty: {item.quantity} × ₹{Math.round(pricing.finalPrice)}
                                </p>
                              );
                            }

                            return (
                              <p className="text-xs" style={{ color: 'rgba(26, 26, 26, 0.5)' }}>
                                Qty: {item.quantity} × ₹{Math.round(item.price)}
                              </p>
                            );
                          })()}
                        </div>
                        <div className="text-left sm:text-right">
                          {(() => {
                            if (item.variant) {
                              const pricing = calculatePricing(item.variant);
                              const itemTotal = pricing.finalPrice * item.quantity;
                              return (
                                <p className="font-medium text-sm" style={{ color: showGreyTheme ? '#4b5563' : '#733857' }}>
                                  ₹{Math.round(itemTotal)}
                                </p>
                              );
                            }

                            return (
                              <p className="font-medium text-sm" style={{ color: showGreyTheme ? '#4b5563' : '#733857' }}>
                                ₹{Math.round(item.quantity * item.price)}
                              </p>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Footer */}
        <div className="px-5 sm:px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div className="flex flex-col gap-4 sm:gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs" style={{ color: 'rgba(26, 26, 26, 0.6)' }}>
              {order.orderStatus === 'delivered' && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" style={{ color: '#059669' }} />
                  <span>Order Completed</span>
                </div>
              )}
              {order.orderStatus === 'out_for_delivery' && (
                <div className="flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5" style={{ color: '#8d4466' }} />
                  <span>On the Way</span>
                </div>
              )}
              {order.orderStatus === 'cancelled' && (
                <div className="flex items-center gap-1">
                  <XCircle className="h-3.5 w-3.5" style={{ color: '#6b7280' }} />
                  <span style={{ color: '#6b7280' }}>Cancelled</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col w-full sm:w-auto sm:flex-row sm:items-center gap-2">
              {/* Info message for online paid orders */}
              {order.paymentMethod === 'razorpay' && !['out_for_delivery', 'delivered', 'cancelled'].includes(order.orderStatus) && (
                <div className="flex items-center justify-center gap-1 text-xs px-3 py-1.5 bg-blue-50 border border-blue-200 rounded w-full sm:w-auto" style={{ color: '#2563eb' }}>
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>Paid orders cannot be cancelled</span>
                </div>
              )}
              
              {/* Cancel Button - Only show if order can be cancelled (COD only) */}
              {canCancel && (
                <button
                  onClick={handleCancelClick}
                  disabled={isCancelling}
                  className="order-dialog-trigger inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold tracking-widest transition-all duration-300 border w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-current border-t-transparent"></div>
                      <span>CANCELLING...</span>
                    </>
                  ) : (
                    <>
                      <X className="h-3.5 w-3.5" />
                      <span>CANCEL ORDER</span>
                    </>
                  )}
                </button>
              )}

              {showGreyTheme ? (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold tracking-widest border cursor-not-allowed w-full sm:w-auto"
                  style={{
                    color: '#6b7280',
                    borderColor: 'rgba(156, 163, 175, 0.6)',
                    backgroundColor: 'rgba(243, 244, 246, 0.8)',
                    letterSpacing: '0.08em'
                  }}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>TRACK UNAVAILABLE</span>
                </button>
              ) : (
                <Link 
                  to={`/orders/${order.orderNumber}`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold tracking-widest transition-all duration-300 border w-full sm:w-auto"
                  style={{ 
                    color: '#733857',
                    borderColor: '#733857',
                    letterSpacing: '0.08em'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#733857';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#733857';
                  }}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>TRACK ORDER</span>
                  <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        className="order-cancel-dialog"
        data-open={showCancelConfirm ? 'true' : 'false'}
        onCancel={handleDialogCancel}
        onClose={handleDialogClose}
        aria-label={`Cancel order ${order.orderNumber}`}
      >
        <div className="order-dialog-canvas">
          <button
            type="button"
            className="order-dialog-close-button"
            onClick={closeCancelDialog}
            disabled={isCancelling}
          >
            <span>Close</span>
            <X className="order-dialog-close-icon" />
          </button>

          <div className="order-dialog-wrapper">
            <h2 className="order-dialog-title">Cancel Order #{order.orderNumber}?</h2>
            <p className="order-dialog-text">
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>
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
                onClick={closeCancelDialog}
                disabled={isCancelling}
              >
                Keep Order
              </button>
              <button
                type="button"
                className="order-dialog-primary disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCancelConfirm}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                    <span>Cancelling...</span>
                  </div>
                ) : (
                  'Yes, cancel order'
                )}
              </button>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
};

export default OrderCard;