import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTruck, 
  FaEdit,
  FaMapMarkerAlt,
  FaSpinner,
  FaShoppingBag,
  FaBox,
  FaChevronDown,
  FaChevronRight,
  FaSync
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

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

const AdminOrderTracking = () => {
  const [orderData, setOrderData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [dispatchLoading, setDispatchLoading] = useState({});
  const [customDispatchModal, setCustomDispatchModal] = useState({
    isOpen: false,
    hostel: '',
    category: '',
    productName: '',
    maxCount: 0,
    customCount: 1
  });

  // Fetch grouped order data
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
      
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const apiUrl = `${apiBaseUrl}/admin/orders/grouped`;
      
      console.log('Fetching order data from:', apiUrl, 'isRefresh:', isRefresh);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const contentType = response.headers.get('content-type');
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } else {
            const errorText = await response.text();
            
            if (errorText.includes('<!doctype') || errorText.includes('<html')) {
              errorMessage = 'Server returned an HTML error page. Check if the backend server is running on port 3000.';
            } else {
              errorMessage = errorText.substring(0, 200);
            }
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }
      
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        throw new Error('Server returned non-JSON response. Backend server may not be running.');
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format received from server');
      }
      
      setOrderData(data);
      
      if (isRefresh) {
        if (data.length === 0) {
          toast.success('No orders with placed status at the moment');
        } else {
          const filteredData = filterOrdersByStatus(data);
          toast.success(`Refreshed! Loaded 'placed' orders from ${filteredData.length} hostels`);
        }
      } else {
        if (data.length === 0) {
          toast.success('No orders with placed status at the moment');
        } else {
          const filteredData = filterOrdersByStatus(data);
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

  useEffect(() => {
    fetchOrderData();
  }, []);

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

  // Product Card Component
  const ProductCard = ({ product, hostel, category }) => {
    const dispatchKey = `${hostel}-${category}-${product.productName}`;
    const isDispatching = dispatchLoading[dispatchKey];

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
              onClick={() => dispatchAll(hostel, category, product.productName, product.orderCount)}
              disabled={isDispatching}
              className="flex-1 px-2 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-1 font-medium"
            >
              {isDispatching ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaTruck className="text-xs" />
              )}
              <span>Dispatch</span>
            </button>
            
            <button
              onClick={() => openCustomDispatchModal(hostel, category, product.productName, product.orderCount)}
              disabled={isDispatching}
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

  // Dispatch all orders for a product
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
        return prevData.map(hostelGroup => {
          if (hostelGroup.hostel === hostel) {
            return {
              ...hostelGroup,
              categories: hostelGroup.categories.map(categoryGroup => {
                if (categoryGroup.category === category) {
                  return {
                    ...categoryGroup,
                    products: categoryGroup.products.map(product => {
                      if (product.productName === productName) {
                        const newOrderCount = Math.max(0, product.orderCount - count);
                        return {
                          ...product,
                          orderCount: newOrderCount
                        };
                      }
                      return product;
                    }).filter(product => product.orderCount > 0) // Remove products with 0 count
                  };
                }
                return categoryGroup;
              }).filter(categoryGroup => categoryGroup.products.length > 0) // Remove empty categories
            };
          }
          return hostelGroup;
        }).filter(hostelGroup => hostelGroup.categories.length > 0); // Remove empty hostels
      });
      
      // Use environment variable for API base URL or fallback to relative path
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
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
      
      // Always refresh data after successful dispatch to ensure consistency
      // Use a small delay to ensure database transaction is committed
      setTimeout(async () => {
        console.log('Refreshing order data after successful dispatch...');
        await fetchOrderData();
      }, 300);
      
      toast.success(`Successfully dispatched ${result.dispatchedCount || count} orders for ${productName}`);
      
    } catch (error) {
      console.error('Error dispatching orders:', error);
      
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
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Order Tracking Dashboard</h1>
            <p className="text-gray-600">Track and dispatch pending orders (showing only 'placed' orders)</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              <FaSync className={`${refreshing ? 'animate-spin' : ''}`} />
              <span className="font-medium">
                {refreshing ? 'Refreshing...' : 'Refresh Data'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* No data state */}
      {filteredOrderData.length === 0 ? (
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
