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
import { 
  ShoppingCart, 
  Package, 
  Heart
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import notificationService from '../../services/notificationService';

const NotificationSidePanel = ({ isOpen, onClose, onUnreadCountChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
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
  console.log("Notifications:", notifications);
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

  const deleteNotification = async (notificationId) => {
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
    }
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
        return <ShoppingCart className="w-4 h-4" style={{ color: '#733857' }} />;
      case 'order_dispatched':
        return <FaTruck className="text-orange-500" />;
      case 'order_delivered':
        return <FaCheck className="text-green-500" />;
      default:
        return <Package className="w-4 h-4" style={{ color: '#8d4466' }} />;
    }
  };

  const getDisplayText = (notification) => {
    // For order_placed, just show "New Order Placed"
    if (notification.type === 'order_placed') {
      return { text: 'New Order Placed', price: extractPrice(notification) };
    }
    
    // For other types, try to extract product name from message
    const message = notification.message || notification.title || '';
    
    // Look for product names in bold (between **)
    const productMatch = message.match(/\*\*(.*?)\*\*/);
    if (productMatch) {
      const productName = productMatch[1].trim();
      if (productName && !productName.includes('#') && productName.length > 2) {
        return { text: productName, price: extractPrice(notification) };
      }
    }
    
    // Fallback based on type
    const fallbacks = {
      'order_dispatched': 'Order Dispatched',
      'order_delivered': 'Order Delivered',
    };
    
    return { text: fallbacks[notification.type] || 'Order Update', price: extractPrice(notification) };
  };
  
  const extractPrice = (notification) => {
    const combinedText = `${notification.title} ${notification.message}`;
    const priceMatch = combinedText.match(/₹\s*([\d,]+(?:\.\d{2})?)/);
    return priceMatch ? `₹${priceMatch[1]}` : null;
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
                <FaBell style={{ color: '#733857' }} />
                <h3 className="text-lg font-semibold" style={{ color: '#733857' }}>Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-white text-xs px-2 py-1 rounded-full font-bold" style={{ backgroundColor: '#733857' }}>
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-medium flex items-center gap-1 px-2 py-1 rounded transition-colors"
                    style={{ 
                      color: '#8d4466',
                      backgroundColor: 'rgba(141, 68, 102, 0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#8d4466';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(141, 68, 102, 0.1)';
                      e.currentTarget.style.color = '#8d4466';
                    }}
                  >
                    <FaCheckDouble className="text-xs" />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="flex items-center justify-center p-6">
                  <FaSpinner className="animate-spin mr-2" style={{ color: '#733857' }} />
                  <span style={{ color: '#733857' }}>Loading notifications...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center p-8">
                  <Package className="mx-auto text-4xl mb-4" style={{ color: 'rgba(115, 56, 87, 0.3)' }} />
                  <h4 className="text-lg font-medium mb-2" style={{ color: '#733857' }}>No notifications yet</h4>
                  <p className="text-sm" style={{ color: 'rgba(115, 56, 87, 0.6)' }}>We'll notify you when there's something new!</p>
                </div>
              ) : (
                <div>
                  {notifications.map((notification) => {
                    const { text, price } = getDisplayText(notification);
                    
                    return (
                      <motion.div
                        key={notification._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3 border-b border-gray-100 transition-colors ${
                          !notification.read ? 'bg-gradient-to-r from-rose-50 via-pink-50 to-rose-50 border-l-2 border-l-[#733857]' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className={`text-sm font-medium truncate ${
                                !notification.read ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {text}
                              </h4>
                              {price && (
                                <span className="text-sm font-semibold ml-2 shrink-0" style={{ color: '#733857' }}>
                                  {price}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between mt-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  notification.type === 'order_placed' ? 'bg-green-100 text-green-700' :
                                  notification.type === 'order_dispatched' ? 'bg-orange-100 text-orange-700' :
                                  notification.type === 'order_delivered' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {notification.type === 'order_placed' ? 'Placed' :
                                   notification.type === 'order_dispatched' ? 'Dispatched' :
                                   notification.type === 'order_delivered' ? 'Delivered' : 'Update'}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {formatDate(notification.createdAt)}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                {!notification.read && (
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#733857' }}></span>
                                )}
                                
                                {/* Compact View Button */}
                                {(notification.type === 'order_placed' || 
                                  notification.type === 'order_dispatched' || 
                                  notification.type === 'order_delivered') && (
                                  <button
                                    onClick={() => handleViewOrderStatus(notification)}
                                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-all duration-200 hover:scale-105 active:scale-95"
                                    style={{
                                      backgroundColor: 'rgba(115, 56, 87, 0.1)',
                                      color: '#733857',
                                      border: '1px solid rgba(115, 56, 87, 0.2)'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = '#733857';
                                      e.currentTarget.style.color = 'white';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'rgba(115, 56, 87, 0.1)';
                                      e.currentTarget.style.color = '#733857';
                                    }}
                                  >
                                    <FaEye className="text-xs" />
                                    View
                                  </button>
                                )}
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification._id);
                                  }}
                                  className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                                  title="Delete"
                                >
                                  <FaTrash className="text-xs" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  
                  {/* Load More Button */}
                  {hasMore && (
                    <div className="p-4 text-center">
                      <button
                        onClick={loadMore}
                        disabled={loading}
                        className="font-medium text-sm px-4 py-2 rounded transition-all duration-200 disabled:opacity-50"
                        style={{ 
                          color: '#733857',
                          backgroundColor: 'rgba(115, 56, 87, 0.1)',
                          border: '1px solid rgba(115, 56, 87, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#733857';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(115, 56, 87, 0.1)';
                          e.currentTarget.style.color = '#733857';
                        }}
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

        </>
      )}
    </AnimatePresence>
    </div>
  );
};

export default NotificationSidePanel;