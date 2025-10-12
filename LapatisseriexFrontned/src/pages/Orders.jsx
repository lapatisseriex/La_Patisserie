import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaBoxOpen, FaClock, FaTruck, FaCheckCircle, FaTimesCircle, FaReceipt, FaEye } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { calculatePricing } from '../utils/pricingUtils';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchUserOrders();
  }, []);

  const fetchUserOrders = async () => {
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/orders/user`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      'placed': <FaReceipt className="text-blue-500" />,
      'out_for_delivery': <FaTruck className="text-purple-500" />,
      'delivered': <FaCheckCircle className="text-green-600" />
    };
    return icons[status] || <FaClock className="text-gray-500" />;
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

  const StatusTimeline = ({ orderStatus, paymentStatus, createdAt }) => {
    const steps = [
      { key: 'placed', label: 'Order Placed', icon: FaReceipt },
      { key: 'out_for_delivery', label: 'Out for Delivery', icon: FaTruck },
      { key: 'delivered', label: 'Delivered', icon: FaCheckCircle }
    ];

    const currentStepIndex = steps.findIndex(step => step.key === orderStatus);
    
    return (
      <div className="relative px-2 py-4">
        {/* Progress line background - Desktop vertical */}
        <div className="absolute left-1/2 top-8 bottom-8 w-1 bg-gray-200 rounded-full transform -translate-x-1/2 hidden md:block"></div>
        
        {/* Progress line filled - Desktop vertical with gradient */}
        <div 
          className="absolute left-1/2 top-8 w-1 bg-gradient-to-b from-green-400 to-green-600 rounded-full transform -translate-x-1/2 transition-all duration-700 ease-in-out shadow-sm hidden md:block"
          style={{ 
            height: currentStepIndex >= 0 ? `${(currentStepIndex / (steps.length - 1)) * 100}%` : '0%' 
          }}
        ></div>

        <div className="flex items-center justify-between md:flex-col md:space-y-8 overflow-x-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index <= currentStepIndex;
            const isActive = index === currentStepIndex;
            
            return (
              <div key={step.key} className="flex flex-col items-center flex-1 md:flex-none relative">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center mb-1 relative z-10 border-2 transition-all duration-300 transform
                  ${isCompleted 
                    ? isActive 
                      ? 'bg-yellow-500 border-yellow-500 text-white shadow-lg scale-110' 
                      : 'bg-green-500 border-green-500 text-white shadow-md'
                    : 'bg-white border-gray-300 text-gray-400 hover:border-gray-400'
                  }
                `}>
                  <Icon className="text-sm" />
                </div>
                <span className={`text-xs text-center px-1 transition-colors duration-300 ${
                  isCompleted ? 'text-gray-900 font-medium' : 'text-gray-400'
                }`}>
                  {step.label}
                </span>
                {isActive && (
                  <span className="text-xs text-yellow-600 font-medium mt-1 animate-pulse">Current</span>
                )}
                
                {/* Mobile horizontal progress line with enhanced styling */}
                {index < steps.length - 1 && (
                  <div className={`
                    absolute top-4 left-8 right-0 h-1 md:hidden transition-all duration-500 rounded-full
                    ${isCompleted ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gray-200'}
                  `} style={{ width: 'calc(100vw / 6 - 2rem)' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <Link 
              to="/"
              className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
            >
              <FaArrowLeft className="mr-2" />
              Back to Home
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <FaBoxOpen className="text-6xl text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Orders Yet</h2>
            <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
            <Link 
              to="/"
              className="inline-block bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Order Header */}
                <div className="border-b border-gray-200 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{order.orderNumber}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        ₹{order.orderSummary?.grandTotal || order.amount}
                      </p>
                      <p className="text-sm text-gray-500 capitalize">
                        {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                      </p>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex gap-2 items-center justify-between">
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(order.orderStatus)}`}>
                        {getStatusIcon(order.orderStatus)}
                        {getStatusText(order.orderStatus)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                        Payment: {order.paymentStatus}
                      </span>
                    </div>
                    
                    {/* Track Order Button */}
                    <Link
                      to={`/orders/${order.orderNumber}`}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-full transition-colors duration-200"
                    >
                      <FaEye className="text-xs" />
                      Track Order
                    </Link>
                  </div>
                </div>

                {/* Status Timeline */}
                <div className="p-4 bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Order Progress</h4>
                  <StatusTimeline 
                    orderStatus={order.orderStatus}
                    paymentStatus={order.paymentStatus}
                    createdAt={order.createdAt}
                  />
                </div>

                {/* Order Items */}
                <div className="p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Items ({order.cartItems?.length || 0})</h4>
                  <div className="space-y-2">
                    {order.cartItems?.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <div>
                          <p className="font-medium text-gray-900">{item.productName}</p>
                          <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
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
                              // Fallback to stored price for older orders without variant data
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

                {/* Delivery Info */}
                {order.deliveryLocation && (
                  <div className="p-4 bg-gray-50 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Delivery Location:</span>
                      <span className="font-medium text-gray-900">{order.deliveryLocation}</span>
                    </div>
                    {order.estimatedDeliveryTime && (
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-600">Estimated Delivery:</span>
                        <span className="font-medium text-gray-900">
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;