import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTruck, 
  FaEdit,
  FaMapMarkerAlt,
  FaSpinner,
  FaShoppingBag,
  FaBox,
  FaBoxOpen,
  FaChevronDown,
  FaChevronRight,
  FaSync
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { resolveOrderItemVariantLabel } from '../../utils/variantUtils';

// CSS for line clamp
const styles = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

// Add styles to head if not already present
if (typeof document !== 'undefined' && !document.getElementById('admin-order-tracking-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'admin-order-tracking-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

// Individual Order Card Component
const IndividualOrderCard = ({ order, onDispatchItem, dispatchLoading, dispatchSuccess }) => {

  // Calculate dispatch progress
  const totalItems = order.totalItems || 0;
  const dispatchedItems = order.dispatchedItems || 0;
  const deliveredItems = order.deliveredItems || 0;
  const pendingItems = order.pendingItems?.length || 0;
  
  // Get all items (pending + dispatched + delivered) for full order view
  const allOrderItems = [
    ...(order.pendingItems || []).map(item => ({ ...item, status: 'pending' })),
    ...(order.dispatchedItems_list || []).map(item => ({ ...item, status: 'dispatched' })),
    ...(order.deliveredItems_list || []).map(item => ({ ...item, status: 'delivered' }))
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* Order Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 break-words">
              Order #{order.orderNumber}
            </h3>
            <p className="text-sm text-gray-600 break-words">
              {order.userDetails?.name || 'Customer'} • {order.hostelName}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-lg font-bold text-gray-900">₹{order.amount}</p>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                order.orderStatus === 'out_for_delivery' ? 'bg-purple-100 text-purple-800' :
                order.orderStatus === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {order.orderStatus.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            
            {/* Dispatch Progress */}
            <div className="mt-2 space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                <span className="text-orange-600">📦 Pending: {pendingItems}</span>
                <span className="text-purple-600">🚚 Dispatched: {dispatchedItems}</span>
                <span className="text-green-600">✅ Delivered: {deliveredItems}</span>
              </div>
              <div className="text-xs text-gray-500">
                Progress: {deliveredItems + dispatchedItems}/{totalItems} processed
              </div>
            </div>
          </div>
        </div>
        
        {/* Bulk Actions - Remove delivery functionality */}
      </div>

      {/* All Order Items */}
      <div className="p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
          <FaBox className="text-blue-500" />
          Order Items ({totalItems})
        </h4>
        
        <div className="space-y-3">
          {/* Pending Items Only */}
          {(order.pendingItems || []).map((item, index) => {
            const dispatchKey = `${order._id}-${item.productName}`;
            const isDispatching = dispatchLoading[dispatchKey];
            const isSuccess = dispatchSuccess[dispatchKey];
            const variantLabel = resolveOrderItemVariantLabel(item);
            
            return (
              <div key={`pending-${index}`} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded whitespace-nowrap">PENDING</span>
                    <h5 className="font-medium text-gray-900 truncate">{item.productName}</h5>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mt-1">
                    <span className="whitespace-pre-wrap break-words">Category: {item.categoryName}</span>
                    {variantLabel && (
                      <span className="whitespace-pre-wrap break-words">Variant: {variantLabel}</span>
                    )}
                    <span>Qty: {item.quantity}</span>
                    <span>Price: ₹{item.price}</span>
                  </div>
                </div>
                
                <div className="sm:flex-shrink-0">
                  <button
                    onClick={() => onDispatchItem(order._id, item.productName, item.categoryName)}
                    disabled={isDispatching || isSuccess}
                    className={`w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2 ${
                      isSuccess 
                        ? 'bg-emerald-500 text-white cursor-default' 
                        : 'bg-green-600 hover:bg-green-700 text-white disabled:opacity-50'
                    }`}
                  >
                    {isDispatching ? (
                      <FaSpinner className="animate-spin" />
                    ) : isSuccess ? (
                      <>
                        <span>✓</span>
                        <span>Dispatched!</span>
                      </>
                    ) : (
                      <>
                        <FaTruck />
                        <span>Dispatch</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          {/* Show dispatched items but without delivery buttons - just for reference */}
          {(order.dispatchedItems_list || []).map((item, index) => {
            const variantLabel = resolveOrderItemVariantLabel(item);

            return (
              <div key={`dispatched-${index}`} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded whitespace-nowrap">DISPATCHED</span>
                    <h5 className="font-medium text-gray-900 truncate">{item.productName}</h5>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mt-1">
                    <span className="whitespace-pre-wrap break-words">Category: {item.categoryName}</span>
                    {variantLabel && (
                      <span className="whitespace-pre-wrap break-words">Variant: {variantLabel}</span>
                    )}
                    <span>Qty: {item.quantity}</span>
                    <span>Price: ₹{item.price}</span>
                    {item.dispatchedAt && (
                      <span className="whitespace-nowrap">Dispatched: {new Date(item.dispatchedAt).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    )}
                  </div>
                </div>

                <div className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium sm:flex-shrink-0">
                  🚚 Out for Delivery
                </div>
              </div>
            );
          })}

          {/* Show delivered items for reference */}
          {(order.deliveredItems_list || []).map((item, index) => {
            const variantLabel = resolveOrderItemVariantLabel(item);

            return (
              <div key={`delivered-${index}`} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded whitespace-nowrap">DELIVERED</span>
                    <h5 className="font-medium text-gray-900 truncate">{item.productName}</h5>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mt-1">
                    <span className="whitespace-pre-wrap break-words">Category: {item.categoryName}</span>
                    {variantLabel && (
                      <span className="whitespace-pre-wrap break-words">Variant: {variantLabel}</span>
                    )}
                    <span>Qty: {item.quantity}</span>
                    <span>Price: ₹{item.price}</span>
                    {item.deliveredAt && (
                      <span className="whitespace-nowrap">Delivered: {new Date(item.deliveredAt).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    )}
                  </div>
                </div>

                <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium sm:flex-shrink-0">
                  ✅ Completed
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Order Info */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Delivery Location:</span>
              <p className="font-medium">{order.deliveryLocation}</p>
            </div>
            <div>
              <span className="text-gray-500">Order Time:</span>
              <p className="font-medium">
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminOrderTracking = () => {
  // Initialize state with localStorage values for persistence
  const [orderData, setOrderData] = useState([]);
  const [individualOrders, setIndividualOrders] = useState([]);
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('adminOrderView') || 'grouped';
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedHostel, setSelectedHostel] = useState(() => {
    const saved = localStorage.getItem('selectedHostel');
    return saved ? JSON.parse(saved) : null;
  });
  const [expandedCategories, setExpandedCategories] = useState(() => {
    const saved = localStorage.getItem('expandedCategories');
    return saved ? JSON.parse(saved) : {};
  });
  const [dispatchLoading, setDispatchLoading] = useState({});
  const [dispatchSuccess, setDispatchSuccess] = useState({});
  const [customDispatchModal, setCustomDispatchModal] = useState({
    isOpen: false,
    hostel: '',
    category: '',
    productName: '',
    maxCount: 0,
    customCount: 1
  });
  
  // Dropdown state management for order sections
  const [todaysOrdersExpanded, setTodaysOrdersExpanded] = useState(() => {
    const saved = localStorage.getItem('todaysOrdersExpanded');
    return saved !== null ? JSON.parse(saved) : true; // Default to expanded
  });
  const [previousOrdersExpanded, setPreviousOrdersExpanded] = useState(() => {
    const saved = localStorage.getItem('previousOrdersExpanded');
    return saved !== null ? JSON.parse(saved) : false; // Default to collapsed
  });

  // Fetch order data (both grouped and individual)
  const fetchOrderData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Authentication required. Please log in.');
        return;
      }
      
      // Use VITE_VERCEL_API_URL for admin operations to ensure emails are sent from production backend
      const apiBaseUrl = import.meta.env.VITE_VERCEL_API_URL || import.meta.env.VITE_API_URL;

      // Fetch both grouped and individual data
      const [groupedResponse, individualResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/admin/orders/grouped`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${apiBaseUrl}/admin/orders/individual`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      console.log('Fetching order data - isRefresh:', isRefresh);
      
      // Process grouped response
      if (!groupedResponse.ok) {
        throw new Error(`Failed to fetch grouped orders: ${groupedResponse.statusText}`);
      }
      const groupedData = await groupedResponse.json();
      console.log('Grouped order data received:', groupedData);
      setOrderData(Array.isArray(groupedData) ? groupedData : []);

      // Process individual response
      if (!individualResponse.ok) {
        throw new Error(`Failed to fetch individual orders: ${individualResponse.statusText}`);
      }
      const individualData = await individualResponse.json();
      console.log('Individual order data received:', individualData);
      setIndividualOrders(Array.isArray(individualData) ? individualData : []);
      
      if (isRefresh) {
        if (groupedData.length === 0) {
          toast.success('No orders with placed status at the moment');
        } else {
          const filteredData = filterOrdersByStatus(groupedData);
          toast.success(`Refreshed! Loaded 'placed' orders from ${filteredData.length} hostels`);
        }
      } else {
        if (groupedData.length === 0) {
          toast.success('No orders with placed status at the moment');
        } else {
          const filteredData = filterOrdersByStatus(groupedData);
          toast.success(`Loaded 'placed' orders from ${filteredData.length} hostels`);
        }
      }
      
    } catch (error) {
      console.error('Error fetching order data:', error);
      
      if (error.message.includes('Failed to fetch')) {
        toast.error('Cannot connect to server. Please ensure the backend server is running on port 3000.');
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        toast.error('Authentication failed. Please log in again.');
        localStorage.removeItem('authToken');
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        toast.error('Access denied. Admin privileges required.');
      } else {
        toast.error(`Failed to load order data: ${error.message}`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh data function
  const handleRefresh = () => {
    console.log('Refresh button clicked - calling fetchOrderData with isRefresh=true');
    fetchOrderData(true);
  };

  // Filter orders - simplified since backend only returns 'placed' orders
  const filterOrdersByStatus = (orderData) => {
    if (!orderData || !Array.isArray(orderData)) return [];
    return orderData.map(hostelGroup => {
      const filteredCategories = hostelGroup.categories.map(categoryGroup => {
        const filteredProducts = categoryGroup.products.filter(product => product.orderCount > 0);
        if (filteredProducts.length === 0) return null;

        return {
          ...categoryGroup,
          products: filteredProducts,
          totalOrders: filteredProducts.reduce((sum, product) => sum + product.orderCount, 0)
        };
      }).filter(Boolean);

      if (filteredCategories.length === 0) return null;

      return {
        ...hostelGroup,
        categories: filteredCategories,
        totalOrders: filteredCategories.reduce((sum, category) => sum + category.totalOrders, 0)
      };
    }).filter(Boolean);
  };

  // Helper function to check if order is from today
  const isOrderFromToday = (orderDate) => {
    const today = new Date();
    const orderCreated = new Date(orderDate);
    
    return today.getDate() === orderCreated.getDate() &&
           today.getMonth() === orderCreated.getMonth() &&
           today.getFullYear() === orderCreated.getFullYear();
  };

  // Filter orders by date - separating today's orders from remaining orders
  const filterOrdersByDate = (orders) => {
    if (!orders || !Array.isArray(orders)) return { todaysOrders: [], remainingOrders: [] };
    
    // First sort all orders by createdAt date in descending order (newest first)
    const sortedOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const todaysOrders = sortedOrders.filter(order => isOrderFromToday(order.createdAt));
    const remainingOrders = sortedOrders.filter(order => !isOrderFromToday(order.createdAt));
    
    return { todaysOrders, remainingOrders };
  };

  useEffect(() => {
    fetchOrderData();
  }, []);

  // Persist viewMode to localStorage
  useEffect(() => {
    localStorage.setItem('adminOrderView', viewMode);
  }, [viewMode]);

  // Persist selectedHostel to localStorage
  useEffect(() => {
    if (selectedHostel) {
      localStorage.setItem('selectedHostel', JSON.stringify(selectedHostel));
    } else {
      localStorage.removeItem('selectedHostel');
    }
  }, [selectedHostel]);

  // Persist expandedCategories to localStorage
  useEffect(() => {
    localStorage.setItem('expandedCategories', JSON.stringify(expandedCategories));
  }, [expandedCategories]);

  // Persist dropdown states to localStorage
  useEffect(() => {
    localStorage.setItem('todaysOrdersExpanded', JSON.stringify(todaysOrdersExpanded));
  }, [todaysOrdersExpanded]);

  useEffect(() => {
    localStorage.setItem('previousOrdersExpanded', JSON.stringify(previousOrdersExpanded));
  }, [previousOrdersExpanded]);

  // Restore selectedHostel from saved data when orderData changes
  useEffect(() => {
    if (orderData.length > 0 && selectedHostel) {
      // Find the updated version of the selected hostel in the new data
      const updatedHostel = orderData.find(hostel => hostel.hostel === selectedHostel.hostel);
      if (updatedHostel) {
        setSelectedHostel(updatedHostel);
      } else {
        // If the hostel no longer exists (all orders dispatched), clear selection
        setSelectedHostel(null);
      }
    }
  }, [orderData]);



  // Select hostel function
  const selectHostel = (hostelGroup) => {
    setSelectedHostel(hostelGroup);
    setExpandedCategories({}); // Reset expanded categories when switching hostels
  };

  // Toggle category expansion
  const toggleCategory = (categoryName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };
  console.log();
  // Product Card Component
  const ProductCard = ({ product, hostel, category }) => {
    const dispatchKey = `${hostel}-${category}-${product.productName}`;
    const isDispatching = dispatchLoading[dispatchKey];
    const isSuccess = dispatchSuccess[dispatchKey];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 overflow-hidden group"
      >
        {/* Product Image */}
        <div className="relative h-32 bg-gradient-to-br from-gray-100 to-gray-200">
          {product.productImage ? (
            <img
              src={product.productImage}
              alt={product.productName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className={`absolute inset-0 flex items-center justify-center ${product.productImage ? 'hidden' : 'flex'}`}>
            <FaBox className="text-4xl text-gray-400" />
          </div>
          
          {/* Order Count Badge */}
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold shadow-lg">
            {product.orderCount}
          </div>
        </div>

        {/* Product Info */}
        <div className="p-3">
          <h4 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2 min-h-[2.5rem]">
            {product.productName}
          </h4>
          
          <div className="flex items-center gap-1 mb-3 text-xs text-gray-600">
            <FaShoppingBag className="text-blue-500" />
            <span>Qty: {product.totalQuantity || product.orderCount}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1">
            <button
              onClick={() => navigateToProductOrders(product.productName, hostel, category)}
              disabled={isDispatching}
              className="flex-1 px-2 py-1.5 text-white rounded text-xs transition-colors duration-200 flex items-center justify-center gap-1 font-medium bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDispatching ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaTruck className="text-xs" />
              )}
              <span>Dispatch Orders</span>
            </button>
            
            <button
              onClick={() => openCustomDispatchModal(hostel, category, product.productName, product.orderCount)}
              disabled={isDispatching || isSuccess}
              className="px-2 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
            >
              <FaEdit />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  // Hostel Button Component
  const HostelButton = ({ hostelGroup, isSelected }) => {
    return (
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onClick={() => selectHostel(hostelGroup)}
        className={`w-full p-4 rounded-lg border-2 transition-all duration-300 text-left ${
          isSelected 
            ? 'border-rose-500 bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg' 
            : 'border-gray-200 bg-white text-gray-900 hover:border-rose-300 hover:shadow-md'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isSelected ? 'bg-white bg-opacity-20' : 'bg-rose-100'
            }`}>
              <FaMapMarkerAlt className={`text-lg ${isSelected ? 'text-white' : 'text-rose-600'}`} />
            </div>
            <div>
              <h3 className="text-lg font-bold">{hostelGroup.hostel}</h3>
              <p className={`text-sm ${isSelected ? 'text-rose-100' : 'text-gray-600'}`}>
                📍 {hostelGroup.deliveryLocation || 'Unknown Location'}
              </p>
              <p className={`text-xs ${isSelected ? 'text-rose-200' : 'text-gray-500'}`}>
                {hostelGroup.totalOrders} pending orders
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              isSelected 
                ? 'bg-white bg-opacity-20 text-white' 
                : 'bg-rose-100 text-rose-800'
            }`}>
              {hostelGroup.categories.length} categories
            </span>
          </div>
        </div>
      </motion.button>
    );
  };

  // Categories and Products Display Component
  const HostelDetails = ({ hostelGroup }) => {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-lg shadow-lg border border-gray-200 p-6"
      >
        {/* Selected Hostel Header */}
        <div className="mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center">
              <FaMapMarkerAlt className="text-2xl text-rose-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{hostelGroup.hostel}</h2>
              <p className="text-gray-600 flex items-center gap-1">
                📍 {hostelGroup.deliveryLocation || 'Unknown Location'}
              </p>
              <p className="text-sm text-gray-500">
                {hostelGroup.totalOrders} pending orders across {hostelGroup.categories.length} categories
              </p>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-4">
          {hostelGroup.categories.map((categoryGroup) => (
            <div key={categoryGroup.category} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Category Header - Clickable */}
              <div
                className="bg-blue-50 p-4 cursor-pointer hover:bg-blue-100 transition-colors duration-200 border-b border-gray-200"
                onClick={() => toggleCategory(categoryGroup.category)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaBox className="text-blue-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {categoryGroup.category}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {categoryGroup.totalOrders} orders • {categoryGroup.products.length} products
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {categoryGroup.totalOrders} orders
                    </span>
                    {expandedCategories[categoryGroup.category] ? 
                      <FaChevronDown className="text-blue-600" /> : 
                      <FaChevronRight className="text-blue-600" />
                    }
                  </div>
                </div>
              </div>

              {/* Products Grid - Expandable */}
              <AnimatePresence>
                {expandedCategories[categoryGroup.category] && (
                  <motion.div
                    variants={expandVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {categoryGroup.products.map((product) => (
                          <ProductCard
                            key={product.productName}
                            product={product}
                            hostel={hostelGroup.hostel}
                            category={categoryGroup.category}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  // Animation variants
  const expandVariants = {
    hidden: { height: 0, opacity: 0 },
    visible: {
      height: 'auto',
      opacity: 1,
      transition: {
        height: { duration: 0.3 },
        opacity: { duration: 0.2, delay: 0.1 }
      }
    },
    exit: {
      height: 0,
      opacity: 0,
      transition: {
        height: { duration: 0.3 },
        opacity: { duration: 0.2 }
      }
    }
  };

  // Bulk dispatch functions
  const dispatchTodaysOrders = async () => {
    const { todaysOrders } = filterOrdersByDate(individualOrders);
    
    if (todaysOrders.length === 0) {
      toast.error('No orders to dispatch from today');
      return;
    }

    try {
      setDispatchLoading(prev => ({ ...prev, todaysOrders: true }));
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Authentication required. Please log in.');
        return;
      }

      let successCount = 0;
      let failCount = 0;

      // Dispatch all pending items from today's orders
      for (const order of todaysOrders) {
        for (const item of order.pendingItems || []) {
          try {
            // Use VITE_VERCEL_API_URL for dispatch operations to ensure emails are sent from production backend
            const apiBaseUrl = import.meta.env.VITE_VERCEL_API_URL || import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiBaseUrl}/admin/dispatch-item`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                orderId: order._id,
                productName: item.productName,
                categoryName: item.categoryName
              })
            });

            if (response.ok) {
              successCount++;
            } else {
              failCount++;
              console.error(`Failed to dispatch ${item.productName} from order ${order._id}`);
            }
          } catch (error) {
            failCount++;
            console.error(`Error dispatching ${item.productName}:`, error);
          }
        }
      }

      // Refresh data
      await fetchOrderData(false);
      
      if (failCount === 0) {
        toast.success(`Successfully dispatched all ${successCount} items from today's orders!`);
      } else {
        toast.success(`Dispatched ${successCount} items. ${failCount} items failed to dispatch.`);
      }

    } catch (error) {
      console.error('Error in bulk dispatch:', error);
      toast.error('Failed to dispatch today\'s orders');
    } finally {
      setDispatchLoading(prev => ({ ...prev, todaysOrders: false }));
    }
  };

  const dispatchAllOrders = async () => {
    if (individualOrders.length === 0) {
      toast.error('No orders to dispatch');
      return;
    }

    try {
      setDispatchLoading(prev => ({ ...prev, allOrders: true }));
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Authentication required. Please log in.');
        return;
      }

      let successCount = 0;
      let failCount = 0;

      // Dispatch all pending items from all orders
      for (const order of individualOrders) {
        for (const item of order.pendingItems || []) {
          try {
            // Use VITE_VERCEL_API_URL for dispatch operations to ensure emails are sent from production backend
            const apiBaseUrl = import.meta.env.VITE_VERCEL_API_URL || import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiBaseUrl}/admin/dispatch-item`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                orderId: order._id,
                productName: item.productName,
                categoryName: item.categoryName
              })
            });

            if (response.ok) {
              successCount++;
            } else {
              failCount++;
              console.error(`Failed to dispatch ${item.productName} from order ${order._id}`);
            }
          } catch (error) {
            failCount++;
            console.error(`Error dispatching ${item.productName}:`, error);
          }
        }
      }

      // Refresh data
      await fetchOrderData(false);
      
      if (failCount === 0) {
        toast.success(`Successfully dispatched all ${successCount} items from all orders!`);
      } else {
        toast.success(`Dispatched ${successCount} items. ${failCount} items failed to dispatch.`);
      }

    } catch (error) {
      console.error('Error in bulk dispatch:', error);
      toast.error('Failed to dispatch all orders');
    } finally {
      setDispatchLoading(prev => ({ ...prev, allOrders: false }));
    }
  };

  // Dispatch individual item from specific order
  const dispatchIndividualItem = async (orderId, productName, categoryName) => {
    const dispatchKey = `${orderId}-${productName}`;
    
    try {
      console.log('Dispatching item:', { orderId, productName, categoryName });
      setDispatchLoading(prev => ({ ...prev, [dispatchKey]: true }));
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Authentication required. Please log in.');
        return;
      }
      
      // Use VITE_VERCEL_API_URL for dispatch operations to ensure emails are sent from production backend
      const apiBaseUrl = import.meta.env.VITE_VERCEL_API_URL || import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiBaseUrl}/admin/dispatch-item`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId,
          productName,
          categoryName
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Dispatch successful:', result);
      
      // Show success state briefly
      setDispatchSuccess(prev => ({ ...prev, [dispatchKey]: true }));
      
      // Immediately refresh ALL data after dispatch to ensure consistency
      console.log('Refreshing all order data after item dispatch...');
      await fetchOrderData(false); // Re-fetch both grouped and individual data
      
      // If we have a selected hostel, it will be automatically updated by the useEffect hook
      if (selectedHostel) {
        console.log('Selected hostel will be updated with fresh data');
      }
      
      toast.success(`Successfully dispatched ${productName} - All views updated`);
      
      // Clear success state after a brief moment
      setTimeout(() => {
        setDispatchSuccess(prev => ({ ...prev, [dispatchKey]: false }));
      }, 2000);
      
    } catch (error) {
      console.error('Error dispatching item:', error);
      setDispatchSuccess(prev => ({ ...prev, [dispatchKey]: false }));
      
      if (error.message.includes('Failed to fetch')) {
        toast.error('Cannot connect to server. Please ensure the backend server is running.');
      } else {
        toast.error(error.message || 'Failed to dispatch item');
      }
    } finally {
      setDispatchLoading(prev => ({ ...prev, [dispatchKey]: false }));
    }
  };

  // Navigate to order view without filter - just switch to show all orders
  const navigateToProductOrders = (productName, hostelName, categoryName) => {
    console.log('Navigating to order view for product:', { productName, hostelName, categoryName });
    
    // Switch to individual view WITHOUT setting filter - show all orders
    setViewMode('individual');
    
    // Show toast to inform user
    toast.success(`Switched to Order View - You can now dispatch individual items`);
  };

  // Debug function to check current order state
  const debugOrderState = () => {
    console.log('=== ORDER STATE DEBUG ===');
    console.log('View Mode:', viewMode);
    console.log('Grouped Orders Count:', orderData.length);
    console.log('Individual Orders Count:', individualOrders.length);
    console.log('Grouped Orders:', orderData);
    console.log('Individual Orders:', individualOrders);
    console.log('========================');
  };

  // Dispatch all orders for a product (grouped view)
  const dispatchAll = async (hostel, category, productName, count) => {
    const dispatchKey = `${hostel}-${category}-${productName}`;
    
    try {
      setDispatchLoading(prev => ({ ...prev, [dispatchKey]: true }));
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Authentication required. Please log in.');
        return;
      }

      // Optimistic update: immediately reduce the count in the UI
      setOrderData(prevData => {
        const updatedData = prevData.map(hostelGroup => {
          if (hostelGroup.hostel === hostel) {
            const updatedCategories = hostelGroup.categories.map(categoryGroup => {
              if (categoryGroup.category === category) {
                const updatedProducts = categoryGroup.products.map(product => {
                  if (product.productName === productName) {
                    const newOrderCount = Math.max(0, product.orderCount - count);
                    return {
                      ...product,
                      orderCount: newOrderCount
                    };
                  }
                  return product;
                }).filter(product => product.orderCount > 0); // Remove products with 0 count
                
                // Recalculate category total orders
                const categoryTotalOrders = updatedProducts.reduce((sum, product) => sum + product.orderCount, 0);
                
                return {
                  ...categoryGroup,
                  products: updatedProducts,
                  totalOrders: categoryTotalOrders
                };
              }
              return categoryGroup;
            }).filter(categoryGroup => categoryGroup.products.length > 0); // Remove empty categories
            
            // Recalculate hostel total orders
            const hostelTotalOrders = updatedCategories.reduce((sum, category) => sum + category.totalOrders, 0);
            
            const updatedHostelGroup = {
              ...hostelGroup,
              categories: updatedCategories,
              totalOrders: hostelTotalOrders
            };

            // Update selectedHostel if this is the currently selected hostel
            setSelectedHostel(prevSelected => {
              if (prevSelected && prevSelected.hostel === hostel) {
                if (updatedCategories.length === 0) {
                  return null; // Clear selection if hostel becomes empty
                }
                return updatedHostelGroup; // Update with new data
              }
              return prevSelected;
            });

            return updatedHostelGroup;
          }
          return hostelGroup;
        }).filter(hostelGroup => hostelGroup.categories.length > 0); // Remove empty hostels
        
        return updatedData;
      });
      
      // Use VITE_VERCEL_API_URL for dispatch operations to ensure emails are sent from production backend
      const apiBaseUrl = import.meta.env.VITE_VERCEL_API_URL || import.meta.env.VITE_API_URL;
      const apiUrl = `${apiBaseUrl}/admin/dispatch`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hostel,
          category,
          productName,
          count
        })
      });

      if (!response.ok) {
        // If the API call fails, revert the optimistic update
        await fetchOrderData();
        
        const contentType = response.headers.get('content-type');
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } else {
            const errorText = await response.text();
            errorMessage = errorText.substring(0, 200);
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Show success state briefly
      setDispatchSuccess(prev => ({ ...prev, [dispatchKey]: true }));
      
      // Immediately refresh data after successful dispatch to ensure consistency
      console.log('Refreshing order data after successful dispatch...');
      await fetchOrderData();
      
      toast.success(`Successfully dispatched ${result.dispatchedCount || count} orders for ${productName}`);
      
      // Clear success state after a brief moment
      setTimeout(() => {
        setDispatchSuccess(prev => ({ ...prev, [dispatchKey]: false }));
      }, 1500);
      
    } catch (error) {
      console.error('Error dispatching orders:', error);
      
      // Clear any success state on error
      setDispatchSuccess(prev => ({ ...prev, [dispatchKey]: false }));
      
      if (error.message.includes('Failed to fetch')) {
        toast.error('Cannot connect to server. Please ensure the backend server is running on port 3000.');
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        toast.error('Authentication failed. Please log in again.');
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        toast.error('Access denied. Admin privileges required.');
      } else {
        toast.error(`Failed to dispatch orders: ${error.message}`);
      }
    } finally {
      setDispatchLoading(prev => ({ ...prev, [dispatchKey]: false }));
    }
  };

  // Open custom dispatch modal
  const openCustomDispatchModal = (hostel, category, productName, maxCount) => {
    setCustomDispatchModal({
      isOpen: true,
      hostel,
      category,
      productName,
      maxCount,
      customCount: Math.min(1, maxCount)
    });
  };

  // Close custom dispatch modal
  const closeCustomDispatchModal = () => {
    setCustomDispatchModal({
      isOpen: false,
      hostel: '',
      category: '',
      productName: '',
      maxCount: 0,
      customCount: 1
    });
  };

  // Handle custom dispatch
  const handleCustomDispatch = async () => {
    const { hostel, category, productName, customCount } = customDispatchModal;
    
    if (customCount <= 0 || customCount > customDispatchModal.maxCount) {
      toast.error('Invalid count specified');
      return;
    }

    await dispatchAll(hostel, category, productName, customCount);
    closeCustomDispatchModal();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-4xl text-rose-600" />
        <span className="ml-3 text-lg text-gray-600">Loading order data...</span>
      </div>
    );
  }

  // Filter orders to only show those with 'placed' status
  const filteredOrderData = filterOrdersByStatus(orderData);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 md:py-8 max-w-7xl mx-auto">
      {/* Header (Responsive like AdminOrders) */}
      <div className="pt-16 md:pt-2 flex flex-col gap-4 2xl:flex-row 2xl:justify-between 2xl:items-start mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Order Tracking Dashboard</h1>
          <p className="text-gray-600 mt-1 truncate">Track and dispatch pending orders (showing only 'placed' orders)</p>
        </div>
        <div className="flex flex-wrap gap-3 order-last 2xl:order-none">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 flex-shrink-0">
            <button
              onClick={() => {
                console.log('Switching to grouped view - data already up to date');
                setViewMode('grouped');
              }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 ${
                viewMode === 'grouped'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Grouped View"
            >
              Grouped View
            </button>
            <button
              onClick={() => setViewMode('individual')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 ${
                viewMode === 'individual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Order View"
            >
              Order View
            </button>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-md hover:shadow-lg flex-shrink-0"
          >
            <FaSync className={`${refreshing ? 'animate-spin' : ''}`} />
            <span className="font-medium">
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </span>
          </button>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'individual' ? (
        // Individual Orders View - Show orders divided by date
        individualOrders.length === 0 ? (
          <div className="text-center py-12">
            <FaTruck className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Pending Orders</h3>
            <p className="text-gray-500">All orders have been dispatched or there are no orders requiring dispatch.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {(() => {
              const { todaysOrders, remainingOrders } = filterOrdersByDate(individualOrders);
              
              return (
                <>
                  {/* Bulk Dispatch Controls */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Bulk Dispatch Controls</h3>
                        <p className="text-sm text-gray-600">Quickly dispatch multiple orders at once</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        {todaysOrders.length > 0 && (
                          <button
                            onClick={dispatchTodaysOrders}
                            disabled={dispatchLoading.todaysOrders}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-md hover:shadow-lg"
                          >
                            {dispatchLoading.todaysOrders ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <FaTruck />
                            )}
                            <span className="font-medium">
                              Dispatch Today's Orders ({todaysOrders.length})
                            </span>
                          </button>
                        )}
                        
                        <button
                          onClick={dispatchAllOrders}
                          disabled={dispatchLoading.allOrders}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-md hover:shadow-lg"
                        >
                          {dispatchLoading.allOrders ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <FaTruck />
                          )}
                          <span className="font-medium">
                            Dispatch All Orders ({individualOrders.length})
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Today's Orders Section */}
                  {todaysOrders.length > 0 && (
                    <div className="bg-white border-2 border-blue-200 rounded-lg shadow-lg overflow-hidden">
                      {/* Section Header - Clickable */}
                      <button
                        onClick={() => setTodaysOrdersExpanded(!todaysOrdersExpanded)}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-left">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">📅</span>
                            <div className="text-left">
                              <h2 className="text-xl font-bold">Today's Orders</h2>
                              <p className="text-blue-100 text-sm">
                                Orders placed on {new Date().toLocaleDateString('en-IN', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 sm:self-auto">
                            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                              {todaysOrders.length} orders
                            </span>
                            <FaChevronDown 
                              className={`text-white transition-transform duration-200 ${
                                todaysOrdersExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </div>
                      </button>
                      
                      {/* Orders Content - Collapsible */}
                      <AnimatePresence>
                        {todaysOrdersExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="p-6 space-y-6">
                              {todaysOrders.map((order) => (
                                <IndividualOrderCard 
                                  key={order._id} 
                                  order={order} 
                                  onDispatchItem={dispatchIndividualItem}
                                  dispatchLoading={dispatchLoading}
                                  dispatchSuccess={dispatchSuccess}
                                />
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Remaining Orders Section */}
                  {remainingOrders.length > 0 && (
                    <div className="bg-white border-2 border-gray-200 rounded-lg shadow-lg overflow-hidden">
                      {/* Section Header - Clickable */}
                      <button
                        onClick={() => setPreviousOrdersExpanded(!previousOrdersExpanded)}
                        className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-4 hover:from-gray-700 hover:to-gray-800 transition-all duration-200"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-left">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">📋</span>
                            <div className="text-left">
                              <h2 className="text-xl font-bold">Previous Orders</h2>
                              <p className="text-gray-200 text-sm">Orders from previous days</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 sm:self-auto">
                            <span className="bg-gray-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                              {remainingOrders.length} orders
                            </span>
                            <FaChevronDown 
                              className={`text-white transition-transform duration-200 ${
                                previousOrdersExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </div>
                      </button>
                      
                      {/* Orders Content - Collapsible */}
                      <AnimatePresence>
                        {previousOrdersExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="p-6 space-y-6">
                              {remainingOrders.map((order) => (
                                <IndividualOrderCard 
                                  key={order._id} 
                                  order={order} 
                                  onDispatchItem={dispatchIndividualItem}
                                  dispatchLoading={dispatchLoading}
                                  dispatchSuccess={dispatchSuccess}
                                />
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Show message if no orders in either section */}
                  {todaysOrders.length === 0 && remainingOrders.length === 0 && (
                    <div className="text-center py-12">
                      <FaTruck className="mx-auto text-6xl text-gray-300 mb-4" />
                      <h3 className="text-xl font-medium text-gray-900 mb-2">No Pending Orders</h3>
                      <p className="text-gray-500">All orders have been dispatched or there are no orders requiring dispatch.</p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )
      ) : (
        // Grouped View (existing)
        filteredOrderData.length === 0 ? (
          <div className="text-center py-12">
            <FaTruck className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Pending Orders</h3>
            <p className="text-gray-500">All orders have been dispatched or there are no orders with 'placed' status.</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Hostel Buttons */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Hostel</h3>
              <div className="space-y-3">
                {filteredOrderData.map((hostelGroup) => (
                  <HostelButton
                    key={hostelGroup.hostel}
                    hostelGroup={hostelGroup}
                    isSelected={selectedHostel?.hostel === hostelGroup.hostel}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Categories and Products */}
          <div className="lg:col-span-2">
            {selectedHostel ? (
              <HostelDetails hostelGroup={selectedHostel} />
            ) : (
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-12 text-center">
                <FaMapMarkerAlt className="mx-auto text-6xl text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">Select a Hostel</h3>
                <p className="text-gray-500">Choose a hostel from the left panel to view categories and products</p>
              </div>
            )}
          </div>
        </div>
        )
      )}

      {/* Custom Dispatch Modal */}
      <AnimatePresence>
        {customDispatchModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={closeCustomDispatchModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Custom Dispatch Count
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Hostel:</strong> {customDispatchModal.hostel}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Category:</strong> {customDispatchModal.category}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    <strong>Product:</strong> {customDispatchModal.productName}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of orders to dispatch (Max: {customDispatchModal.maxCount})
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={customDispatchModal.maxCount}
                    value={customDispatchModal.customCount}
                    onChange={(e) => setCustomDispatchModal(prev => ({
                      ...prev,
                      customCount: parseInt(e.target.value) || 1
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={closeCustomDispatchModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCustomDispatch}
                  className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors duration-200"
                >
                  Dispatch
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminOrderTracking;
