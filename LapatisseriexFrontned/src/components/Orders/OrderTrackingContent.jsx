import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, Truck, CheckCircle, MapPin, CreditCard, Banknote, Calendar, DollarSign } from 'lucide-react';
import { calculatePricing } from '../../utils/pricingUtils';
import { resolveOrderItemVariantLabel } from '../../utils/variantUtils';

const OrderTrackingContent = ({ order }) => {
  const navigate = useNavigate();
  
  if (!order) return null;

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

  const StatusTimeline = ({ orderStatus }) => {
    const steps = [
      { key: 'placed', label: 'Order Placed', pngSrc: '/checkout.png', description: 'We have received your order' },
      { key: 'out_for_delivery', label: 'Out for Delivery', pngSrc: '/market-capitalization.png', description: 'Your order is on the way' },
      { key: 'delivered', label: 'Delivered', pngSrc: '/delivery-box.png', description: 'Order delivered successfully' }
    ];

    const currentStepIndex = steps.findIndex(step => step.key === orderStatus);
    
    return (
      <div className="relative py-4 sm:py-8 px-2 sm:px-4">
        {/* Mobile: Vertical Layout, Desktop: Horizontal Layout */}
        <div className="block sm:hidden">
          {/* Mobile Vertical Progress Line */}
          <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          <div 
            className="absolute left-7 top-0 w-0.5 transition-all duration-700 ease-out"
            style={{ 
              height: currentStepIndex >= 0 ? `${(currentStepIndex / (steps.length - 1)) * 100}%` : '0%',
              background: 'linear-gradient(180deg, #733857 0%, #8d4466 50%, #412434 100%)'
            }}
          ></div>
        </div>
        
        <div className="hidden sm:block">
          {/* Desktop Horizontal Progress Line */}
          <div className="absolute left-0 right-0 top-10 h-0.5 bg-gray-200" style={{ margin: '0 3rem' }}></div>
          <div 
            className="absolute left-0 top-10 h-0.5 transition-all duration-700 ease-out"
            style={{ 
              width: currentStepIndex >= 0 ? `calc(${(currentStepIndex / (steps.length - 1)) * 100}% - ${currentStepIndex === 0 ? '3rem' : '0rem'})` : '0%',
              marginLeft: '3rem',
              background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)'
            }}
          ></div>
        </div>

        {/* Steps Container - Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between relative gap-6 sm:gap-0">
          {steps.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isActive = index === currentStepIndex;
            
            return (
              <div 
                key={step.key} 
                className="flex items-center sm:flex-col sm:items-center relative flex-1 w-full sm:w-auto"
                style={{ animation: `fadeIn 0.4s ease-out ${index * 0.15}s both` }}
              >
                {/* Icon Circle - Responsive */}
                <div 
                  className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 relative z-10 transition-all duration-300 mb-0 sm:mb-4 mr-4 sm:mr-0 rounded-full"
                  style={{
                    backgroundColor: isCompleted ? (isActive ? '#733857' : '#10b981') : 'white',
                    border: `2px solid ${isCompleted ? (isActive ? '#733857' : '#10b981') : '#e5e7eb'}`,
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                    boxShadow: isActive ? '0 4px 12px rgba(115, 56, 87, 0.25)' : isCompleted ? '0 2px 8px rgba(16, 185, 129, 0.15)' : 'none'
                  }}
                >
                  <img 
                    src={step.pngSrc} 
                    alt={step.label}
                    className="w-4 h-4 sm:w-5 sm:h-5" 
                    style={{ 
                      filter: isCompleted ? 'brightness(0) invert(1)' : 'brightness(0.4)',
                      transition: 'filter 0.3s ease'
                    }}
                  />
                </div>

                {/* Content - Responsive */}
                <div className="text-left sm:text-center flex-1 sm:flex-initial">
                  <p 
                    className="font-medium mb-1 sm:mb-2 text-sm sm:text-sm"
                    style={{ color: isCompleted ? '#733857' : 'rgba(26, 26, 26, 0.5)' }}
                  >
                    {step.label}
                  </p>
                  <p 
                    className="text-xs leading-relaxed max-w-none sm:max-w-[140px]"
                    style={{ color: 'rgba(26, 26, 26, 0.5)' }}
                  >
                    {step.description}
                  </p>
                  {isActive && (
                    <div 
                      className="inline-flex items-center mt-2 sm:mt-3 px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-medium rounded-lg"
                      style={{
                        backgroundColor: 'rgba(115, 56, 87, 0.08)',
                        color: '#733857'
                      }}
                    >
                      Current Status
                    </div>
                  )}
                  {isCompleted && !isActive && (
                    <div className="flex items-center sm:justify-center mt-2 sm:mt-3 text-xs" style={{ color: '#10b981' }}>
                      <img 
                        src="/delivery-box.png" 
                        alt="Completed"
                        className="w-3.5 h-3.5 mr-1" 
                        style={{ filter: 'hue-rotate(90deg) saturate(2) brightness(0.8)' }}
                      />
                      Completed
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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

  const statusConfig = getStatusConfig(order.orderStatus);
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3 sm:gap-0">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-light mb-1" style={{ color: '#1a1a1a' }}>
              Order #{order.orderNumber}
            </h2>
            <div className="flex items-center text-sm" style={{ color: 'rgba(26, 26, 26, 0.5)' }}>
              <Calendar className="w-4 h-4 mr-1.5" />
              Placed on {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
            </div>
          </div>
          
          {/* Status Badge - Responsive */}
          <div className="flex items-center gap-2 sm:gap-2.5 px-3 py-2 rounded-lg sm:rounded-none sm:px-3 sm:py-1.5" 
               style={{ backgroundColor: 'rgba(115, 56, 87, 0.05)' }}>
            {(() => {
              // Get appropriate PNG based on status
              const statusToPng = {
                'placed': '/checkout.png',
                'confirmed': '/checkout.png', 
                'out_for_delivery': '/market-capitalization.png',
                'delivered': '/delivery-box.png',
                'pending': '/checkout.png',
                'cancelled': '/checkout.png'
              };
              return (
                <img 
                  src={statusToPng[order.orderStatus] || '/checkout.png'} 
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
              style={{ 
                color: statusConfig.color,
                letterSpacing: '0.08em sm:0.12em'
              }}
            >
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Total Amount - Responsive */}
        <div className="pt-3 sm:pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'rgba(26, 26, 26, 0.6)' }}>Total Amount</span>
            <span className="text-xl sm:text-2xl font-medium" style={{ color: '#733857' }}>
              ₹{order.orderSummary?.grandTotal || order.amount}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center mt-2 text-sm gap-1 sm:gap-0" style={{ color: 'rgba(26, 26, 26, 0.5)' }}>
            <div className="flex items-center">
              {order.paymentMethod === 'cod' ? (
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
            <span>Payment {order.paymentStatus}</span>
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
        <StatusTimeline orderStatus={order.orderStatus} />
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
          Order Items ({order.cartItems?.length || 0})
        </h3>
        <div className="space-y-4">
          {order.cartItems?.map((item, index) => {
            const itemStatus = item.dispatchStatus;
            const itemStatusConfig = itemStatus === 'delivered' 
              ? { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.08)', label: 'Delivered', icon: CheckCircle }
              : itemStatus === 'dispatched'
              ? { color: '#8d4466', bgColor: 'rgba(141, 68, 102, 0.08)', label: 'Dispatched', icon: Truck }
              : { color: '#733857', bgColor: 'rgba(115, 56, 87, 0.08)', label: 'Preparing', icon: Clock };
            const ItemIcon = itemStatusConfig.icon;
            const variantLabel = resolveOrderItemVariantLabel(item);

            return (
              <div 
                key={index} 
                className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0"
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
                <div className="flex-1">
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
                    {variantLabel && (
                      <>
                        {' '}
                        •
                        {' '}
                        <span className="font-medium" style={{ color: '#1a1a1a' }}>{variantLabel}</span>
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
                <div className="text-right flex-shrink-0">
                  {(() => {
                    if (item.variant) {
                      const pricing = calculatePricing(item.variant);
                      const itemTotal = pricing.finalPrice * item.quantity;
                      return (
                        <>
                          <p className="font-medium" style={{ color: '#733857' }}>
                            ₹{Math.round(itemTotal)}
                          </p>
                          <p className="text-xs" style={{ color: 'rgba(26, 26, 26, 0.5)' }}>
                            ₹{Math.round(pricing.finalPrice)} each
                          </p>
                        </>
                      );
                    } else {
                      return (
                        <>
                          <p className="font-medium" style={{ color: '#733857' }}>
                            ₹{Math.round(item.price * item.quantity)}
                          </p>
                          <p className="text-xs" style={{ color: 'rgba(26, 26, 26, 0.5)' }}>
                            ₹{Math.round(item.price)} each
                          </p>
                        </>
                      );
                    }
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Summary */}
      {order.orderSummary && (
        <div 
          className="bg-white border border-gray-100 p-6"
          style={{ 
            animation: 'fadeIn 0.4s ease-out 0.3s both',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <h3 className="text-lg font-medium mb-4" style={{ color: '#1a1a1a' }}>
            Order Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span style={{ color: 'rgba(26, 26, 26, 0.6)' }}>Subtotal</span>
              <span style={{ color: '#1a1a1a' }}>₹{order.orderSummary.subtotal}</span>
            </div>
            {order.orderSummary.deliveryCharge > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: 'rgba(26, 26, 26, 0.6)' }}>Delivery Charge</span>
                <span style={{ color: '#1a1a1a' }}>₹{order.orderSummary.deliveryCharge}</span>
              </div>
            )}
            {order.orderSummary.freeCashUsed > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: '#10b981' }}>Free Cash Used</span>
                <span style={{ color: '#10b981' }}>-₹{order.orderSummary.freeCashUsed}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-medium pt-3 border-t border-gray-100">
              <span style={{ color: '#1a1a1a' }}>Total</span>
              <span style={{ color: '#733857' }}>₹{order.orderSummary.grandTotal}</span>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Information */}
      {(order.deliveryLocation || order.deliveryAddress) && (
        <div 
          className="bg-white border border-gray-100 p-6"
          style={{ 
            animation: 'fadeIn 0.4s ease-out 0.4s both',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <h3 className="text-lg font-medium mb-4" style={{ color: '#1a1a1a' }}>
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
                  {order.deliveryAddress ? (
                    <>
                      {order.deliveryAddress.hostelName && `${order.deliveryAddress.hostelName}, `}
                      {order.deliveryAddress.area}, {order.deliveryAddress.city}
                    </>
                  ) : (
                    <>
                      {order.hostelName && `${order.hostelName}, `}
                      {order.deliveryLocation}
                    </>
                  )}
                </p>
              </div>
            </div>
            {order.estimatedDeliveryTime && (
              <div className="flex items-start pt-3 border-t border-gray-100">
                <Clock className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" style={{ color: '#733857' }} />
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: '#1a1a1a' }}>
                    Estimated Delivery
                  </p>
                  <p className="text-sm" style={{ color: 'rgba(26, 26, 26, 0.6)' }}>
                    {formatDate(order.estimatedDeliveryTime)} at {formatTime(order.estimatedDeliveryTime)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
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