import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBell, 
  FaTimes, 
  FaCheck, 
  FaTruck,
  FaBox,
  FaTrash,
  FaSpinner,
  FaCheckDouble,
  FaEye
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import notificationService from '../../services/notificationService';

const NotificationSidePanel = ({ isOpen, onClose, onUnreadCountChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, notificationId: null, title: '' });
  const navigate = useNavigate();

  const fetchNotifications = async (page = 1, append = false) => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications(page, 20);
      
      if (append) {
        setNotifications(prev => [...prev, ...response.notifications]);
      } else {
        setNotifications(response.notifications);
      }
      
      setUnreadCount(response.unreadCount);
      onUnreadCountChange(response.unreadCount);
      setHasMore(response.notifications.length === 20);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      setCurrentPage(1);
    }
  }, [isOpen]);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchNotifications(nextPage, true);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );
      const newUnreadCount = Math.max(0, unreadCount - 1);
      setUnreadCount(newUnreadCount);
      onUnreadCountChange(newUnreadCount);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
      onUnreadCountChange(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const showDeleteConfirmation = (notificationId, title) => {
    setDeleteConfirm({ 
      show: true, 
      notificationId, 
      title: title.length > 30 ? title.substring(0, 30) + '...' : title 
    });
  };

  const confirmDelete = async () => {
    const { notificationId } = deleteConfirm;
    try {
      await notificationService.deleteNotification(notificationId);
      const deletedNotification = notifications.find(n => n._id === notificationId);
      setNotifications(prev => 
        prev.filter(notif => notif._id !== notificationId)
      );
      
      if (deletedNotification && !deletedNotification.read) {
        const newUnreadCount = Math.max(0, unreadCount - 1);
        setUnreadCount(newUnreadCount);
        onUnreadCountChange(newUnreadCount);
      }
      
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    } finally {
      setDeleteConfirm({ show: false, notificationId: null, title: '' });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, notificationId: null, title: '' });
  };

  const handleViewOrderStatus = async (notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      await markAsRead(notification._id);
    }

    // Handle navigation based on notification type
    if (notification.type === 'order_placed' || notification.type === 'order_dispatched' || notification.type === 'order_delivered') {
      // Navigate to the existing OrderDetail page which uses OrderTrackingContent
      navigate(`/orders/${notification.orderNumber}`);
      onClose(); // Close the notification panel
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order_placed':
        return <FaBox className="text-green-500" />;
      case 'order_dispatched':
        return <FaTruck className="text-blue-500" />;
      case 'order_delivered':
        return <FaCheck className="text-green-500" />;
      default:
        return <FaBox className="text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const formatMessageWithBold = (message) => {
    // Convert **text** to <strong>text</strong>
    return message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999, pointerEvents: isOpen ? 'auto' : 'none' }}>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 999998
              }}
            />
            
            {/* Side Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed',
                right: 0,
                top: 0,
                height: '100vh',
                width: '100vw',
                maxWidth: '384px',
                backgroundColor: 'white',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                zIndex: 999999,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
              className="sm:w-96"
            >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-2">
                <FaBell className="text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <FaCheckDouble className="text-xs" />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="flex items-center justify-center p-6">
                  <FaSpinner className="animate-spin text-blue-600 mr-2" />
                  <span>Loading notifications...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  <FaBell className="mx-auto text-4xl mb-4 text-gray-300" />
                  <h4 className="text-lg font-medium mb-2">No notifications yet</h4>
                  <p className="text-sm">We'll notify you when there's something new!</p>
                </div>
              ) : (
                <div>
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 border-b border-gray-100 transition-colors ${
                        !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-400' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 
                                className={`text-sm font-medium ${
                                  !notification.read ? 'text-gray-900' : 'text-gray-700'
                                }`}
                                dangerouslySetInnerHTML={{ 
                                  __html: formatMessageWithBold(notification.title) 
                                }}
                              />
                              <p 
                                className={`text-sm mt-1 ${
                                  !notification.read ? 'text-gray-700' : 'text-gray-500'
                                }`}
                                dangerouslySetInnerHTML={{ 
                                  __html: formatMessageWithBold(notification.message) 
                                }}
                              />
                              <div className="flex items-center justify-between mt-3">
                                <span className="text-xs text-gray-400">
                                  {formatDate(notification.createdAt)}
                                </span>
                                <div className="flex items-center gap-2">
                                  {!notification.read && (
                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                  )}
                                  {/* View Order Status Button for order-related notifications */}
                                  {(notification.type === 'order_placed' || 
                                    notification.type === 'order_dispatched' || 
                                    notification.type === 'order_delivered') && (
                                    <>
                                      <style>{`
                                        .view-order-btn:hover span {
                                          color: white !important;
                                          background: none !important;
                                          -webkit-background-clip: unset !important;
                                          background-clip: unset !important;
                                        }
                                        .view-order-btn:hover .icon {
                                          color: white !important;
                                        }
                                      `}</style>
                                      <button
                                        onClick={() => handleViewOrderStatus(notification)}
                                        className="view-order-btn flex items-center gap-1 px-3 py-1.5 bg-white border-2 rounded transition-all duration-200 font-medium hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] border-[#733857] transform hover:scale-[1.02] active:scale-[0.98]"
                                      >
                                        <FaEye className="text-xs icon" style={{ color: '#733857' }} />
                                        <span style={{
                                          background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)',
                                          WebkitBackgroundClip: 'text',
                                          backgroundClip: 'text',
                                          color: 'transparent'
                                        }}>View Order Status</span>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                showDeleteConfirmation(notification._id, notification.title);
                              }}
                              className="text-gray-400 hover:text-red-500 ml-2 p-1"
                              title="Delete notification"
                            >
                              <FaTrash className="text-xs" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Load More Button */}
                  {hasMore && (
                    <div className="p-4 text-center">
                      <button
                        onClick={loadMore}
                        disabled={loading}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <FaSpinner className="animate-spin inline mr-1" />
                            Loading...
                          </>
                        ) : (
                          'Load More'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Delete Confirmation Dialog */}
          <AnimatePresence>
            {deleteConfirm.show && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
                style={{ zIndex: 9999999 }}
                onClick={cancelDelete}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl"
                >
                  <div className="text-center">
                    <div className="text-red-500 mb-4">
                      <FaTrash className="text-3xl mx-auto" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Delete Notification
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Are you sure you want to delete "{deleteConfirm.title}"? This action cannot be undone.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={cancelDelete}
                        className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmDelete}
                        className="px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
    </div>
  );
};

export default NotificationSidePanel;