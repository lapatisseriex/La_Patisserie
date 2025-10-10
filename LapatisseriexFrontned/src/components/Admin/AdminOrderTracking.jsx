import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaChevronDown, 
  FaChevronRight, 
  FaTruck, 
  FaEdit,
  FaMapMarkerAlt,
  FaLayerGroup,
  FaCube,
  FaSpinner
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const AdminOrderTracking = () => {
  const [orderData, setOrderData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedHostels, setExpandedHostels] = useState({});
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
  const fetchOrderData = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Authentication required. Please log in.');
        return;
      }
      
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const apiUrl = `${apiBaseUrl}/api/admin/orders/grouped`;
      
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
      
      if (data.length === 0) {
        toast.success('No orders with placed status at the moment');
      } else {
        const filteredData = filterOrdersByStatus(data);
        toast.success(`Loaded 'placed' orders from ${filteredData.length} hostels`);
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
    }
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

  // Toggle hostel expansion
  const toggleHostel = (hostelName) => {
    setExpandedHostels(prev => ({
      ...prev,
      [hostelName]: !prev[hostelName]
    }));
  };

  // Toggle category expansion
  const toggleCategory = (hostelName, categoryName) => {
    const key = `${hostelName}-${categoryName}`;
    setExpandedCategories(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
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
      
      // Use environment variable for API base URL or fallback to relative path
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const apiUrl = `${apiBaseUrl}/api/admin/dispatch`;
      
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
      toast.success(`Successfully dispatched ${result.dispatchedCount || count} orders for ${productName}`);
      
      // Refresh data
      await fetchOrderData();
      
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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3
      }
    }
  };

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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Tracking</h1>
        <p className="text-gray-600">Track and dispatch pending orders (showing only 'placed' orders)</p>
      </div>

      {/* No data state */}
      {filteredOrderData.length === 0 ? (
        <div className="text-center py-12">
          <FaTruck className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Pending Orders</h3>
          <p className="text-gray-500">All orders have been dispatched or there are no orders with 'placed' status.</p>
        </div>
      ) : (
        /* Order Data */
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {filteredOrderData.map((hostelGroup) => (
            <motion.div
              key={hostelGroup.hostel}
              variants={cardVariants}
              className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
            >
              {/* Hostel Header */}
              <div
                className="bg-gradient-to-r from-rose-600 to-pink-600 text-white p-6 cursor-pointer hover:from-rose-700 hover:to-pink-700 transition-all duration-200"
                onClick={() => toggleHostel(hostelGroup.hostel)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FaMapMarkerAlt className="text-2xl" />
                    <div>
                      <h2 className="text-2xl font-bold">{hostelGroup.hostel}</h2>
                      <p className="text-rose-100">
                        {hostelGroup.totalOrders} pending orders across {hostelGroup.categories.length} categories
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium">
                      {hostelGroup.totalOrders} orders
                    </span>
                    {expandedHostels[hostelGroup.hostel] ? 
                      <FaChevronDown className="text-xl" /> : 
                      <FaChevronRight className="text-xl" />
                    }
                  </div>
                </div>
              </div>

              {/* Categories */}
              <AnimatePresence>
                {expandedHostels[hostelGroup.hostel] && (
                  <motion.div
                    variants={expandVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="overflow-hidden"
                  >
                    <div className="p-6 space-y-4">
                      {hostelGroup.categories.map((categoryGroup) => (
                        <div
                          key={categoryGroup.category}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          {/* Category Header */}
                          <div
                            className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                            onClick={() => toggleCategory(hostelGroup.hostel, categoryGroup.category)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <FaLayerGroup className="text-gray-600" />
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {categoryGroup.category}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    {categoryGroup.totalOrders} orders across {categoryGroup.products.length} products
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                  {categoryGroup.totalOrders} orders
                                </span>
                                {expandedCategories[`${hostelGroup.hostel}-${categoryGroup.category}`] ? 
                                  <FaChevronDown className="text-gray-600" /> : 
                                  <FaChevronRight className="text-gray-600" />
                                }
                              </div>
                            </div>
                          </div>

                          {/* Products */}
                          <AnimatePresence>
                            {expandedCategories[`${hostelGroup.hostel}-${categoryGroup.category}`] && (
                              <motion.div
                                variants={expandVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="overflow-hidden"
                              >
                                <div className="p-4 space-y-3 bg-white">
                                  {categoryGroup.products.map((product) => {
                                    const dispatchKey = `${hostelGroup.hostel}-${categoryGroup.category}-${product.productName}`;
                                    const isDispatching = dispatchLoading[dispatchKey];

                                    return (
                                      <div
                                        key={product.productName}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200"
                                      >
                                        <div className="flex items-center space-x-3">
                                          <FaCube className="text-gray-500" />
                                          <div>
                                            <h4 className="font-medium text-gray-900">
                                              {product.productName}
                                            </h4>
                                            <p className="text-sm text-gray-600">
                                              {product.orderCount} pending orders
                                            </p>
                                          </div>
                                        </div>

                                        <div className="flex items-center space-x-3">
                                          <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                                            {product.orderCount} orders
                                          </span>
                                          
                                          <div className="flex space-x-2">
                                            <button
                                              onClick={() => dispatchAll(
                                                hostelGroup.hostel,
                                                categoryGroup.category,
                                                product.productName,
                                                product.orderCount
                                              )}
                                              disabled={isDispatching}
                                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
                                            >
                                              {isDispatching ? (
                                                <FaSpinner className="animate-spin" />
                                              ) : (
                                                <FaTruck />
                                              )}
                                              <span>Dispatch All</span>
                                            </button>
                                            
                                            <button
                                              onClick={() => openCustomDispatchModal(
                                                hostelGroup.hostel,
                                                categoryGroup.category,
                                                product.productName,
                                                product.orderCount
                                              )}
                                              disabled={isDispatching}
                                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
                                            >
                                              <FaEdit />
                                              <span>Custom Count</span>
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
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
