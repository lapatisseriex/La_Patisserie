import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, Truck, CheckCircle, XCircle, Eye, Calendar, MapPin, ShoppingBag, ChevronRight, CreditCard, Banknote } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { calculatePricing } from '../utils/pricingUtils';
import { resolveOrderItemVariantLabel } from '../utils/variantUtils';
import OfferBadge from '../components/common/OfferBadge';
import { getOrderExperienceInfo } from '../utils/orderExperience';
import webSocketService from '../services/websocketService';
import OrderCardComponent from '../components/Orders/OrderCard';
// Updated: Minor change for commit

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

const ORDER_FILTERS = [
  { key: 'all', label: 'ALL ORDERS' },
  { key: 'processing', label: 'PROCESSING', statuses: ['placed', 'confirmed', 'preparing', 'ready'] },
  { key: 'out_for_delivery', label: 'IN TRANSIT', statuses: ['out_for_delivery'] },
  { key: 'delivered', label: 'DELIVERED', statuses: ['delivered'] }
];

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const { user } = useAuth();
  const orderExperience = useMemo(() => getOrderExperienceInfo(user), [user]);

  const fetchUserOrders = useCallback(async (options = {}) => {
    const { silent = false } = options;

    try {
      if (!silent) {
        setLoading(true);
      }

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
      
      const validOrders = (data.orders || []).filter(order => 
        order.orderStatus !== 'pending' && 
        order.orderStatus !== 'cancelled'
      );
      
      setOrders(validOrders);
      setError(null);
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (!silent) {
        setError(error.message);
        setOrders([]);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  // Handle order cancellation
  const handleOrderCancelled = useCallback((orderNumber) => {
    // Remove the cancelled order from the list
    setOrders(prevOrders => prevOrders.filter(order => order.orderNumber !== orderNumber));
  }, []);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    fetchUserOrders();
  }, [user, fetchUserOrders]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const userId = user._id || user.uid || null;
    webSocketService.connect(userId);

    const handleOrderStatusUpdate = (update) => {
      if (!update?.orderNumber) {
        return;
      }
      fetchUserOrders({ silent: true });
    };

    webSocketService.onOrderStatusUpdate(handleOrderStatusUpdate);

    return () => {
      webSocketService.offOrderStatusUpdate(handleOrderStatusUpdate);
    };
  }, [user, fetchUserOrders]);

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        icon: Package,
        color: '#6b7280',
        label: 'PAYMENT PENDING'
      },
      placed: {
        icon: Package,
        color: '#733857',
        label: 'ORDER PLACED'
      },
      confirmed: {
        icon: CheckCircle,
        color: '#10b981',
        label: 'CONFIRMED'
      },
      preparing: {
        icon: Clock,
        color: '#f59e0b',
        label: 'PREPARING'
      },
      ready: {
        icon: CheckCircle,
        color: '#7c3aed',
        label: 'READY FOR DISPATCH'
      },
      out_for_delivery: {
        icon: Truck,
        color: '#8d4466',
        label: 'OUT FOR DELIVERY'
      },
      delivered: {
        icon: CheckCircle,
        color: '#059669',
        label: 'DELIVERED'
      },
      cancelled: {
        icon: Package,
        color: '#dc2626',
        label: 'CANCELLED'
      }
    };
    return configs[status] || configs['placed'];
  };

  const filterOrders = (filterKey) => {
    if (filterKey === 'all') {
      return orders;
    }

    const filterConfig = ORDER_FILTERS.find(filter => filter.key === filterKey);
    if (!filterConfig || !Array.isArray(filterConfig.statuses)) {
      return orders;
    }

    return orders.filter(order => filterConfig.statuses.includes(order.orderStatus));
  };

  const filteredOrders = filterOrders(activeFilter);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <div className="w-16 h-16 border-2 border-gray-100 rounded-full"></div>
            <div 
              className="w-16 h-16 border-2 border-t-[#733857] rounded-full animate-spin absolute top-0 left-0"
              style={{ animationDuration: '0.8s' }}
            ></div>
          </div>
          <p className="text-sm" style={{ color: '#1a1a1a' }}>Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 
                className="text-3xl font-light tracking-wide mb-2"
                style={{ 
                  color: '#1a1a1a',
                  letterSpacing: '0.02em'
                }}
              >
                My Orders
              </h1>
              <div className="flex items-center gap-3">
                <p className="text-sm tracking-wide" style={{ 
                  color: 'rgba(26, 26, 26, 0.5)',
                  letterSpacing: '0.05em'
                }}>
                  {orders.length} {orders.length === 1 ? 'ORDER' : 'ORDERS'} PLACED
                </p>
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
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto no-scrollbar py-4">
            {ORDER_FILTERS.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className="relative pb-2 text-xs font-semibold whitespace-nowrap transition-colors duration-200 tracking-widest"
                style={{ 
                  color: activeFilter === filter.key ? '#733857' : 'rgba(26, 26, 26, 0.4)',
                  letterSpacing: '0.08em'
                }}
              >
                {filter.label}
                {activeFilter === filter.key && (
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434]"
                    style={{ animation: 'slideIn 0.3s ease-out' }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div 
            className="mb-6 p-4 border-l-2 border-red-500 bg-red-50"
            style={{ animation: 'fadeIn 0.3s ease-out' }}
          >
            <div className="flex items-start">
              <XCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Unable to load orders</p>
                <p className="text-xs text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {filteredOrders.length === 0 ? (
          <div className="text-center py-20" style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center border border-[#733857]/20">
              <ShoppingBag className="w-10 h-10 text-[#733857]" />
            </div>
            <h2 className="text-3xl font-light tracking-wide text-[#1a1a1a] mb-3">
              {activeFilter === 'all' ? 'No orders yet' : 'No orders in this category'}
            </h2>
            <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
              {activeFilter === 'all'
                ? 'Explore our collection and place your first order.'
                : 'Try another filter to see more of your orders.'}
            </p>
            <Link 
              to="/"
              className="inline-flex items-center gap-2 border border-[#733857] px-6 py-3 text-sm font-medium tracking-wide text-[#733857] transition-colors duration-300 hover:bg-[#733857] hover:text-white"
            >
              Browse Products
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map((order, index) => (
              <OrderCardComponent key={order._id} order={order} onOrderCancelled={handleOrderCancelled} />
            ))}
          </div>
        )}
      </div>

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
        
        @keyframes slideIn {
          from {
            transform: scaleX(0);
            transform-origin: left;
          }
          to {
            transform: scaleX(1);
            transform-origin: left;
          }
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

// OrderCard Component
const OrderCard = ({ order, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
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

  const statusConfig = getStatusConfig(order.orderStatus);
  const StatusIcon = statusConfig.icon;

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

  const previewItems = Array.isArray(order.cartItems) ? order.cartItems.slice(0, 2) : [];
  const remainingItemsCount = Math.max((order.cartItems?.length || 0) - previewItems.length, 0);

  return (
    <div 
      className="bg-white border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg group"
      style={{ 
        animation: `fadeIn 0.4s ease-out ${index * 0.1}s both`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}
    >
      <div className="p-5">
        {/* Top Row: Order Number & Status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-base font-medium mb-1 tracking-wide" style={{ 
              color: '#1a1a1a',
              letterSpacing: '0.03em'
            }}>
              ORDER #{order.orderNumber}
            </h3>
            <div className="flex items-center text-xs tracking-wider" style={{ 
              color: 'rgba(26, 26, 26, 0.5)',
              letterSpacing: '0.05em'
            }}>
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              {formatDate(order.createdAt).toUpperCase()} • {formatTime(order.createdAt)}
            </div>
          </div>
          
          {/* Clean Flat Status Badge - No Background, No Rounded Corners */}
          <div className="flex items-center gap-2.5 px-3 py-1.5">
            <StatusIcon 
              className="w-4 h-4" 
              style={{ 
                color: statusConfig.color,
                strokeWidth: 2.5
              }} 
            />
            <span 
              className="text-xs font-bold tracking-widest"
              style={{ 
                color: statusConfig.color,
                letterSpacing: '0.12em'
              }}
            >
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Product Preview */}
        <div className="flex items-center mb-4 pb-4 border-b border-gray-100">
          <div className="flex -space-x-2 mr-4">
            {order.cartItems?.slice(0, 3).map((item, idx) => {
              const imageUrl = getProductImageUrl(item);
              return (
                <div 
                  key={idx}
                  className="w-12 h-12 bg-gray-100 border-2 border-white overflow-hidden"
                  style={{ zIndex: 3 - idx }}
                >
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt={item.productName || item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-5 h-5" style={{ color: 'rgba(26, 26, 26, 0.3)' }} />
                    </div>
                  )}
                </div>
              );
            })}
            {order.cartItems?.length > 3 && (
              <div 
                className="w-12 h-12 border-2 border-white flex items-center justify-center text-xs font-medium"
                style={{ 
                  backgroundColor: 'rgba(115, 56, 87, 0.08)',
                  color: '#733857',
                  zIndex: 0
                }}
              >
                +{order.cartItems.length - 3}
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <p className="text-sm font-medium mb-1 tracking-wide" style={{ 
              color: '#1a1a1a',
              letterSpacing: '0.03em'
            }}>
              {order.cartItems?.length || 0} {order.cartItems?.length === 1 ? 'ITEM' : 'ITEMS'}
            </p>
            <p className="text-xs tracking-wider" style={{ 
              color: 'rgba(26, 26, 26, 0.5)',
              letterSpacing: '0.05em'
            }}>
              {order.paymentMethod === 'cod' ? (
                <span className="inline-flex items-center">
                  <Banknote className="w-3.5 h-3.5 mr-1" />
                  CASH ON DELIVERY
                </span>
              ) : (
                <span className="inline-flex items-center">
                  <CreditCard className="w-3.5 h-3.5 mr-1" />
                  ONLINE PAYMENT
                </span>
              )}
            </p>
            {previewItems.length > 0 && (
              <div className="mt-3 space-y-1">
                {previewItems.map((item, itemIdx) => {
                  const variantLabel = resolveOrderItemVariantLabel(item);
                  const pricing = item?.variant ? calculatePricing(item.variant) : null;
                  const discountPercentage = Number.isFinite(pricing?.discountPercentage) ? pricing.discountPercentage : 0;
                  const hasDiscount = discountPercentage > 0;

                  return (
                    <p
                      key={itemIdx}
                      className="text-xs flex flex-wrap items-center gap-1 tracking-wider"
                      style={{ color: 'rgba(26, 26, 26, 0.55)', letterSpacing: '0.04em' }}
                    >
                      <span className="font-medium" style={{ color: '#1a1a1a' }}>
                        {item.productName}
                      </span>
                      {variantLabel && (
                        <span className="text-[11px] uppercase" style={{ color: '#733857' }}>
                          • {variantLabel}
                        </span>
                      )}
                      {hasDiscount && (
                        <OfferBadge label={`${discountPercentage}% OFF`} className="text-[9px]" />
                      )}
                      <span className="text-[11px]" style={{ color: 'rgba(26, 26, 26, 0.5)' }}>
                        ×{item.quantity}
                      </span>
                    </p>
                  );
                })}
                {remainingItemsCount > 0 && (
                  <p className="text-[11px] tracking-widest" style={{ color: 'rgba(26, 26, 26, 0.4)', letterSpacing: '0.08em' }}>
                    +{remainingItemsCount} more {remainingItemsCount === 1 ? 'item' : 'items'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row: Total & Action */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs mb-1 tracking-widest" style={{ 
              color: 'rgba(26, 26, 26, 0.5)',
              letterSpacing: '0.08em'
            }}>
              TOTAL AMOUNT
            </p>
            <p className="text-xl font-medium tracking-wide" style={{ 
              color: '#733857',
              letterSpacing: '0.02em'
            }}>
              ₹{order.orderSummary?.grandTotal || order.amount}
            </p>
          </div>
          
          <Link
            to={`/orders/${order.orderNumber}`}
            className="inline-flex items-center px-5 py-2.5 text-xs font-semibold tracking-widest text-white transition-all duration-300 hover:opacity-90 group"
            style={{ 
              background: 'linear-gradient(135deg, #733857 0%, #8d4466 50%, #412434 100%)',
              letterSpacing: '0.08em'
            }}
          >
            VIEW DETAILS
            <Eye className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Delivery Address */}
        {order.deliveryAddress && (
          <div 
            className="mt-4 pt-4 border-t border-gray-100 flex items-start"
          >
            <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" style={{ color: 'rgba(26, 26, 26, 0.4)' }} />
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: 'rgba(26, 26, 26, 0.7)' }}>
                Delivery Location
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(26, 26, 26, 0.5)' }}>
                {order.deliveryAddress.hostelName && `${order.deliveryAddress.hostelName}, `}
                {order.deliveryAddress.area}, {order.deliveryAddress.city}
              </p>
            </div>
          </div>
        )}
      </div>

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

export default Orders;