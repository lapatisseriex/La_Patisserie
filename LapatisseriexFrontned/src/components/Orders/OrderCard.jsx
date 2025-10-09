import React, { useState } from 'react';
import { 
  Package, 
  Clock, 
  Truck, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  Calendar,
  CreditCard,
  Banknote,
  ShoppingBag,
  Star,
  Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { calculatePricing } from '../../utils/pricingUtils';
import './OrderCard.css';

const OrderCard = ({ order }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = (status) => {
    const icons = {
      'placed': <Clock className="h-4 w-4 text-blue-500" />,
      'confirmed': <CheckCircle className="h-4 w-4 text-green-500" />,
      'preparing': <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />,
      'ready': <Package className="h-4 w-4 text-orange-500" />,
      'out_for_delivery': <Truck className="h-4 w-4 text-purple-500" />,
      'delivered': <CheckCircle className="h-4 w-4 text-green-600" />,
      'cancelled': <XCircle className="h-4 w-4 text-red-500" />
    };
    return icons[status] || <Clock className="h-4 w-4 text-gray-500" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      'placed': 'bg-blue-50 text-blue-700 border-blue-200',
      'confirmed': 'bg-green-50 text-green-700 border-green-200',
      'preparing': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'ready': 'bg-orange-50 text-orange-700 border-orange-200',
      'out_for_delivery': 'bg-purple-50 text-purple-700 border-purple-200',
      'delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'cancelled': 'bg-red-50 text-red-700 border-red-200'
    };
    return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getStatusText = (status) => {
    const texts = {
      'placed': 'Order Placed',
      'confirmed': 'Confirmed',
      'preparing': 'Preparing',
      'ready': 'Ready',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    return texts[status] || status;
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

  return (
    <div className="order-card-hover elevated-card bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden mb-6 relative z-10 mt-4">
      {/* Header Section */}
      <div className="p-6 pb-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="font-bold text-lg text-gray-900">
                Order #{order.orderNumber}
              </h4>
              <span className={`status-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.orderStatus)}`}>
                <span className={`status-icon status-${order.orderStatus}`}>
                  {getStatusIcon(order.orderStatus)}
                </span>
                {getStatusText(order.orderStatus)}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <ShoppingBag className="h-4 w-4" />
                <span>{order.cartItems?.length || 0} item{(order.cartItems?.length || 0) !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 mb-1">
              ₹{order.orderSummary?.grandTotal || order.amount}
            </p>
            <div className="flex items-center gap-1 text-sm text-gray-600">
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
                <Link key={index} to={`/product/${item.productId}`} className="flex-shrink-0 relative group interactive-element">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border-2 border-white shadow-sm cursor-pointer hover:border-blue-300 transition-colors">
                    <img
                      src={item.productImage || defaultProductImage}
                      alt={item.productName}
                      className="w-full h-full object-cover product-image-hover"
                      onError={(e) => {
                        e.target.src = defaultProductImage;
                      }}
                    />
                  </div>
                  <div className="quantity-badge absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                    {item.quantity}
                  </div>
                </Link>
              ))}
              {order.cartItems.length > 4 && (
                <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <span className="text-xs font-semibold text-gray-500">
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
            className="interactive-element w-full px-6 py-3 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span>Order Details</span>
            <div className="transform transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              <ChevronDown className="h-4 w-4" />
            </div>
          </button>
          
          {isExpanded && (
            <div className="expandable-enter px-6 pb-4 space-y-3 bg-gray-50">
              {/* Delivery Location */}
              {order.deliveryLocation && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{order.deliveryLocation}</span>
                </div>
              )}
              
              {/* Product List */}
              <div className="space-y-2">
                {order.cartItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
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
                      <h5 className="font-medium text-gray-900 truncate">
                        {item.productName}
                      </h5>
                      {(() => {
                        // Use centralized pricing calculation if variant data is available
                        if (item.variant) {
                          const pricing = calculatePricing(item.variant);
                          return (
                            <p className="text-sm text-gray-500">
                              Qty: {item.quantity} × ₹{Math.round(pricing.finalPrice)}
                            </p>
                          );
                        } else {
                          // Fallback to stored price for older orders
                          return (
                            <p className="text-sm text-gray-500">
                              Qty: {item.quantity} × ₹{Math.round(item.price)}
                            </p>
                          );
                        }
                      })()}
                    </div>
                    <div className="text-right">
                      {(() => {
                        // Use centralized pricing calculation if variant data is available
                        if (item.variant) {
                          const pricing = calculatePricing(item.variant);
                          const itemTotal = pricing.finalPrice * item.quantity;
                          return (
                            <p className="font-semibold text-gray-900">
                              ₹{Math.round(itemTotal)}
                            </p>
                          );
                        } else {
                          // Fallback to stored price for older orders
                          return (
                            <p className="font-semibold text-gray-900">
                              ₹{Math.round(item.quantity * item.price)}
                            </p>
                          );
                        }
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {order.orderStatus === 'delivered' && (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Order Completed</span>
              </div>
            )}
            {order.orderStatus === 'preparing' && (
              <div className="flex items-center gap-1 text-sm text-yellow-600">
                <Clock className="h-4 w-4 animate-pulse" />
                <span>Being Prepared</span>
              </div>
            )}
          </div>
          
          <Link 
            to={`/orders/${order.orderNumber}`}
            className="btn-track-order inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors group interactive-element"
          >
            <Eye className="h-4 w-4" />
            <span>Track Order</span>
            <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;