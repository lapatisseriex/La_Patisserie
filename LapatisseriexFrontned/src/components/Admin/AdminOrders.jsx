import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaEye, 
  FaMoneyBillWave, 
  FaCreditCard,
  FaFilter,
  FaDownload,
  FaSyncAlt,
  FaTruck,
  FaSpinner,
  FaCheck,
  FaBell,
  FaTimes,
  FaThList,
  FaTable
} from 'react-icons/fa';
import { 
  FiSearch, 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiRefreshCw, 
  FiDownload, 
  FiDatabase,
  FiFilter,
  FiCalendar,
  FiCreditCard
} from 'react-icons/fi';
import { HiOutlineOfficeBuilding } from 'react-icons/hi';
import { BsCashCoin } from 'react-icons/bs';
import { toast } from 'react-hot-toast';
import { resolveOrderItemVariantLabel } from '../../utils/variantUtils';
import io from 'socket.io-client';
import { getWebSocketBaseUrl, getSocketOptions } from '../../utils/websocketUrl.js';
import { useLocation } from 'react-router-dom';

const AdminOrders = () => {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    paymentMethod: '',
    paymentStatus: '',
    search: '',
    email: '',
    phone: '',
    hostel: '',
    startDate: '',
    endDate: '',
    quickRange: ''
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [deliveryLoading, setDeliveryLoading] = useState({});
  const [deliverySuccess, setDeliverySuccess] = useState({});
  const [showNewOrderBanner, setShowNewOrderBanner] = useState(false);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsSocketId, setWsSocketId] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grouped'

  const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iI0Q1RDlERCIvPgo8L3N2Zz4K';

  const getItemImage = (item = {}) => {
    const sources = [
      item.image,
      Array.isArray(item.images) && item.images[0],
      item.productImage,
      item.productId?.image,
      Array.isArray(item.productId?.images) && item.productId.images[0],
      item.product?.image,
      Array.isArray(item.product?.images) && item.product.images[0],
      item.productDetails?.image,
      Array.isArray(item.productDetails?.images) && item.productDetails.images[0]
    ];

    return sources.find(Boolean) || placeholderImage;
  };

  const getVariantDisplay = (item = {}) => {
    const productRef = item.productDetails || item.product || {};
    const variants = Array.isArray(productRef?.variants)
      ? productRef.variants
      : Array.isArray(item?.variants)
        ? item.variants
        : [];

    const variantIndex = Number.isInteger(item?.variantIndex)
      ? item.variantIndex
      : Number.isInteger(productRef?.variantIndex)
        ? productRef.variantIndex
        : 0;

    const variantFromArray = variants?.[variantIndex];
    const selectedVariant =
      item?.selectedVariant ||
      productRef?.selectedVariant ||
      item?.variant ||
      variantFromArray;

    const variantLabel = resolveOrderItemVariantLabel({
      ...item,
      variants,
      variantIndex,
      variant: item?.variant || selectedVariant || variantFromArray,
      selectedVariant,
      variantLabel: item?.variantLabel || productRef?.variantLabel
    });

    return variantLabel || '';
  };

  // Status color mapping
  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-gray-100 text-gray-800', // ✅ Added pending status
      'placed': 'bg-blue-100 text-blue-800',
      'confirmed': 'bg-green-100 text-green-800',
      'preparing': 'bg-yellow-100 text-yellow-800',
      'ready': 'bg-purple-100 text-purple-800',
      'out_for_delivery': 'bg-indigo-100 text-indigo-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'created': 'bg-blue-100 text-blue-800',
      'cancelled': 'bg-red-100 text-red-800', // ✅ Added cancelled status
      'paid': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'refunded': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Fetch orders
  const fetchOrders = async (page = 1, searchFilters = filters) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...searchFilters
      });

      // Remove empty filters
      Object.keys(searchFilters).forEach(key => {
        if (!searchFilters[key]) {
          queryParams.delete(key);
        }
      });

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/orders?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.orders);
      setCurrentPage(data.pagination.page);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };
  // Handle search and filters
  const handleSearch = () => {
    setCurrentPage(1);
    fetchOrders(1, filters);
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setCurrentPage(1);
    fetchOrders(1, newFilters);
  };

  // Handle multiple filter changes at once
  const handleMultipleFilterChange = (newFilters) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    setCurrentPage(1);
    fetchOrders(1, updatedFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      status: '',
      paymentMethod: '',
      paymentStatus: '',
      search: '',
      email: '',
      phone: '',
      hostel: '',
      startDate: '',
      endDate: '',
      quickRange: ''
    };
    setFilters(clearedFilters);
    setCurrentPage(1);
    fetchOrders(1, clearedFilters);
  };

  // Handle quick date range selection
  const handleQuickRange = (range) => {
    let startDate = '';
    let endDate = '';
    
    if (range) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (range) {
        case 'today':
          startDate = today.toISOString().split('T')[0];
          endDate = today.toISOString().split('T')[0];
          break;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 7);
          startDate = weekAgo.toISOString().split('T')[0];
          endDate = today.toISOString().split('T')[0];
          break;
        case 'month':
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          startDate = monthStart.toISOString().split('T')[0];
          endDate = today.toISOString().split('T')[0];
          break;
      }
    }
    
    const newFilters = { 
      ...filters, 
      startDate, 
      endDate, 
      quickRange: range 
    };
    setFilters(newFilters);
    setCurrentPage(1);
    fetchOrders(1, newFilters);
  };

  // View order details with graceful fallback for synthetic/local orders
  const viewOrderDetails = async (orderOrNumber) => {
    // Accept either an order object or an orderNumber string
    const providedOrder = typeof orderOrNumber === 'object' && orderOrNumber !== null ? orderOrNumber : null;
    const orderNumber = providedOrder ? providedOrder.orderNumber : orderOrNumber;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/orders/${orderNumber}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        // If backend can't find it but we have a local (synthetic) order, fallback
        if (response.status === 404 && providedOrder) {
          console.warn('Order not found on backend; displaying synthetic/local order object.');
          toast((t) => (
            <span>
              Showing local order – backend record missing.
              <button onClick={() => toast.dismiss(t.id)} className="ml-2 underline">Dismiss</button>
            </span>
          ), { icon: 'ℹ️' });
          setSelectedOrder(providedOrder);
          setShowOrderModal(true);
          return;
        }
        throw new Error(`Failed to fetch order details (HTTP ${response.status})`);
      }

      const data = await response.json();
      setSelectedOrder(data.order);
      setShowOrderModal(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      if (providedOrder) {
        // Fallback to provided order object even on network or other errors
        toast.error('Backend fetch failed; showing local order snapshot.');
        setSelectedOrder(providedOrder);
        setShowOrderModal(true);
      } else {
        toast.error(error.message || 'Failed to fetch order details');
      }
    }
  };

  // Handle search query from global navigation
  useEffect(() => {
    const searchQueryFromNav = location.state?.searchQuery;
    if (searchQueryFromNav) {
      setFilters(prev => ({ ...prev, search: searchQueryFromNav }));
      // Clear the location state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    fetchOrders();

    // Set up WebSocket connection (production-safe)
    const apiUrl = getWebSocketBaseUrl();
    
    console.log('%c🔌 WebSocket Connection Attempt', 'color: #733857; font-weight: bold; font-size: 14px');
    console.log('📍 Cleaned URL for WebSocket:', apiUrl);
    console.log('⏰ Time:', new Date().toLocaleTimeString());
    
    const socket = io(apiUrl, getSocketOptions({ autoConnect: true }));

    // Heartbeat optional (UI-level) to reflect connection health
    let heartbeatInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      }
    }, 30000);
    
    socket.on('connect', () => {
      console.log('%c✅ WebSocket CONNECTED!', 'color: green; font-weight: bold; font-size: 14px');
      console.log('🆔 Socket ID:', socket.id);
      console.log('🔌 Transport:', socket.io.engine.transport.name);
      console.log('⏰ Connected at:', new Date().toLocaleTimeString());
      setWsConnected(true);
      setWsSocketId(socket.id);
      toast.success('WebSocket connected - Ready for live updates!', {
        duration: 3000,
        icon: '🔌'});
    });

    socket.on('connect_error', (error) => {
      console.log('%c❌ WebSocket Connection ERROR', 'color: red; font-weight: bold; font-size: 14px');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error type:', error.type);
      console.log('⏰ Error at:', new Date().toLocaleTimeString());
      setWsConnected(false);
      setWsSocketId('');
      toast.error(`WebSocket error: ${error.message}`, {
        duration: 4000});
    });

    socket.on('disconnect', (reason) => {
      console.log('%c🔌 WebSocket DISCONNECTED', 'color: orange; font-weight: bold; font-size: 14px');
      console.log('📋 Reason:', reason);
      console.log('⏰ Disconnected at:', new Date().toLocaleTimeString());
      setWsConnected(false);
      setWsSocketId('');
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect manually
        console.log('🔄 Server initiated disconnect, reconnecting...');
        socket.connect();
      }
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('%c🔄 WebSocket RECONNECTED', 'color: blue; font-weight: bold; font-size: 14px');
      console.log('📊 Attempt number:', attemptNumber);
      console.log('⏰ Reconnected at:', new Date().toLocaleTimeString());
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt #${attemptNumber}...`);
    });

    socket.on('reconnect_error', (error) => {
      console.log('%c❌ Reconnection Error', 'color: red; font-size: 12px');
      console.error('Error:', error.message);
    });

    socket.on('reconnect_failed', () => {
      console.log('%c❌ Reconnection FAILED', 'color: red; font-weight: bold');
      console.log('⚠️ Max reconnection attempts reached');
      toast.error('WebSocket connection lost. Please refresh the page.', {
        duration: 6000});
    });
    
    // Listen for new order events
    socket.on('newOrderPlaced', (data) => {
      console.log('%c🎉 NEW ORDER EVENT RECEIVED!', 'color: green; font-weight: bold; font-size: 16px; background: #e6ffe6; padding: 5px');
      console.log('📦 Order Number:', data.orderNumber);
      console.log('💰 Amount:', data.orderData?.amount);
      console.log('💳 Payment Method:', data.orderData?.paymentMethod);
      console.log('📍 Location:', data.orderData?.deliveryLocation);
      console.log('🏨 Hostel:', data.orderData?.hostelName);
      console.log('⏰ Received at:', new Date().toLocaleTimeString());
      console.log('📋 Full Data:', data);
      
      setShowNewOrderBanner(true);
      setNewOrderCount(prev => prev + 1);
      
      // Show toast notification
      toast.success(`New order #${data.orderNumber} received!`, {
        duration: 4000,
        icon: '🎉'});
    });

    // Listen for order status updates
    socket.on('orderStatusUpdated', (data) => {
      console.log('%c📦 ORDER STATUS UPDATED!', 'color: blue; font-weight: bold; font-size: 16px; background: #e6f3ff; padding: 5px');
      console.log('📦 Order ID:', data.orderId);
      console.log('📝 New Status:', data.status);
      console.log('⏰ Updated at:', new Date().toLocaleTimeString());
      console.log('📋 Full Data:', data);
      
      // Update the orders list with the new status
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === data.orderId 
            ? { ...order, orderStatus: data.status, cartItems: data.items || order.cartItems }
            : order
        )
      );
      
      // Update selected order if it's open
      if (selectedOrder && selectedOrder._id === data.orderId) {
        setSelectedOrder(prev => ({
          ...prev,
          orderStatus: data.status,
          cartItems: data.items || prev.cartItems
        }));
      }
      
      // Show toast notification
      toast.success(`Order status updated to ${data.status}`, {
        duration: 3000,
        icon: '✅'});
    });

    // Test event listener (for debugging)
    socket.onAny((eventName, ...args) => {
      console.log(`📡 Event received: ${eventName}`, args);
    });

    // Cleanup on unmount
    return () => {
      console.log('%c🔌 Cleaning up WebSocket connection', 'color: gray; font-size: 12px');
      clearInterval(heartbeatInterval);
      socket.offAny();
      socket.off('newOrderPlaced');
      socket.off('orderStatusUpdated');
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.off('reconnect');
      socket.off('reconnect_attempt');
      socket.off('reconnect_error');
      socket.off('reconnect_failed');
      socket.disconnect();
    };
  }, []);

  // Mark item(s) as delivered function
  const markAsDelivered = async (orderId, productName, categoryName, deliverAll = false) => {
    const deliveryKey = deliverAll ? `${orderId}-ALL_DISPATCHED` : `${orderId}-${productName}`;
    
    try {
      console.log('Marking as delivered:', { orderId, productName, categoryName, deliverAll });
      setDeliveryLoading(prev => ({ ...prev, [deliveryKey]: true }));
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Authentication required. Please log in.');
        return;
      }
      
      const apiBaseUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiBaseUrl}/admin/deliver-item`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId,
          productName: deliverAll ? undefined : productName,
          categoryName: deliverAll ? undefined : categoryName,
          deliverAll: deliverAll
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Delivery successful:', result);
      console.log('Result order items:', result.order?.items);
      
      // Show success state briefly
      setDeliverySuccess(prev => ({ ...prev, [deliveryKey]: true }));
      
      // Immediately update local state for instant UI feedback
      if (result.order) {
        console.log('Updating orders state with cartItems:', result.order.items);
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId 
              ? { ...order, orderStatus: result.order.orderStatus, cartItems: result.order.items }
              : order
          )
        );
        
        // Update selected order if it's open
        if (selectedOrder && selectedOrder._id === orderId) {
          console.log('Updating selectedOrder with cartItems:', result.order.items);
          setSelectedOrder(prev => ({
            ...prev,
            orderStatus: result.order.orderStatus,
            cartItems: result.order.items
          }));
        }
      }
      
      if (deliverAll) {
        toast.success(`Successfully marked all dispatched items as delivered`);
      } else {
        toast.success(`Successfully delivered ${productName}`);
      }
      
      // Clear success state after a brief moment
      setTimeout(() => {
        setDeliverySuccess(prev => ({ ...prev, [deliveryKey]: false }));
      }, 2000);
      
    } catch (error) {
      console.error('Error marking as delivered:', error);
      setDeliverySuccess(prev => ({ ...prev, [deliveryKey]: false }));
      
      if (error.message.includes('Failed to fetch')) {
        toast.error('Cannot connect to server. Please ensure the backend server is running.');
      } else {
        toast.error(error.message || 'Failed to mark as delivered');
      }
    } finally {
      setDeliveryLoading(prev => ({ ...prev, [deliveryKey]: false }));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `₹${amount?.toFixed(2)}`;
  };

  // Grouped Order Card Component
  const GroupedOrderCard = ({ 
    order, 
    onViewDetails, 
    getStatusColor, 
    getPaymentStatusColor, 
    formatDate, 
    formatCurrency,
    getItemImage,
    getVariantDisplay,
    placeholderImage
  }) => {
    const items = order.items || order.cartItems || [];
    const itemCount = items.length;

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{order.orderNumber}</h3>
              <p className="text-xs text-gray-600 mt-1">{formatDate(order.createdAt)}</p>
            </div>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
              {order.orderStatus.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-3">
          {/* Customer Info */}
          <div className="border-b border-gray-100 pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{order.userDetails?.name || 'N/A'}</p>
                <p className="text-xs text-gray-600">{order.userDetails?.phone || 'N/A'}</p>
                <p className="text-xs text-gray-500">{order.deliveryLocation}</p>
                {order.hostelName && (
                  <p className="text-xs text-blue-600 font-medium mt-1">
                    🏠 {order.hostelName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-700">Order Items ({itemCount})</span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {items.map((item, index) => {
                const variantLabel = getVariantDisplay(item);
                const imageSrc = getItemImage(item);
                const dispatchStatus = item.dispatchStatus || 'pending';
                
                return (
                  <div 
                    key={index} 
                    className={`flex items-center gap-2 p-2 rounded-lg border ${
                      dispatchStatus === 'delivered' ? 'bg-green-50 border-green-200' :
                      dispatchStatus === 'dispatched' ? 'bg-purple-50 border-purple-200' :
                      'bg-orange-50 border-orange-200'
                    }`}
                  >
                    <div className="w-12 h-12 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                      <img
                        src={imageSrc}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = placeholderImage;
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {item.productName}
                      </p>
                      {variantLabel && (
                        <p className="text-xs text-gray-600 truncate">{variantLabel}</p>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                          dispatchStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                          dispatchStatus === 'dispatched' ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {dispatchStatus === 'delivered' ? '✓' :
                           dispatchStatus === 'dispatched' ? '🚚' : '📦'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Info */}
          <div className="border-t border-gray-100 pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {order.paymentMethod === 'razorpay' ? (
                  <FaCreditCard className="text-blue-500 text-sm" />
                ) : (
                  <BsCashCoin className="text-green-500 text-sm" />
                )}
                <span className="text-xs text-gray-700">
                  {order.paymentMethod === 'razorpay' ? 'Online' : 'COD'}
                </span>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                {order.paymentStatus}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900">Total Amount:</span>
              <span className="text-sm font-bold text-blue-600">{formatCurrency(order.amount)}</span>
            </div>
          </div>

          {/* View Details Button */}
          <button
            onClick={() => onViewDetails(order)}
            className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <FaEye />
            View Full Details
          </button>
        </div>
      </div>
    );
  };

  // Helper function to group orders by orderNumber
  const groupOrdersByNumber = (ordersList) => {
    const grouped = {};
    ordersList.forEach(order => {
      const orderNum = order.orderNumber;
      if (!grouped[orderNum]) {
        grouped[orderNum] = { ...order, items: [] };
      }
      // If order has cartItems, add them to the items array
      if (order.cartItems && order.cartItems.length > 0) {
        grouped[orderNum].items = order.cartItems;
      }
    });
    return Object.values(grouped);
  };

  // Helper function to check if order is from today
  const isToday = (dateString) => {
    const today = new Date();
    const orderDate = new Date(dateString);
    return today.toDateString() === orderDate.toDateString();
  };

  // Separate orders into today's and remaining
  const categorizeOrders = () => {
    const grouped = groupOrdersByNumber(orders);
    const todaysOrders = grouped.filter(order => isToday(order.createdAt));
    const remainingOrders = grouped.filter(order => !isToday(order.createdAt));
    return { todaysOrders, remainingOrders };
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* New Order Notification Banner */}
      {showNewOrderBanner && (
        <div className="mb-4 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-4 rounded-lg shadow-md animate-slide-down">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-green-500 rounded-full p-2 animate-pulse">
                <FaBell className="text-white text-lg" />
              </div>
              <div>
                <p className="text-green-800 font-semibold text-lg">
                  New order{newOrderCount > 1 ? 's' : ''} issued!
                </p>
                <p className="text-green-700 text-sm">
                  {newOrderCount} new order{newOrderCount > 1 ? 's have' : ' has'} been placed. Click refresh to view.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  fetchOrders(currentPage, filters);
                  setShowNewOrderBanner(false);
                  setNewOrderCount(0);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <FaSyncAlt className="text-sm" />
                <span>Refresh Now</span>
              </button>
              <button
                onClick={() => {
                  setShowNewOrderBanner(false);
                  setNewOrderCount(0);
                }}
                className="text-green-600 hover:text-green-800 transition-colors p-2"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
          </div>
        </div>
      )}

  {/* Header (Responsive) */}
  <div className="pt-16 md:pt-4 flex flex-col gap-4 2xl:flex-row 2xl:justify-between 2xl:items-start mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 truncate">Order Management</h1>
            {/* WebSocket Connection Status Badge */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              wsConnected 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : 'bg-red-100 text-red-700 border border-red-300'
            }`}>
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="truncate max-w-[140px]">{wsConnected ? 'Live Updates Active' : 'Disconnected'}</span>
            </div>
          </div>
          <p className="text-gray-600 mt-1 min-w-0 truncate">
            Manage and track all customer orders
          </p>
        </div>
  <div className="flex flex-wrap gap-3 order-last 2xl:order-none">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-200 rounded-lg p-1 flex-shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                viewMode === 'table' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Table View"
            >
              <FaTable className="mr-2" />
              Table
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                viewMode === 'grouped' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Grouped View"
            >
              <FaThList className="mr-2" />
              Grouped
            </button>
          </div>
          <button
            onClick={() => fetchOrders(currentPage, filters)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
          >
            <FaSyncAlt className="mr-2" />
            Refresh
          </button>
          <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex-shrink-0">
            <FaDownload className="mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        {/* Quick Range Buttons */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Quick range</span>
          {[
            { label: 'Today', value: 'today' },
            { label: 'Last 7 days', value: 'week' },
            { label: 'This Month', value: 'month' }
          ].map(range => (
            <button
              key={range.value}
              onClick={() => handleQuickRange(range.value)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition ${
                filters.quickRange === range.value 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-blue-50'
              }`}
            >
              {range.label}
            </button>
          ))}
          <button
            onClick={() => handleQuickRange('')}
            className={`px-3 py-1.5 text-sm rounded-lg border transition ${
              !filters.quickRange 
                ? 'bg-gray-900 border-gray-900 text-white' 
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            All time
          </button>
        </div>

        <div className="space-y-3">
          {/* Prominent Order Search Bar */}

          {/* Status Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <select
              value={filters.paymentStatus}
              onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
              className="px-3 py-2 border rounded-lg w-full"
            >
              <option value="">All Payment Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <select
              value={filters.paymentMethod}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
              className="px-3 py-2 border rounded-lg w-full"
            >
              <option value="">All Payment Methods</option>
              <option value="razorpay">Online Payment</option>
              <option value="cod">Cash on Delivery</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border rounded-lg w-full"
            >
              <option value="">All Order Status</option>
              <option value="placed">Placed</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchOrders(currentPage, filters)}
                className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                <FiRefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </button>
              <button 
                onClick={clearFilters}
                className="flex items-center px-3 py-2 border rounded-lg hover:bg-gray-50"
              >
                <FiFilter className="mr-2 h-4 w-4" />
                Clear
              </button>
            </div>
          </div>

          {/* Advanced Search Filters Section */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <FiSearch className="mr-2" />
              Advanced Filters
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-600 mb-1 flex items-center">
                    <HiOutlineOfficeBuilding className="mr-1" />
                    Hostel Name
                  </label>
                  <input
                    placeholder="Type hostel name..."
                    value={filters.hostel || ''}
                    onChange={(e) => handleFilterChange('hostel', e.target.value)}
                    className="px-3 py-2 border rounded-lg w-full bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 flex items-center">
                    <FiMail className="mr-1" />
                    Email Address
                  </label>
                  <input
                    placeholder="Type email..."
                    value={filters.email || ''}
                    onChange={(e) => handleFilterChange('email', e.target.value)}
                    className="px-3 py-2 border rounded-lg w-full bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 flex items-center">
                    <FiPhone className="mr-1" />
                    Phone Number
                  </label>
                  <input
                    placeholder="Type phone..."
                    value={filters.phone || ''}
                    onChange={(e) => handleFilterChange('phone', e.target.value)}
                    className="px-3 py-2 border rounded-lg w-full bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table View (Desktop 2xl+) & Card Grid (Below 2xl) */}
      {viewMode === 'table' && (
        <div className="rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3">Loading orders...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center p-8">
              <div className="text-gray-400 mb-4">
                <FaMoneyBillWave size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500">No orders match your current filters.</p>
          </div>
        ) : (
          <>
            {/* Card Grid for <2xl screens */}
            <div className="block 2xl:hidden bg-white p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {groupOrdersByNumber(orders).map(order => (
                  <GroupedOrderCard 
                    key={order._id}
                    order={order}
                    onViewDetails={viewOrderDetails}
                    getStatusColor={getStatusColor}
                    getPaymentStatusColor={getPaymentStatusColor}
                    formatDate={formatDate}
                    formatCurrency={formatCurrency}
                    getItemImage={getItemImage}
                    getVariantDisplay={getVariantDisplay}
                    placeholderImage={placeholderImage}
                  />
                ))}
              </div>
            </div>
            {/* Original Table for >=2xl */}
            <div className="hidden 2xl:block overflow-x-auto bg-white">
              <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.orderNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {order.deliveryLocation}
                        </div>
                        {order.hostelName && (
                          <div className="text-xs text-blue-600 font-medium">
                            🏠 {order.hostelName}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.userDetails?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.userDetails?.phone || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {order.userDetails?.email || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs space-y-1">
                        {order.cartItems && order.cartItems.length > 0 ? (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-orange-600">📦 Pending: {order.cartItems.filter(item => !item.dispatchStatus || item.dispatchStatus === 'pending').length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-purple-600">🚚 Dispatched: {order.cartItems.filter(item => item.dispatchStatus === 'dispatched').length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-green-600">✅ Delivered: {order.cartItems.filter(item => item.dispatchStatus === 'delivered').length}</span>
                            </div>
                            <div className="text-gray-500">
                              Total: {order.cartItems.length} items
                            </div>
                           
                          </>
                        ) : (
                          <span className="text-gray-400">No items</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {order.paymentMethod === 'razorpay' ? (
                          <FaCreditCard className="mr-2 text-blue-500" />
                        ) : (
                          <BsCashCoin className="mr-2 text-green-500" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.paymentMethod === 'razorpay' ? 'Online' : 'COD'}
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                            {order.paymentStatus}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(order.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end items-center space-x-1">
                        {/* View Details */}
                        <button
                          onClick={() => viewOrderDetails(order)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-b-lg">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => fetchOrders(Math.max(1, currentPage - 1), filters)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => fetchOrders(Math.min(totalPages, currentPage + 1), filters)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => fetchOrders(Math.max(1, currentPage - 1), filters)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchOrders(Math.min(totalPages, currentPage + 1), filters)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Grouped Orders View */}
      {viewMode === 'grouped' && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center items-center p-8 bg-white rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3">Loading orders...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center p-8 bg-white rounded-lg">
              <div className="text-gray-400 mb-4">
                <FaMoneyBillWave size={48} className="mx-auto" />
              </div>
              <p className="text-gray-600">No orders found</p>
              <p className="text-sm text-gray-500">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              {(() => {
                const { todaysOrders, remainingOrders } = categorizeOrders();
                return (
                  <>
                    {/* Today's Orders Section */}
                    {todaysOrders.length > 0 && (
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                              Today's Orders ({todaysOrders.length})
                            </span>
                          </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {todaysOrders.map((order) => (
                            <GroupedOrderCard 
                              key={order._id}
                              order={order}
                              onViewDetails={viewOrderDetails}
                              getStatusColor={getStatusColor}
                              getPaymentStatusColor={getPaymentStatusColor}
                              formatDate={formatDate}
                              formatCurrency={formatCurrency}
                              getItemImage={getItemImage}
                              getVariantDisplay={getVariantDisplay}
                              placeholderImage={placeholderImage}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Remaining Orders Section */}
                    {remainingOrders.length > 0 && (
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                              Remaining Orders ({remainingOrders.length})
                            </span>
                          </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {remainingOrders.map((order) => (
                            <GroupedOrderCard 
                              key={order._id}
                              order={order}
                              onViewDetails={viewOrderDetails}
                              getStatusColor={getStatusColor}
                              getPaymentStatusColor={getPaymentStatusColor}
                              formatDate={formatDate}
                              formatCurrency={formatCurrency}
                              getItemImage={getItemImage}
                              getVariantDisplay={getVariantDisplay}
                              placeholderImage={placeholderImage}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {todaysOrders.length === 0 && remainingOrders.length === 0 && (
                      <div className="text-center p-8 bg-white rounded-lg">
                        <div className="text-gray-400 mb-4">
                          <FaMoneyBillWave size={48} className="mx-auto" />
                        </div>
                        <p className="text-gray-600">No orders found</p>
                        <p className="text-sm text-gray-500">Try adjusting your filters</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* Order Detail Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 z-[1000]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowOrderModal(false)}
          />
          {/* Positioned modal container with left gap for side panel */}
          <div className="absolute inset-0 flex flex-col md:items-start md:justify-start pt-6 md:pt-12 overflow-y-auto lg:pl-56 xl:pl-64 lg:pr-6">
            <div className="relative bg-white rounded-xl shadow-2xl w-full md:w-[92%] lg:w-[85%] xl:w-[70%] mx-auto max-h-[calc(100vh-4rem)] flex flex-col border border-gray-200">
              {/* Close button always visible */}
              <button
                onClick={() => setShowOrderModal(false)}
                className="absolute top-3 right-3 p-2 rounded-full bg-white shadow hover:bg-gray-100 transition-colors z-10"
                aria-label="Close order details"
              >
                <FaTimes className="text-gray-600" />
              </button>
            
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur z-10">
              <div className="flex items-center space-x-3">
                <FaThList className="text-xl text-blue-600" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Order Details - #{selectedOrder.orderNumber}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-6">
                
                {/* Status and Quick Info Row */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                  
                  {/* Order Status */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Order Status</h4>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedOrder.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                      selectedOrder.orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                      selectedOrder.orderStatus === 'out_for_delivery' ? 'bg-purple-100 text-purple-800' :
                      selectedOrder.orderStatus === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedOrder.orderStatus?.toUpperCase()}
                    </span>
                  </div>

                  {/* Payment Status */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Payment Status</h4>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedOrder.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                      selectedOrder.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      <FaCreditCard className="mr-1" />
                      {selectedOrder.paymentStatus?.toUpperCase()}
                    </span>
                  </div>

                  {/* Payment Method */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Payment Method</h4>
                    <span className="flex items-center text-sm font-medium text-gray-900">
                      {selectedOrder.paymentMethod === 'cod' ? (
                        <><BsCashCoin className="mr-2" />Cash on Delivery</>
                      ) : (
                        <><FaCreditCard className="mr-2" />Online Payment</>
                      )}
                    </span>
                  </div>

                  {/* Total Amount */}
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Total Amount</h4>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(selectedOrder.amount)}
                    </span>
                  </div>
                </div>

                {/* Main Information Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  
                  {/* Customer Information */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <FiMail className="mr-2 text-blue-600" />
                      Customer Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Name:</span>
                        <span className="text-gray-900">{selectedOrder.userDetails?.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Email:</span>
                        <span className="text-gray-900">{selectedOrder.userDetails?.email || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Phone:</span>
                        <span className="text-gray-900">{selectedOrder.userDetails?.phone || 'N/A'}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex items-start justify-between">
                          <span className="font-medium text-gray-700">Location:</span>
                          <div className="text-right">
                            <p className="text-gray-900">{selectedOrder.deliveryLocation}</p>
                            {selectedOrder.hostelName && (
                              <div className="flex items-center mt-1">
                                <HiOutlineOfficeBuilding className="text-gray-500 mr-1 text-sm" />
                                <span className="text-sm text-gray-600">{selectedOrder.hostelName}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <FiCreditCard className="mr-2 text-green-600" />
                      Payment Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Method:</span>
                        <span className="text-gray-900">
                          {selectedOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Status:</span>
                        <span className={`font-medium ${
                          selectedOrder.paymentStatus === 'paid' ? 'text-green-600' :
                          selectedOrder.paymentStatus === 'failed' ? 'text-red-600' :
                          'text-yellow-600'
                        }`}>
                          {selectedOrder.paymentStatus?.toUpperCase()}
                        </span>
                      </div>
                      {selectedOrder.razorpayOrderId && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Razorpay Order ID:</span>
                          <span className="text-sm text-gray-600 font-mono">{selectedOrder.razorpayOrderId}</span>
                        </div>
                      )}
                      {selectedOrder.razorpayPaymentId && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Payment ID:</span>
                          <span className="text-sm text-gray-600 font-mono">{selectedOrder.razorpayPaymentId}</span>
                        </div>
                      )}
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Amount:</span>
                          <span className="text-lg font-bold text-gray-900">{formatCurrency(selectedOrder.amount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                      <FaThList className="mr-2 text-purple-600" />
                      Order Items ({selectedOrder.cartItems?.length || 0})
                    </h4>
                    {/* Bulk Deliver All Button */}
                    {selectedOrder.cartItems?.filter(item => item.dispatchStatus === 'dispatched').length > 0 && (
                      <button
                        onClick={() => markAsDelivered(selectedOrder._id, null, null, 'ALL_DISPATCHED')}
                        disabled={deliveryLoading[`${selectedOrder._id}-ALL_DISPATCHED`]}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                      >
                        {deliveryLoading[`${selectedOrder._id}-ALL_DISPATCHED`] ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          <FaCheck />
                        )}
                        Deliver All Dispatched
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {selectedOrder.cartItems?.map((item, index) => {
                      const dispatchStatus = item.dispatchStatus || 'pending';
                      const deliveryKey = `${selectedOrder._id}-${item.productName}`;
                      const isDelivering = deliveryLoading[deliveryKey];
                      const isDelivered = deliverySuccess[deliveryKey];
                      const variantLabel = getVariantDisplay(item);
                      const imageSrc = getItemImage(item);

                      return (
                        <div key={index} className={`bg-white rounded-lg p-4 border-2 transition-all ${
                          dispatchStatus === 'delivered' ? 'border-green-200 shadow-green-100' :
                          dispatchStatus === 'dispatched' ? 'border-purple-200 shadow-purple-100' :
                          'border-orange-200 shadow-orange-100'
                        } shadow-md`}>
                          <div className="flex items-center gap-4">
                            
                            {/* Product Image */}
                            <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                              <img
                                src={imageSrc}
                                alt={item.productName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = placeholderImage;
                                }}
                              />
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                  dispatchStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                                  dispatchStatus === 'dispatched' ? 'bg-purple-100 text-purple-800' :
                                  'bg-orange-100 text-orange-800'
                                }`}>
                                  {dispatchStatus === 'delivered' ? '✅ DELIVERED' :
                                   dispatchStatus === 'dispatched' ? '🚀 DISPATCHED' :
                                   '📦 PENDING'}
                                </span>
                                <div className="font-semibold text-gray-900 truncate">{item.productName}</div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-gray-600">Quantity: </span>
                                  <span className="text-gray-900">{item.quantity}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Unit Price: </span>
                                  <span className="text-gray-900">{formatCurrency(item.price)}</span>
                                </div>
                              </div>

                              {variantLabel && (
                                <div className="text-sm text-gray-600 mt-1">
                                  <span className="font-medium">Variant: </span>{variantLabel}
                                </div>
                              )}

                              {/* Timestamps */}
                              <div className="flex flex-wrap gap-4 mt-2 text-xs">
                                {item.dispatchedAt && (
                                  <div className="text-purple-600">
                                    <span className="font-medium">Dispatched: </span>
                                    {new Date(item.dispatchedAt).toLocaleString('en-IN', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                )}
                                {item.deliveredAt && (
                                  <div className="text-green-600">
                                    <span className="font-medium">Delivered: </span>
                                    {new Date(item.deliveredAt).toLocaleString('en-IN', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Actions and Total */}
                            <div className="flex flex-col items-end gap-3">
                              <div className="text-lg font-bold text-gray-900">
                                {formatCurrency(item.price * item.quantity)}
                              </div>

                              {dispatchStatus === 'dispatched' && (
                                <button
                                  onClick={() => markAsDelivered(selectedOrder._id, item.productName, item.categoryName)}
                                  disabled={isDelivering || isDelivered}
                                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                                    isDelivered
                                      ? 'bg-emerald-500 text-white cursor-default'
                                      : 'bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 hover:shadow-md'
                                  }`}
                                >
                                  {isDelivering ? (
                                    <FaSpinner className="animate-spin" />
                                  ) : isDelivered ? (
                                    <>
                                      <FaCheck />
                                      <span>Delivered!</span>
                                    </>
                                  ) : (
                                    <>
                                      <FaCheck />
                                      <span>Mark Delivered</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FaMoneyBillWave className="mr-2 text-orange-600" />
                    Order Summary
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Price Breakdown */}
                    <div className="space-y-3">
                      <h5 className="font-medium text-gray-700 mb-3">Price Breakdown</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cart Total:</span>
                          <span className="font-medium">{formatCurrency(selectedOrder.orderSummary?.cartTotal || 0)}</span>
                        </div>
                        {selectedOrder.orderSummary?.discountedTotal !== selectedOrder.orderSummary?.cartTotal && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Discounted Total:</span>
                            <span className="font-medium">{formatCurrency(selectedOrder.orderSummary?.discountedTotal || 0)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Delivery Charge:</span>
                          <span className="font-medium">{formatCurrency(selectedOrder.orderSummary?.deliveryCharge || 0)}</span>
                        </div>
                        {selectedOrder.orderSummary?.couponDiscount > 0 && (
                          <div className="flex justify-between text-red-600">
                            <span>Coupon Discount:</span>
                            <span className="font-medium">-{formatCurrency(selectedOrder.orderSummary?.couponDiscount)}</span>
                          </div>
                        )}
                        <div className="border-t border-gray-300 pt-2 mt-3">
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-900">Grand Total:</span>
                            <span className="font-bold text-lg text-gray-900">{formatCurrency(selectedOrder.amount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Timeline */}
                    <div>
                      <h5 className="font-medium text-gray-700 mb-3">Order Timeline</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Order Placed:</span>
                          <span className="font-medium">
                            {new Date(selectedOrder.createdAt).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        {selectedOrder.estimatedDeliveryTime && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Estimated Delivery:</span>
                            <span className="font-medium">
                              {new Date(selectedOrder.estimatedDeliveryTime).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        )}
                        {selectedOrder.actualDeliveryTime && (
                          <div className="flex justify-between text-green-600">
                            <span>Delivered At:</span>
                            <span className="font-medium">
                              {new Date(selectedOrder.actualDeliveryTime).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        )}
                        {selectedOrder.notes && (
                          <div className="pt-2 border-t border-gray-200">
                            <span className="text-gray-600">Notes:</span>
                            <p className="text-gray-800 mt-1">{selectedOrder.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      <style>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AdminOrders;