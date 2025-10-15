import React from 'react';
import { Package, Clock, Truck, CheckCircle, MapPin, CreditCard, Banknote, Calendar, DollarSign } from 'lucide-react';
import { calculatePricing } from '../../utils/pricingUtils';

const OrderTrackingContent = ({ order }) => {
  if (!order) return null;

  const getStatusConfig = (status) => {
    const configs = {
      'placed': {
        icon: Package,
        color: '#733857',
        label: 'ORDER PLACED'
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
      }
    };
    return configs[status] || configs['placed'];
  };

  const StatusTimeline = ({ orderStatus }) => {
    const steps = [
      { key: 'placed', label: 'Order Placed', icon: Package, description: 'We have received your order' },
      { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, description: 'Your order is on the way' },
      { key: 'delivered', label: 'Delivered', icon: CheckCircle, description: 'Order delivered successfully' }
    ];

    const currentStepIndex = steps.findIndex(step => step.key === orderStatus);
    
    return (
      <div className="relative py-8 px-4">
        {/* Horizontal Progress Line Background */}
        <div className="absolute left-0 right-0 top-10 h-0.5 bg-gray-200" style={{ margin: '0 3rem' }}></div>
        
        {/* Horizontal Progress Line Filled */}
        <div 
          className="absolute left-0 top-10 h-0.5 transition-all duration-700 ease-out"
          style={{ 
            width: currentStepIndex >= 0 ? `calc(${(currentStepIndex / (steps.length - 1)) * 100}% - ${currentStepIndex === 0 ? '3rem' : '0rem'})` : '0%',
            marginLeft: '3rem',
            background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)'
          }}
        ></div>

        {/* Steps Container */}
        <div className="flex items-start justify-between relative">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index <= currentStepIndex;
            const isActive = index === currentStepIndex;
            
            return (
              <div 
                key={step.key} 
                className="flex flex-col items-center relative flex-1"
                style={{ animation: `fadeIn 0.4s ease-out ${index * 0.15}s both` }}
              >
                {/* Icon Circle */}
                <div 
                  className="flex items-center justify-center w-12 h-12 flex-shrink-0 relative z-10 transition-all duration-300 mb-4"
                  style={{
                    backgroundColor: isCompleted ? (isActive ? '#733857' : '#10b981') : 'white',
                    border: `2px solid ${isCompleted ? (isActive ? '#733857' : '#10b981') : '#e5e7eb'}`,
                    transform: isActive ? 'scale(1.15)' : 'scale(1)',
                    boxShadow: isActive ? '0 4px 12px rgba(115, 56, 87, 0.25)' : isCompleted ? '0 2px 8px rgba(16, 185, 129, 0.15)' : 'none'
                  }}
                >
                  <Icon 
                    className="w-5 h-5" 
                    style={{ color: isCompleted ? 'white' : 'rgba(26, 26, 26, 0.3)' }}
                  />
                </div>

                {/* Content */}
                <div className="text-center">
                  <p 
                    className="font-medium mb-2 text-sm"
                    style={{ color: isCompleted ? '#733857' : 'rgba(26, 26, 26, 0.5)' }}
                  >
                    {step.label}
                  </p>
                  <p 
                    className="text-xs leading-relaxed max-w-[140px]"
                    style={{ color: 'rgba(26, 26, 26, 0.5)' }}
                  >
                    {step.description}
                  </p>
                  {isActive && (
                    <div 
                      className="inline-flex items-center mt-3 px-3 py-1.5 text-xs font-medium"
                      style={{
                        backgroundColor: 'rgba(115, 56, 87, 0.08)',
                        color: '#733857'
                      }}
                    >
                      Current Status
                    </div>
                  )}
                  {isCompleted && !isActive && (
                    <div className="flex items-center justify-center mt-3 text-xs" style={{ color: '#10b981' }}>
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
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
    <div className="space-y-6">
      {/* Order Header Card */}
      <div 
        className="bg-white border border-gray-100 p-6"
        style={{ 
          animation: 'fadeIn 0.3s ease-out',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-light mb-1" style={{ color: '#1a1a1a' }}>
              Order #{order.orderNumber}
            </h2>
            <div className="flex items-center text-sm" style={{ color: 'rgba(26, 26, 26, 0.5)' }}>
              <Calendar className="w-4 h-4 mr-1.5" />
              Placed on {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
            </div>
          </div>
          
          {/* Clean Flat Status Badge - No Background, No Rounded Corners */}
          <div className="flex items-center gap-2.5 px-3 py-1.5">
            <StatusIcon 
              className="w-5 h-5" 
              style={{ 
                color: statusConfig.color,
                strokeWidth: 2.5
              }} 
            />
            <span 
              className="text-sm font-bold tracking-widest"
              style={{ 
                color: statusConfig.color,
                letterSpacing: '0.12em'
              }}
            >
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Total Amount */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'rgba(26, 26, 26, 0.6)' }}>Total Amount</span>
            <span className="text-2xl font-medium" style={{ color: '#733857' }}>
              ₹{order.orderSummary?.grandTotal || order.amount}
            </span>
          </div>
          <div className="flex items-center mt-2 text-sm" style={{ color: 'rgba(26, 26, 26, 0.5)' }}>
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
            <span className="mx-2">•</span>
            Payment {order.paymentStatus}
          </div>
        </div>
      </div>

      {/* Order Progress */}
      <div 
        className="bg-white border border-gray-100 p-6"
        style={{ 
          animation: 'fadeIn 0.4s ease-out 0.1s both',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}
      >
        <h3 className="text-lg font-medium mb-6" style={{ color: '#1a1a1a' }}>
          Order Progress
        </h3>
        <StatusTimeline orderStatus={order.orderStatus} />
      </div>

      {/* Order Items */}
      <div 
        className="bg-white border border-gray-100 p-6"
        style={{ 
          animation: 'fadeIn 0.4s ease-out 0.2s both',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}
      >
        <h3 className="text-lg font-medium mb-6" style={{ color: '#1a1a1a' }}>
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

            return (
              <div 
                key={index} 
                className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0"
              >
                {/* Product Image */}
                <div className="w-16 h-16 bg-gray-100 overflow-hidden flex-shrink-0">
                  {item.productImage ? (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentNode.style.background = 'linear-gradient(135deg, #733857 0%, #8d4466 50%, #412434 100%)';
                      }}
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center text-white font-semibold"
                      style={{ background: 'linear-gradient(135deg, #733857 0%, #8d4466 50%, #412434 100%)' }}
                    >
                      {item.productName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium" style={{ color: '#1a1a1a' }}>
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
                    {item.selectedVariant && ` • ${item.selectedVariant.weight} ${item.selectedVariant.unit}`}
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