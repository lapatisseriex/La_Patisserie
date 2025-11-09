import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { FaBell, FaShoppingCart, FaTimes, FaEnvelope, FaPhone } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const AdminNotifications = () => {
  const [allNotifications, setAllNotifications] = useState([]); // Store all notifications
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total: 0, cancelledCount: 0 });
  const [filter, setFilter] = useState('all'); // 'all' or 'order_cancelled'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Fetch all notifications once
  const fetchAllNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      // Fetch a large number to get all notifications
      const url = `${import.meta.env.VITE_API_URL}/notifications/admin?page=1&limit=1000`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setAllNotifications(response.data.notifications);
        setStats(response.data.stats);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.response?.data?.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  // Filter notifications on client side for instant response
  const filteredNotifications = useMemo(() => {
    if (filter === 'all') return allNotifications;
    return allNotifications.filter(notification => notification.type === filter);
  }, [allNotifications, filter]);

  // Calculate pagination for filtered results
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const notifications = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Load all notifications on component mount
  useEffect(() => {
    fetchAllNotifications();
  }, []);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  // Calculate dynamic stats based on all notifications
  const dynamicStats = useMemo(() => {
    const total = allNotifications.length;
    const cancelledCount = allNotifications.filter(n => n.type === 'order_cancelled').length;
    const activeCount = total - cancelledCount;
    return { total, cancelledCount, activeCount };
  }, [allNotifications]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order_cancelled':
        return <FaTimes className="text-red-500" />;
      case 'order_placed':
        return <FaShoppingCart className="text-green-500" />;
      case 'order_delivered':
        return <FaShoppingCart className="text-blue-500" />;
      default:
        return <FaBell className="text-gray-500" />;
    }
  };

  const getNotificationBgColor = (type) => {
    switch (type) {
      case 'order_cancelled':
        return 'bg-red-50 border-red-200';
      case 'order_placed':
        return 'bg-green-50 border-green-200';
      case 'order_delivered':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#733857] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 max-w-[1400px]">
      {/* Header */}
      <div className="mb-6 md:mb-8 pt-16 md:pt-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Notifications</h1>
        <p className="text-gray-600">Monitor all order activities and customer notifications</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Notifications</p>
              <p className="text-3xl font-bold text-gray-800">{dynamicStats.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FaBell className="text-blue-600 text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Cancelled Orders</p>
              <p className="text-3xl font-bold text-red-600">{dynamicStats.cancelledCount}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <FaTimes className="text-red-600 text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Orders</p>
              <p className="text-3xl font-bold text-green-600">{dynamicStats.activeCount}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FaShoppingCart className="text-green-600 text-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-[#733857] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Notifications
          </button>
          <button
            onClick={() => setFilter('order_cancelled')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'order_cancelled'
                ? 'bg-[#733857] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cancelled Orders
          </button>
          <button
            onClick={() => setFilter('order_placed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'order_placed'
                ? 'bg-[#733857] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            New Orders
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FaBell className="text-gray-300 text-6xl mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No notifications found</h3>
          <p className="text-gray-500">There are no notifications to display at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`bg-white rounded-lg shadow-md border-l-4 p-6 ${getNotificationBgColor(
                notification.type
              )}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1 text-2xl">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        {notification.title}
                      </h3>
                      <p className="text-gray-600 mb-3">{notification.message}</p>
                    </div>
                    <span className="text-sm text-gray-500 ml-4 whitespace-nowrap">
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>

                  {/* User and Order Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Order Number:</strong>{' '}
                        <Link
                          to={`/admin/orders`}
                          className="text-[#733857] hover:underline font-medium"
                        >
                          {notification.orderNumber}
                        </Link>
                      </p>
                      {notification.userId && (
                        <>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Customer:</strong> {notification.userId.name || 'N/A'}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            {notification.userId.email && (
                              <div className="flex items-center text-sm text-gray-600">
                                <FaEnvelope className="mr-1 text-gray-400" />
                                <span>{notification.userId.email}</span>
                              </div>
                            )}
                            {notification.userId.phoneNumber && (
                              <div className="flex items-center text-sm text-gray-600">
                                <FaPhone className="mr-1 text-gray-400" />
                                <span>{notification.userId.phoneNumber}</span>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {notification.data && notification.data.cancelReason && (
                      <div className="bg-red-50 p-3 rounded-lg w-full md:col-span-2 col-span-1">
                        <p className="text-sm font-semibold text-red-800 mb-1">Cancellation Reason:</p>
                        <div className="text-xs sm:text-sm text-red-700 whitespace-pre-wrap break-words">
                          {notification.data.cancelReason}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg bg-white shadow-md border border-gray-300 text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>
          <div className="flex gap-2">
            {[...Array(totalPages)].map((_, index) => {
              const pageNum = index + 1;
              // Show first page, last page, current page, and pages around current
              if (
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
              ) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-[#733857] text-white'
                        : 'bg-white shadow-md border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                return <span key={pageNum} className="px-2 py-2">...</span>;
              }
              return null;
            })}
          </div>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg bg-white shadow-md border border-gray-300 text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
