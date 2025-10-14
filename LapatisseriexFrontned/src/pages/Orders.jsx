import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaBoxOpen, FaClock, FaTruck, FaCheckCircle, FaTimesCircle, FaReceipt, FaEye, FaCalendarAlt, FaMapMarkerAlt, FaShoppingBag } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { calculatePricing } from '../utils/pricingUtils';

// Helper function to get product image URL
const getProductImageUrl = (item) => {
  // Check multiple possible image sources
  if (item.productImage) return item.productImage;
  if (item.image) return item.image;
  if (item.images && item.images.length > 0) return item.images[0];
  if (item.variant && item.variant.images && item.variant.images.length > 0) return item.variant.images[0];
  if (item.product && item.product.images && item.product.images.length > 0) return item.product.images[0];
  
  // Check for nested image objects
  if (item.productImage && typeof item.productImage === 'object' && item.productImage.url) return item.productImage.url;
  if (item.image && typeof item.image === 'object' && item.image.url) return item.image.url;
  
  return null;
};

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
      'placed': <FaReceipt className="w-4 h-4" />,
      'out_for_delivery': <FaTruck className="w-4 h-4" />,
      'delivered': <FaCheckCircle className="w-4 h-4" />
    };
    return icons[status] || <FaClock className="w-4 h-4" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      'placed': 'bg-gradient-to-r from-blue-500 to-blue-600',
      'out_for_delivery': 'bg-gradient-to-r from-purple-500 to-purple-600',
      'delivered': 'bg-gradient-to-r from-green-500 to-green-600'
    };
    return colors[status] || 'bg-gradient-to-r from-gray-500 to-gray-600';
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
      'pending': 'bg-gradient-to-r from-yellow-500 to-yellow-600',
      'created': 'bg-gradient-to-r from-blue-500 to-blue-600',
      'paid': 'bg-gradient-to-r from-green-500 to-green-600',
      'failed': 'bg-gradient-to-r from-red-500 to-red-600',
      'refunded': 'bg-gradient-to-r from-gray-500 to-gray-600'
    };
    return colors[status] || 'bg-gradient-to-r from-gray-500 to-gray-600';
  };

  const StatusTimeline = ({ orderStatus, paymentStatus, createdAt }) => {
    const steps = [
      { key: 'placed', label: 'Order Placed', icon: FaReceipt },
      { key: 'out_for_delivery', label: 'Out for Delivery', icon: FaTruck },
      { key: 'delivered', label: 'Delivered', icon: FaCheckCircle }
    ];

    const currentStepIndex = steps.findIndex(step => step.key === orderStatus);
    
    return (
      <div className="relative px-2 md:px-4 py-4 md:py-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index <= currentStepIndex;
            const isActive = index === currentStepIndex;
            
            return (
              <div key={step.key} className="flex flex-col items-center relative z-10">
                <div className={`
                  w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-2 md:mb-3 relative transition-all duration-300 transform border-2 md:border-4
                  ${isCompleted 
                    ? isActive 
                      ? 'bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] border-white text-white shadow-lg scale-110' 
                      : 'bg-gradient-to-r from-green-500 to-green-600 border-white text-white shadow-md'
                    : 'bg-white border-gray-300 text-gray-400'
                  }
                `}>
                  <Icon className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <span style={{
                  background: isCompleted ? 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)' : '',
                  WebkitBackgroundClip: isCompleted ? 'text' : '',
                  backgroundClip: isCompleted ? 'text' : '',
                  color: isCompleted ? 'transparent' : '#9CA3AF'
                }} className={`text-xs md:text-sm text-center font-medium transition-colors duration-300 px-1`}>
                  {step.label}
                </span>
                {isActive && (
                  <span className="text-xs mt-1 px-2 py-1 rounded-full bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] text-white font-medium animate-pulse">
                    Current
                  </span>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Progress line */}
        <div className="absolute top-8 md:top-10 left-0 right-0 h-1 bg-gray-200 rounded-full" style={{ margin: '0 2.5rem md:0 3rem' }}>
          <div 
            className="h-full bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] rounded-full transition-all duration-700 ease-in-out"
            style={{ 
              width: currentStepIndex >= 0 ? `${(currentStepIndex / (steps.length - 1)) * 100}%` : '0%' 
            }}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-xl p-12">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 mx-auto mb-6">
              <div className="border-4 border-transparent border-t-4 rounded-full h-full w-full" style={{ borderTopColor: '#733857' }}></div>
            </div>
            <FaShoppingBag className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2" style={{
            background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent'
          }}>
            Loading Your Orders
          </h3>
          <p className="text-gray-600">Please wait while we fetch your order history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Enhanced Header */}
      <div className="bg-white shadow-lg border-b-4 border-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434]">
        <div className="container mx-auto px-4 py-4 md:py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2" style={{
                background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent'
              }}>
                My Orders
              </h1>
              <p className="text-gray-600 text-sm md:text-base">Track and manage your orders</p>
            </div>
            <div className="flex md:hidden items-center space-x-2">
              <div className="text-right">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-lg font-bold" style={{
                  background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent'
                }}>
                  {orders.length}
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold" style={{
                  background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent'
                }}>
                  {orders.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg mb-8 shadow-md">
            <div className="flex items-center">
              <FaTimesCircle className="text-red-500 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-red-800">Error Loading Orders</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] flex items-center justify-center">
                <FaBoxOpen className="text-4xl text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-4" style={{
                background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent'
              }}>
                No Orders Yet
              </h2>
              <p className="text-gray-600 text-lg mb-8">Start exploring our delicious collection of cakes and pastries!</p>
              <Link 
                to="/"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] text-white font-semibold rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                <FaShoppingBag className="mr-2" />
                Start Shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg md:rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100">
                {/* Enhanced Order Header */}
                <div className="bg-white p-4 md:p-6 border-b border-gray-200">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-3 md:space-y-0">
                    <div className="flex-1">
                      <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2" style={{
                        background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent'
                      }}>
                        Order #{order.orderNumber}
                      </h3>
                      <div className="flex items-center text-gray-600">
                        <FaCalendarAlt className="mr-2 text-sm" />
                        <span className="text-xs md:text-sm">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-xl md:text-2xl font-bold mb-1" style={{
                        background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent'
                      }}>
                        ₹{order.orderSummary?.grandTotal || order.amount}
                      </p>
                      <p className="text-gray-600 text-xs md:text-sm">
                        {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                      </p>
                    </div>
                  </div>

                  {/* Enhanced Status Badges */}
                  <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mt-4">
                    <div className="flex flex-wrap gap-2 md:gap-3">
                      <span className={`px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-semibold text-white flex items-center gap-2 ${getStatusColor(order.orderStatus)} shadow-lg`}>
                        {getStatusIcon(order.orderStatus)}
                        {getStatusText(order.orderStatus)}
                      </span>
                      <span className={`px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-semibold text-white ${getPaymentStatusColor(order.paymentStatus)} shadow-lg`}>
                        Payment: {order.paymentStatus}
                      </span>
                    </div>
                    
                    {/* Enhanced Track Order Button */}
                    <Link
                      to={`/orders/${order.orderNumber}`}
                      className="flex items-center justify-center gap-2 px-4 md:px-6 py-2 bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] hover:shadow-lg text-white font-semibold rounded-full transition-all duration-200 transform hover:scale-105 w-full md:w-auto"
                    >
                      <FaEye className="text-sm" />
                      <span className="text-sm md:text-base">Track Order</span>
                    </Link>
                  </div>
                </div>

                {/* Enhanced Status Timeline */}
                <div className="p-6 bg-gray-50">
                  <h4 className="text-lg font-semibold mb-4" style={{
                    background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent'
                  }}>
                    Order Progress
                  </h4>
                  <StatusTimeline 
                    orderStatus={order.orderStatus}
                    paymentStatus={order.paymentStatus}
                    createdAt={order.createdAt}
                  />
                </div>

                {/* Enhanced Order Items with Images */}
                <div className="p-6">
                  <h4 className="text-lg font-semibold mb-4" style={{
                    background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent'
                  }}>
                    Items ({order.cartItems?.length || 0})
                  </h4>
                  <div className="space-y-3 md:space-y-4">
                    {order.cartItems?.map((item, index) => (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 md:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200 space-y-3 sm:space-y-0">
                        <div className="flex items-center space-x-3 md:space-x-4">
                          {/* Product Image */}
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-white border-2 border-gray-200 flex-shrink-0 relative">
                            {(() => {
                              const imageUrl = getProductImageUrl(item);
                              return imageUrl ? (
                                <img 
                                  src={imageUrl} 
                                  alt={item.productName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    // Hide the image and show fallback
                                    e.target.style.display = 'none';
                                    const fallback = e.target.parentNode.querySelector('.fallback-placeholder');
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                />
                              ) : null;
                            })()}
                            {/* Fallback gradient placeholder */}
                            <div 
                              className="fallback-placeholder absolute inset-0 w-full h-full bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] flex items-center justify-center text-white font-bold text-lg md:text-xl"
                              style={{ 
                                display: getProductImageUrl(item) ? 'none' : 'flex' 
                              }}
                            >
                              {item.productName.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-gray-900 text-base md:text-lg truncate">{item.productName}</h5>
                            <p className="text-sm md:text-base text-gray-600">Quantity: <span className="font-medium">{item.quantity}</span></p>
                            {item.variant?.name && (
                              <p className="text-xs md:text-sm text-gray-500">Variant: {item.variant.name}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-left sm:text-right flex-shrink-0">
                          {(() => {
                            // Use centralized pricing calculation if variant data is available
                            if (item.variant) {
                              const pricing = calculatePricing(item.variant);
                              const itemTotal = pricing.finalPrice * item.quantity;
                              return (
                                <>
                                  <p className="font-bold text-lg md:text-xl" style={{
                                    background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)',
                                    WebkitBackgroundClip: 'text',
                                    backgroundClip: 'text',
                                    color: 'transparent'
                                  }}>
                                    ₹{Math.round(itemTotal)}
                                  </p>
                                  <p className="text-sm md:text-base text-gray-600">₹{Math.round(pricing.finalPrice)} each</p>
                                </>
                              );
                            } else {
                              // Fallback to stored price for older orders without variant data
                              return (
                                <>
                                  <p className="font-bold text-lg md:text-xl" style={{
                                    background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)',
                                    WebkitBackgroundClip: 'text',
                                    backgroundClip: 'text',
                                    color: 'transparent'
                                  }}>
                                    ₹{Math.round(item.price * item.quantity)}
                                  </p>
                                  <p className="text-sm md:text-base text-gray-600">₹{Math.round(item.price)} each</p>
                                </>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enhanced Delivery Info */}
                {order.deliveryLocation && (
                  <div className="p-4 md:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-t">
                    <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] flex items-center justify-center flex-shrink-0">
                        <FaMapMarkerAlt className="text-white text-sm md:text-base" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold mb-2 text-sm md:text-base" style={{
                          background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)',
                          WebkitBackgroundClip: 'text',
                          backgroundClip: 'text',
                          color: 'transparent'
                        }}>
                          Delivery Information
                        </h5>
                        <p className="text-gray-700 mb-2 text-sm md:text-base">
                          <span className="font-medium">Location:</span> {order.deliveryLocation}
                        </p>
                        {order.hostelName && (
                          <p className="text-gray-700 mb-2 text-sm md:text-base">
                            <span className="font-medium">Hostel:</span> {order.hostelName}
                          </p>
                        )}
                        {order.estimatedDeliveryTime && (
                          <p className="text-gray-700 text-sm md:text-base">
                            <span className="font-medium">Estimated Delivery:</span> {' '}
                            {new Date(order.estimatedDeliveryTime).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                      </div>
                    </div>
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