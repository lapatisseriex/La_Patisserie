import React from 'react';
import { Package, Clock, Truck, CheckCircle, XCircle, MapPin, CreditCard, Building } from 'lucide-react';
import { calculatePricing } from '../../utils/pricingUtils';

const OrderTrackingContent = ({ order }) => {
  if (!order) return null;

  const getStatusIcon = (status) => {
    const icons = {
      'placed': Package,
      'out_for_delivery': Truck,
      'delivered': CheckCircle
    };
    return icons[status] || Clock;
  };

  const getStatusColor = (status) => {
    const colors = {
      'placed': 'bg-blue-100 text-blue-800',
      'out_for_delivery': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-green-200 text-green-900'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      'placed': 'Order Placed',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Delivered'
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
                    isCompleted ? '' : ''
                  }`} style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                    {step.label}
                  </p>
                  {isActive && (
                    <p className="text-sm font-medium animate-pulse" style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Current Status</p>
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
          <h3 className="text-sm font-medium mb-2" style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Order Status</h3>
          <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(order.orderStatus)}`}>
            {React.createElement(getStatusIcon(order.orderStatus), { className: "h-4 w-4" })}
            {getStatusText(order.orderStatus)}
          </span>
        </div>
        <div>
          <h3 className="text-sm font-medium mb-2" style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Payment Status</h3>
          <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
            <CreditCard className="h-4 w-4" />
            {order.paymentStatus}
          </span>
        </div>
      </div>

      {/* Order Progress Timeline */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4" style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Order Progress</h3>
        <StatusTimeline orderStatus={order.orderStatus} />
      </div>

      {/* Order Items */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4" style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
          Items ({order.cartItems?.length || 0})
        </h3>
        <div className="space-y-3">
          {order.cartItems?.map((item, index) => (
            <div key={index} className="flex items-center py-3 border-b border-gray-100 last:border-b-0 gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium" style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{item.productName}</p>
                  {/* Item Dispatch Status */}
                  {item.dispatchStatus && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      item.dispatchStatus === 'delivered' 
                        ? 'bg-green-100 text-green-800' 
                        : item.dispatchStatus === 'dispatched'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.dispatchStatus === 'delivered' && <CheckCircle className="h-3 w-3" />}
                      {item.dispatchStatus === 'dispatched' && <Truck className="h-3 w-3" />}
                      {item.dispatchStatus === 'pending' && <Clock className="h-3 w-3" />}
                      {item.dispatchStatus === 'delivered' ? 'Delivered' 
                       : item.dispatchStatus === 'dispatched' ? 'Dispatched'
                       : 'Preparing'}
                    </span>
                  )}
                </div>
                <p className="text-sm" style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Quantity: {item.quantity}</p>
                {item.selectedVariant && (
                  <p className="text-sm" style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                    Variant: {item.selectedVariant.weight} {item.selectedVariant.unit}
                  </p>
                )}
                {item.dispatchedAt && (
                  <p className="text-xs" style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                    Dispatched: {new Date(item.dispatchedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
              {/* Product Image */}
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                <img
                  src={item.productImage || "/placeholder-image.jpg"}
                  alt={item.productName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "/placeholder-image.jpg";
                  }}
                />
              </div>
              <div className="text-right">
                {(() => {
                  // Use centralized pricing calculation if variant data is available
                  if (item.variant) {
                    const pricing = calculatePricing(item.variant);
                    const itemTotal = pricing.finalPrice * item.quantity;
                    return (
                      <>
                        <p className="font-medium" style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>₹{Math.round(itemTotal)}</p>
                        <p className="text-sm" style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>₹{Math.round(pricing.finalPrice)} each</p>
                      </>
                    );
                  } else {
                    // Fallback to stored price for older orders
                    return (
                      <>
                        <p className="font-medium" style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>₹{Math.round(item.price * item.quantity)}</p>
                        <p className="text-sm" style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>₹{Math.round(item.price)} each</p>
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
          <h3 className="text-lg font-semibold mb-4" style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Order Summary</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Subtotal:</span>
              <span style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>₹{order.orderSummary.subtotal}</span>
            </div>
            {order.orderSummary.deliveryCharge > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Delivery Charge:</span>
                <span style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>₹{order.orderSummary.deliveryCharge}</span>
              </div>
            )}
            {order.orderSummary.freeCashUsed > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Free Cash Used:</span>
                <span style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>-₹{order.orderSummary.freeCashUsed}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold pt-2 border-t">
              <span style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Total:</span>
              <span style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>₹{order.orderSummary.grandTotal}</span>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Information */}
      {order.deliveryLocation && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2" style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Delivery Information</h3>
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 mt-0.5" style={{ color: '#733857' }} />
            <span style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{order.deliveryLocation}</span>
          </div>
          {order.hostelName && (
            <div className="flex items-start gap-2 text-sm mt-2">
              <Building className="h-4 w-4 mt-0.5" style={{ color: '#733857' }} />
              <span style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{order.hostelName}</span>
            </div>
          )}
          {order.estimatedDeliveryTime && (
            <div className="mt-2 text-sm">
              <span className="font-medium" style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Estimated Delivery: </span>
              <span style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                {new Date(order.estimatedDeliveryTime).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Payment Method */}
      <div className="text-sm">
        <span className="font-medium" style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Payment Method: </span>
        <span style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
          {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
        </span>
      </div>
    </div>
  );
};

export default OrderTrackingContent;