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
  FaCheck
} from 'react-icons/fa';
import { BsCashCoin } from 'react-icons/bs';
import { toast } from 'react-hot-toast';
import { resolveOrderItemVariantLabel } from '../../utils/variantUtils';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    paymentMethod: '',
    paymentStatus: '',
    search: ''
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [deliveryLoading, setDeliveryLoading] = useState({});
  const [deliverySuccess, setDeliverySuccess] = useState({});

  const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iI0Q1RDlERCIvPgo8L3N2Zz4K';

  const getItemImage = (item = {}) => {
    const sources = [
      item.image,
      Array.isArray(item.images) && item.images[0],
      item.productImage,
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

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setCurrentPage(1);
    fetchOrders(1, newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      status: '',
      paymentMethod: '',
      paymentStatus: '',
      search: ''
    };
    setFilters(clearedFilters);
    setCurrentPage(1);
    fetchOrders(1, clearedFilters);
  };

  // View order details
  const viewOrderDetails = async (orderNumber) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/orders/${orderNumber}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }

      const data = await response.json();
      setSelectedOrder(data.order);
      setShowOrderModal(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      alert('Failed to fetch order details');
    }
  };

  useEffect(() => {
    fetchOrders();
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
      
      // Show success state briefly
      setDeliverySuccess(prev => ({ ...prev, [deliveryKey]: true }));
      
      // Refresh orders and order details
      await fetchOrders(currentPage, filters);
      if (selectedOrder && selectedOrder._id === orderId) {
        await viewOrderDetails(selectedOrder.orderNumber);
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600 mt-1">Manage and track all customer orders</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => fetchOrders(currentPage, filters)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaSyncAlt className="mr-2" />
            Refresh
          </button>
          <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <FaDownload className="mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order number, customer name, email..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>

          {/* Order Status Filter */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="placed">Placed</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <select
              value={filters.paymentMethod}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Payment Methods</option>
              <option value="razorpay">Online Payment</option>
              <option value="cod">Cash on Delivery</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <select
              value={filters.paymentStatus}
              onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Payment Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <button
            onClick={handleSearch}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaSearch className="mr-2" />
            Search
          </button>
          <button
            onClick={clearFilters}
            className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <FaFilter className="mr-2" />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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
          <div className="overflow-x-auto">
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
                          onClick={() => viewOrderDetails(order.orderNumber)}
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
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
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

      {/* Order Detail Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Order Details - {selectedOrder.orderNumber}
                </h3>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {/* Customer Information */}
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Customer Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Name:</span> {selectedOrder.userDetails?.name || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span> {selectedOrder.userDetails?.phone || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {selectedOrder.userDetails?.email || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Location:</span> {selectedOrder.deliveryLocation}
                    </div>
                    <div>
                      <span className="font-medium">Hostel:</span> {selectedOrder.hostelName || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-md font-medium text-gray-900">Order Items</h4>
                    {/* Bulk Deliver All Button */}
                    {selectedOrder.cartItems?.filter(item => item.dispatchStatus === 'dispatched').length > 0 && (
                      <button
                        onClick={() => markAsDelivered(selectedOrder._id, null, null, 'ALL_DISPATCHED')}
                        disabled={deliveryLoading[`${selectedOrder._id}-ALL_DISPATCHED`]}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
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
                  <div className="space-y-3">
                    {selectedOrder.cartItems?.map((item, index) => {
                      const dispatchStatus = item.dispatchStatus || 'pending';
                      const deliveryKey = `${selectedOrder._id}-${item.productName}`;
                      const isDelivering = deliveryLoading[deliveryKey];
                      const isDelivered = deliverySuccess[deliveryKey];
                      const variantLabel = getVariantDisplay(item);
                      const imageSrc = getItemImage(item);

                      return (
                        <div key={index} className={`flex justify-between items-center p-3 rounded-lg border ${
                          dispatchStatus === 'delivered' ? 'bg-green-50 border-green-200' :
                          dispatchStatus === 'dispatched' ? 'bg-purple-50 border-purple-200' :
                          'bg-orange-50 border-orange-200'
                        }`}>
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-14 h-14 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
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
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-1 text-xs font-medium rounded ${
                                  dispatchStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                                  dispatchStatus === 'dispatched' ? 'bg-purple-100 text-purple-800' :
                                  'bg-orange-100 text-orange-800'
                                }`}>
                                  {dispatchStatus === 'delivered' ? 'DELIVERED' :
                                   dispatchStatus === 'dispatched' ? 'DISPATCHED' :
                                   'PENDING'}
                                </span>
                                <div className="font-medium truncate">{item.productName}</div>
                              </div>
                              <div className="text-sm text-gray-600 truncate">
                                Qty: {item.quantity} • Unit Price: {formatCurrency(item.price)}
                              </div>
                              {variantLabel && (
                                <div className="text-xs text-gray-500 truncate mt-1">
                                  Variant: {variantLabel}
                                </div>
                              )}
                              {item.dispatchedAt && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Dispatched: {new Date(item.dispatchedAt).toLocaleString('en-IN', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              )}
                              {item.deliveredAt && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Delivered: {new Date(item.deliveredAt).toLocaleString('en-IN', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="font-medium">{formatCurrency(item.price * item.quantity)}</div>

                            {dispatchStatus === 'dispatched' && (
                              <button
                                onClick={() => markAsDelivered(selectedOrder._id, item.productName, item.categoryName)}
                                disabled={isDelivering || isDelivered}
                                className={`px-3 py-1 rounded text-xs font-medium transition-colors duration-200 flex items-center gap-1 ${
                                  isDelivered
                                    ? 'bg-emerald-500 text-white cursor-default'
                                    : 'bg-green-600 hover:bg-green-700 text-white disabled:opacity-50'
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

                            {dispatchStatus === 'delivered' && (
                              <div className="px-3 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                ✅ Completed
                              </div>
                            )}

                            {dispatchStatus === 'pending' && (
                              <div className="px-3 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                                📦 Pending
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Order Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Cart Total:</span>
                      <span>{formatCurrency(selectedOrder.orderSummary?.cartTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discounted Total:</span>
                      <span>{formatCurrency(selectedOrder.orderSummary?.discountedTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Charge:</span>
                      <span>{formatCurrency(selectedOrder.orderSummary?.deliveryCharge)}</span>
                    </div>
                  
                    {selectedOrder.orderSummary?.couponDiscount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Coupon Discount:</span>
                        <span>-{formatCurrency(selectedOrder.orderSummary?.couponDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium text-lg border-t pt-2">
                      <span>Grand Total:</span>
                      <span>{formatCurrency(selectedOrder.amount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;