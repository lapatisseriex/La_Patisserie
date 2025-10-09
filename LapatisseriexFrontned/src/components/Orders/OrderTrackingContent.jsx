import React from 'react';
import { Package, Clock, Truck, CheckCircle, XCircle, MapPin, CreditCard } from 'lucide-react';
import { calculatePricing } from '../../utils/pricingUtils';

const OrderTrackingContent = ({ order }) => {
  if (!order) return null;

  const getStatusIcon = (status) => {
    const icons = {
      'placed': Package,
      'confirmed': CheckCircle,
      'preparing': Clock,
      'ready': Package,
      'out_for_delivery': Truck,
      'delivered': CheckCircle,
      'cancelled': XCircle
    };
    return icons[status] || Clock;
  };

  const getStatusColor = (status) => {
    const colors = {
      'placed': 'bg-blue-100 text-blue-800',
      'confirmed': 'bg-green-100 text-green-800',
      'preparing': 'bg-yellow-100 text-yellow-800',
      'ready': 'bg-orange-100 text-orange-800',
      'out_for_delivery': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-green-200 text-green-900',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      'placed': 'Order Placed',
      'confirmed': 'Order Confirmed',
      'preparing': 'Preparing',
      'ready': 'Ready for Pickup',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    return texts[status] || status;
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'created': 'bg-blue-100 text-blue-800',
      'paid': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'refunded': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const StatusTimeline = ({ orderStatus }) => {
    const steps = [
      { key: 'placed', label: 'Order Placed', icon: Package },
      { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
      { key: 'preparing', label: 'Preparing', icon: Clock },
      { key: 'ready', label: 'Ready', icon: Package },
      { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
      { key: 'delivered', label: 'Delivered', icon: CheckCircle }
    ];

    const currentStepIndex = steps.findIndex(step => step.key === orderStatus);
    
    return (
      <div className="relative">
        {/* Progress line background */}
        <div className="absolute left-4 top-4 bottom-4 w-1 bg-gray-200 rounded-full"></div>
        
        {/* Progress line filled with gradient */}
        <div 
          className="absolute left-4 top-4 w-1 bg-gradient-to-b from-green-400 to-green-600 rounded-full transition-all duration-700 ease-in-out shadow-sm"
          style={{ 
            height: currentStepIndex >= 0 ? `${(currentStepIndex / (steps.length - 1)) * 100}%` : '0%' 
          }}
        ></div>

        <div className="space-y-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index <= currentStepIndex;
            const isActive = index === currentStepIndex;
            
            return (
              <div key={step.key} className="flex items-center relative">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center mr-4 relative z-10 border-2 transition-all duration-300 transform
                  ${isCompleted 
                    ? isActive 
                      ? 'bg-yellow-500 border-yellow-500 text-white shadow-lg scale-110' 
                      : 'bg-green-500 border-green-500 text-white shadow-md'
                    : 'bg-white border-gray-300 text-gray-400 hover:border-gray-400'
                  }
                `}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className={`font-medium transition-colors duration-300 ${
                    isCompleted ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </p>
                  {isActive && (
                    <p className="text-sm text-yellow-600 font-medium animate-pulse">Current Status</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Status and Payment Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Order Status</h3>
          <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(order.orderStatus)}`}>
            {React.createElement(getStatusIcon(order.orderStatus), { className: "h-4 w-4" })}
            {getStatusText(order.orderStatus)}
          </span>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Payment Status</h3>
          <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
            <CreditCard className="h-4 w-4" />
            {order.paymentStatus}
          </span>
        </div>
      </div>

      {/* Order Progress Timeline */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Progress</h3>
        <StatusTimeline orderStatus={order.orderStatus} />
      </div>

      {/* Order Items */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Items ({order.cartItems?.length || 0})
        </h3>
        <div className="space-y-3">
          {order.cartItems?.map((item, index) => (
            <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
              <div>
                <p className="font-medium text-gray-900">{item.productName}</p>
                <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                {item.selectedVariant && (
                  <p className="text-sm text-gray-500">
                    Variant: {item.selectedVariant.weight} {item.selectedVariant.unit}
                  </p>
                )}
              </div>
              <div className="text-right">
                {(() => {
                  // Use centralized pricing calculation if variant data is available
                  if (item.variant) {
                    const pricing = calculatePricing(item.variant);
                    const itemTotal = pricing.finalPrice * item.quantity;
                    return (
                      <>
                        <p className="font-medium text-gray-900">₹{Math.round(itemTotal)}</p>
                        <p className="text-sm text-gray-500">₹{Math.round(pricing.finalPrice)} each</p>
                      </>
                    );
                  } else {
                    // Fallback to stored price for older orders
                    return (
                      <>
                        <p className="font-medium text-gray-900">₹{Math.round(item.price * item.quantity)}</p>
                        <p className="text-sm text-gray-500">₹{Math.round(item.price)} each</p>
                      </>
                    );
                  }
                })()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      {order.orderSummary && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>₹{order.orderSummary.subtotal}</span>
            </div>
            {order.orderSummary.deliveryCharge > 0 && (
              <div className="flex justify-between text-sm">
                <span>Delivery Charge:</span>
                <span>₹{order.orderSummary.deliveryCharge}</span>
              </div>
            )}
            {order.orderSummary.freeCashUsed > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Free Cash Used:</span>
                <span>-₹{order.orderSummary.freeCashUsed}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold pt-2 border-t">
              <span>Total:</span>
              <span>₹{order.orderSummary.grandTotal}</span>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Information */}
      {order.deliveryLocation && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Delivery Information</h3>
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 mt-0.5 text-gray-400" />
            <span>{order.deliveryLocation}</span>
          </div>
          {order.estimatedDeliveryTime && (
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-medium">Estimated Delivery: </span>
              {new Date(order.estimatedDeliveryTime).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}
        </div>
      )}

      {/* Payment Method */}
      <div className="text-sm text-gray-600">
        <span className="font-medium">Payment Method: </span>
        {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
      </div>
    </div>
  );
};

export default OrderTrackingContent;