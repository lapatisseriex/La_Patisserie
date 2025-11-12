import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, Truck, CheckCircle, XCircle, Eye, Calendar, MapPin, ShoppingBag, ChevronRight, CreditCard, Banknote, Menu, X } from 'lucide-react';
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
  { key: 'delivered', label: 'DELIVERED', statuses: ['delivered'] },
  { key: 'cancelled', label: 'CANCELLED', statuses: ['cancelled'] }
];

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Log mobile device model info on mount
  useEffect(() => {
    const isMobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      console.log('Mobile device detected:', navigator.userAgent);
    }
  }, []);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const previousOverflowRef = useRef('');
  const { user } = useAuth();
  const orderExperience = useMemo(() => getOrderExperienceInfo(user), [user]);
  const activeFilterConfig = useMemo(
    () => ORDER_FILTERS.find(filter => filter.key === activeFilter) || ORDER_FILTERS[0],
    [activeFilter]
  );
  const handleFilterChange = useCallback((filterKey) => {
    setActiveFilter(filterKey);
    setIsMobileFiltersOpen(false);
  }, []);
  const handleToggleMobileFilters = useCallback(() => {
    setIsMobileFiltersOpen(prev => !prev);
  }, []);
  const closeMobileFilters = useCallback(() => {
    setIsMobileFiltersOpen(false);
  }, []);

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
          'Authorization': `Bearer ${authToken}`}});

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      
      const validOrders = (data.orders || []).filter(order => 
        order.orderStatus !== 'pending'
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
    setOrders(prevOrders => prevOrders.map(order => {
      if (order.orderNumber === orderNumber) {
        return {
          ...order,
          orderStatus: 'cancelled',
          cancelledAt: order.cancelledAt || new Date().toISOString()
        };
      }
      return order;
    }));
    setActiveFilter('cancelled');
    fetchUserOrders({ silent: true });
  }, [fetchUserOrders]);

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

  useEffect(() => {
    if (!isMobileFiltersOpen || typeof window === 'undefined') {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMobileFiltersOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileFiltersOpen]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const body = document.body;
    if (!body) {
      return undefined;
    }

    if (isMobileFiltersOpen) {
      previousOverflowRef.current = body.style.overflow;
      body.style.overflow = 'hidden';
    } else {
      body.style.overflow = previousOverflowRef.current || '';
    }

    return () => {
      body.style.overflow = previousOverflowRef.current || '';
    };
  }, [isMobileFiltersOpen]);

  // ...existing code...

  // Main container style for mobile: prevent unwanted horizontal scroll/space
  const mainContainerStyle = {
    width: '100vw',
    overflowX: 'hidden'};

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

  const cancelledOrdersCount = useMemo(
    () => orders.filter(order => order.orderStatus === 'cancelled').length,
    [orders]
  );

  const activeOrdersCount = useMemo(
    () => orders.filter(order => order.orderStatus !== 'cancelled').length,
    [orders]
  );

  const filterOrders = (filterKey) => {
    if (filterKey === 'all') {
      return orders.filter(order => order.orderStatus !== 'cancelled');
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-left">
              <h1 
                className="text-2xl sm:text-3xl font-light tracking-wide mb-2"
                style={{ 
                  color: '#1a1a1a',
                  letterSpacing: '0.02em'
                }}
              >
                My Orders
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <p className="text-xs sm:text-sm tracking-wide" style={{ 
                  color: 'rgba(26, 26, 26, 0.5)',
                  letterSpacing: '0.05em'
                }}>
                  {activeOrdersCount} {activeOrdersCount === 1 ? 'ORDER' : 'ORDERS'} ACTIVE
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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="py-3 sm:py-4">
            {/* Mobile Filter Toggle */}
            <div className="flex items-center justify-between lg:hidden">
              <button
                type="button"
                onClick={handleToggleMobileFilters}
                className="inline-flex items-center gap-2 rounded-full border border-[#733857] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#733857] transition hover:bg-[#733857] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#733857]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                aria-expanded={isMobileFiltersOpen}
                aria-controls="mobile-order-filter-menu"
              >
                {isMobileFiltersOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
             
              </button>
              <span className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#1a1a1a]/70">
                {activeFilterConfig.label}
              </span>
            </div>

            {/* Desktop Horizontal Filters */}
            <div className="hidden lg:flex lg:items-center lg:justify-center lg:gap-4">
              {ORDER_FILTERS.map((filter) => {
                const isActive = activeFilter === filter.key;
                return (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => handleFilterChange(filter.key)}
                    className={`inline-flex items-center justify-center gap-2 rounded-full border px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.28em] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#733857]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${isActive ? 'border-[#733857] bg-[#733857] text-white shadow-md' : 'border-gray-300 text-gray-600 hover:border-[#733857] hover:text-[#733857]'}`}
                  >
                    <span>{filter.label}</span>
                    {filter.key === 'cancelled' && cancelledOrdersCount > 0 && (
                      <span
                        className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[0.65rem] font-bold ${isActive ? 'bg-white text-[#733857]' : 'bg-gray-200 text-gray-700'}`}
                      >
                        {cancelledOrdersCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {isMobileFiltersOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#1f2029]/95 backdrop-blur-md flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Order filters"
          onClick={closeMobileFilters}
        >
          <div className="flex justify-end p-6">
            <button
              type="button"
              onClick={closeMobileFilters}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/70 transition hover:border-white/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1f2029]"
              aria-label="Close filter menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <nav id="mobile-order-filter-menu" className="flex flex-1 items-center justify-center px-8 pb-12">
            <ul className="w-full max-w-xs space-y-5 text-center" onClick={(event) => event.stopPropagation()}>
              {ORDER_FILTERS.map((filter) => {
                const isActive = activeFilter === filter.key;
                return (
                  <li key={filter.key}>
                    <button
                      type="button"
                      onClick={() => handleFilterChange(filter.key)}
                      className={`flex w-full items-center justify-center gap-3 rounded-full border px-6 py-3 text-sm font-semibold uppercase transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffeba7]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1f2029] ${isActive ? 'border-white bg-white text-[#733857] shadow-[0_18px_45px_rgba(255,235,167,0.28)]' : 'border-white/20 text-white/70 hover:border-white/40 hover:text-white'}`}
                    >
                      <span className="tracking-[0.32em]">{filter.label}</span>
                      {filter.key === 'cancelled' && cancelledOrdersCount > 0 && (
                        <span
                          className={`inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full border px-2 text-[0.68rem] font-bold tracking-normal ${isActive ? 'border-[#733857] text-[#733857]' : 'border-white/40 text-white/80'}`}
                        >
                          {cancelledOrdersCount}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        {error && (
          <div 
            className="mb-6 p-4 border-l-2 border-red-500 bg-red-50"
            style={{ animation: 'fadeIn 0.3s ease-out' }}
          >
            <div className="flex items-start">
              <XCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div style={mainContainerStyle}>
                <p className="text-sm font-medium text-red-800">Unable to load orders</p>
                <p className="text-xs text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 sm:py-20" style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center ">
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
            {filteredOrders.map((order) => (
              <OrderCardComponent 
                key={order._id}
                order={order}
                onOrderCancelled={handleOrderCancelled}
                isCancelledView={activeFilter === 'cancelled'}
              />
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