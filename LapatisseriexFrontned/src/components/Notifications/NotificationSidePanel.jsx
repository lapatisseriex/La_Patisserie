import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell,
  X, 
  Check, 
  Truck,
  Package,
  Trash2,
  Loader2,
  CheckCheck,
  Eye,
  ShoppingCart,
  Heart,
  Clock,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import notificationService from '../../services/notificationService';
import webSocketService from '../../services/websocketService';
import { useAuth } from '../../hooks/useAuth';

// Dynamic Time Component that updates every minute
const DynamicTime = ({ dateString }) => {
  const [timeText, setTimeText] = useState('');
  const timerRef = useRef(null);

  const calculateTimeText = () => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      const diffInHours = Math.floor(diffInMinutes / 60);
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInMinutes / 1440);
      return `${diffInDays}d ago`;
    }
  };

  useEffect(() => {
    setTimeText(calculateTimeText());
    timerRef.current = setInterval(() => {
      setTimeText(calculateTimeText());
    }, 60000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [dateString]);

  return (
    <span 
      className="text-xs tracking-wide"
      style={{ 
        color: 'rgba(40, 28, 32, 0.5)',
        letterSpacing: '0.02em'
      }}
    >
      {timeText}
    </span>
  );
};

const NotificationSidePanel = ({ isOpen, onClose, onUnreadCountChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const userId = user?._id || user?.uid || null;
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchNotifications = useCallback(async (page = 1, append = false, options = {}) => {
    if (!isAuthenticated) {
      if (!isMountedRef.current) return;
      setNotifications([]);
      setUnreadCount(0);
      onUnreadCountChange(0);
      setHasMore(false);
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      if (!isMountedRef.current) return;
      setNotifications([]);
      setUnreadCount(0);
      onUnreadCountChange(0);
      setHasMore(false);
      return;
    }

    const { silent = false } = options;

    try {
      if (!silent) {
        setLoading(true);
      }

      const response = await notificationService.getNotifications(page, 20);

      if (!isMountedRef.current) {
        return;
      }

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
      if (!silent) {
        toast.error('Failed to load notifications');
      }
    } finally {
      if (!silent && isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [isAuthenticated, onUnreadCountChange]);

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  useEffect(() => {
    if (!isAuthenticated && isMountedRef.current) {
      setNotifications([]);
      setUnreadCount(0);
      onUnreadCountChange(0);
      setHasMore(false);
    }
  }, [isAuthenticated, onUnreadCountChange]);
  
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

  useEffect(() => {
    if (!userId) {
      return;
    }

    webSocketService.connect(userId);

    const handleNewNotification = () => {
      if (!isMountedRef.current) {
        return;
      }

      if (isOpen) {
        setCurrentPage(1);
        fetchNotifications(1, false, { silent: true });
      } else {
        setUnreadCount(prev => {
          const nextCount = prev + 1;
          onUnreadCountChange(nextCount);
          return nextCount;
        });
      }
    };

    webSocketService.onNewNotification(handleNewNotification);

    return () => {
      webSocketService.offNewNotification(handleNewNotification);
    };
  }, [userId, isOpen, fetchNotifications, onUnreadCountChange]);

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
    if (!notification.read) {
      await markAsRead(notification._id);
    }

    if (notification.type === 'order_placed' || notification.type === 'order_dispatched' || notification.type === 'order_delivered') {
      navigate(`/orders/${notification.orderNumber}`);
      onClose();
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order_placed':
        return <img src="/checkout.png" alt="Order Placed" className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'order_dispatched':
        return <img src="/market-capitalization.png" alt="Order Dispatched" className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'order_delivered':
        return <img src="/delivery-box.png" alt="Order Delivered" className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'order_cancelled':
        return <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#dc2626' }} strokeWidth={2} />;
      default:
        return <img src="/market-capitalization.png" alt="Order Update" className="w-4 h-4 sm:w-5 sm:h-5" />;
    }
  };

  const cleanText = (text) => {
    if (!text) return '';
    return text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/__/g, '')
      .replace(/_/g, '')
      .replace(/~~(.*?)~~/g, '$1')
      .replace(/`/g, '')
      // Remove emoji
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .trim();
  };

  const getDisplayText = (notification) => {
    // Remove order number, use short product name and small total amount
    if (notification.type === 'order_placed') {
      // Use only first product name, short, and small price
      let productName = '';
      if (notification.products && notification.products.length > 0) {
        productName = notification.products[0].name || '';
      } else {
        const message = notification.message || notification.title || '';
        const cleanedMessage = cleanText(message);
        const parts = cleanedMessage.split('#');
        productName = parts[0]?.trim() || 'Order';
      }
      // Truncate product name if too long
      if (productName.length > 18) productName = productName.slice(0, 15) + '...';
      return { text: productName, price: extractPrice(notification, true) };
    }
    if (notification.type === 'order_cancelled') {
      return { text: 'Order Cancelled', price: null };
    }
    // For other types, fallback to short product name and small price
    const message = notification.message || notification.title || '';
    const cleanedMessage = cleanText(message);
    const parts = cleanedMessage.split('#');
    let productName = parts[0]?.trim() || '';
    if (productName.length > 18) productName = productName.slice(0, 15) + '...';
    const fallbacks = {
      'order_dispatched': 'Order Dispatched',
      'order_delivered': 'Order Delivered'};
    return { text: productName || fallbacks[notification.type] || 'Order Update', price: extractPrice(notification, true) };
  };
  
  const extractPrice = (notification) => {
    // Optionally render price smaller
    const combinedText = `${notification.title} ${notification.message}`;
    const priceMatch = combinedText.match(/₹\s*([\d,]+(?:\.\d{2})?)/);
    if (priceMatch) {
      return <span style={{ fontSize: '0.85em', fontWeight: 500, color: '#733857' }}>₹{priceMatch[1]}</span>;
    }
    return null;
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999, pointerEvents: isOpen ? 'auto' : 'none' }}>
      <AnimatePresence mode="wait">
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              onClick={onClose}
              className="luxury-backdrop"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(40, 28, 32, 0.3)',
                backdropFilter: 'blur(4px)',
                zIndex: 59
              }}
            />
            
            {/* Side Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ 
                type: 'tween',
                duration: 0.3,
                ease: "easeInOut"
              }}
              className="luxury-shadow"
              style={{
                position: 'fixed',
                right: 0,
                top: '5rem',
                height: 'calc(100vh - 5rem)',
                width: '100%',
                backgroundColor: '#ffffff',
                zIndex: 60,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'}}
            >
            <style jsx>{`
              @media (min-width: 640px) {
                .luxury-shadow {
                  max-width: 480px !important;
                }
              }
              @media (min-width: 768px) {
                .luxury-shadow {
                  max-width: 520px !important;
                  top: 5rem !important;
                  height: calc(100vh - 5rem) !important;
                }
              }
              @media (min-width: 1024px) {
                .luxury-shadow {
                  max-width: 560px !important;
                }
              }
              @media (min-width: 1280px) {
                .luxury-shadow {
                  max-width: 600px !important;
                }
              }
              @media (max-width: 767px) {
                .luxury-shadow {
                  top: 0 !important;
                  height: 100vh !important;
                }
              }
            `}</style>
            {/* Header */}
            <div 
              className="flex items-center justify-between p-4 sm:p-6"
              style={{ 
                borderBottom: '2px solid rgba(115, 56, 87, 0.1)'
              }}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg notification-icon-container" style={{ backgroundColor: 'rgba(115, 56, 87, 0.1)' }}>
                  <Bell 
                    className="w-4 h-4 sm:w-5 sm:h-5" 
                    style={{ color: '#733857' }}
                    strokeWidth={1.5}
                  />
                </div>
                <div>
                  <h3 
                    className="text-xs sm:text-sm font-light tracking-wide uppercase luxury-text-shimmer" 
                    style={{ 
                      letterSpacing: '0.08em'
                    }}
                  >
                    NOTIFICATIONS
                  </h3>
                  {unreadCount > 0 && (
                    <p 
                      className="text-xs font-medium mt-0.5 hidden sm:block"
                      style={{ 
                        color: 'rgba(40, 28, 32, 0.6)',
                        letterSpacing: '0.05em'
                      }}
                    >
                      {unreadCount} unread update{unreadCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="notification-button text-xs font-bold tracking-widest flex items-center gap-1 sm:gap-2 transition-all duration-300 group cursor-pointer px-2 py-1 hover:opacity-80"
                    style={{ 
                      color: '#733857',
                      letterSpacing: '0.08em',
                      background: 'none',
                      border: 'none'
                    }}
                  >
                    <CheckCheck className="w-3 h-3 group-hover:scale-110 transition-transform" strokeWidth={2} />
                    <span className="hidden sm:inline">MARK ALL READ</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="notification-button p-1.5 sm:p-2 transition-all duration-300 group hover:bg-red-50 hover:text-red-600 rounded"
                  style={{ 
                    color: 'rgba(40, 28, 32, 0.4)',
                    backgroundColor: 'transparent',
                    border: 'none'
                  }}
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div 
              className="flex-1 overflow-y-auto scrollbar-hidden notification-scrollbar"
            >
              {loading && notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 sm:p-12">
                  <div className="p-3 sm:p-4 mb-3 sm:mb-4 rounded-xl elegant-loading notification-icon-container" style={{ backgroundColor: 'rgba(115, 56, 87, 0.1)' }}>
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" style={{ color: '#733857' }} strokeWidth={1.5} />
                  </div>
                  <h4 
                    className="text-xs sm:text-sm font-light tracking-wide mb-2"
                    style={{ 
                      color: '#281c20',
                      letterSpacing: '0.05em'
                    }}
                  >
                    LOADING NOTIFICATIONS
                  </h4>
                  <p 
                    className="text-xs tracking-wide text-center px-4"
                    style={{ 
                      color: 'rgba(40, 28, 32, 0.5)',
                      letterSpacing: '0.03em'
                    }}
                  >
                    Please wait while we fetch your updates
                  </p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center p-8 sm:p-12">
                  <div className="p-4 sm:p-6 mb-4 sm:mb-6 mx-auto rounded-2xl notification-icon-container" style={{ 
                    backgroundColor: 'rgba(115, 56, 87, 0.05)',
                    width: 'fit-content'
                  }}>
                    <Bell className="w-8 h-8 sm:w-12 sm:h-12" style={{ color: 'rgba(115, 56, 87, 0.3)' }} strokeWidth={1} />
                  </div>
                  <h4 
                    className="text-base sm:text-lg font-light tracking-wide mb-2 sm:mb-3"
                    style={{ 
                      color: '#281c20',
                      letterSpacing: '0.05em'
                    }}
                  >
                    ALL CAUGHT UP
                  </h4>
                  <p 
                    className="text-xs sm:text-sm tracking-wide px-4"
                    style={{ 
                      color: 'rgba(40, 28, 32, 0.5)',
                      letterSpacing: '0.03em'
                    }}
                  >
                    No new notifications at this time
                  </p>
                  <div 
                    className="mt-4 sm:mt-6 pt-3 sm:pt-4 px-4"
                    style={{ borderTop: '1px solid rgba(115, 56, 87, 0.1)' }}
                  >
                    <p 
                      className="text-xs tracking-wider"
                      style={{ 
                        color: 'rgba(40, 28, 32, 0.4)',
                        letterSpacing: '0.08em'
                      }}
                    >
                      WE'LL NOTIFY YOU WHEN SOMETHING NEW ARRIVES
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  {notifications.map((notification, index) => {
                    // Remove order number, use short product name and small price
                    const { text, price } = getDisplayText(notification);
                    const cleanedTitle = text; // Already short
                    const cleanedMessage = cleanText(notification.message);
                    return (
                      <motion.div
                        key={notification._id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.4 }}
                        className="transition-all duration-500 group cursor-pointer notification-item relative overflow-hidden"
                        style={{
                          backgroundColor: !notification.read 
                            ? 'rgba(115, 56, 87, 0.02)' 
                            : '#ffffff',
                          borderBottom: '1px solid rgba(115, 56, 87, 0.08)'}}
                        whileHover={{
                          scale: 1.01,
                          backgroundColor: 'rgba(115, 56, 87, 0.05)'}}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="p-3 sm:p-5">
                          <div className="flex items-start gap-2 sm:gap-4">
                            {/* Icon Container */}
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              {/* Header */}
                              <div className="flex items-start justify-between mb-1.5 sm:mb-2 gap-2">
                                <div className="flex-1 min-w-0">
                                  <h4 
                                    className="text-xs sm:text-sm font-medium tracking-wide break-words"
                                    style={{ 
                                      color: !notification.read ? '#281c20' : 'rgba(40, 28, 32, 0.8)',
                                      letterSpacing: '0.02em',
                                      wordBreak: 'break-word',
                                      overflowWrap: 'break-word',
                                      hyphens: 'auto'
                                    }}
                                  >
                                    {cleanedTitle}
                                  </h4>
                                  {cleanedMessage && (
                                    <p 
                                      className="text-xs mt-1 break-words"
                                      style={{ 
                                        color: 'rgba(40, 28, 32, 0.7)',
                                        letterSpacing: '0.01em',
                                        wordBreak: 'break-word',
                                        overflowWrap: 'break-word',
                                        lineHeight: '1.4'
                                      }}
                                    >
                                      {cleanedMessage}
                                    </p>
                                  )}
                                  {price && (
                                    <p 
                                      className="text-xs sm:text-sm font-bold mt-0.5"
                                      style={{ 
                                        color: '#733857',
                                        letterSpacing: '0.03em'
                                      }}
                                    >
                                      {price}
                                    </p>
                                  )}
                                </div>
                                
                                {/* Elegant Unread Indicator */}
                                {!notification.read && (
                                  <div className="relative flex-shrink-0 mt-1">
                                    <div 
                                      className="absolute inset-0 animate-pulse opacity-40"
                                      style={{
                                        background: 'radial-gradient(circle, rgba(115, 56, 87, 0.6) 0%, transparent 70%)',
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%'
                                      }}
                                    />
                                    <div 
                                      className="relative transition-all duration-300 notification-badge status-glow"
                                      style={{
                                        background: 'linear-gradient(135deg, rgba(115, 56, 87, 0.9) 0%, rgba(141, 68, 102, 0.8) 100%)',
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        border: '1px solid rgba(255, 255, 255, 0.8)'
                                      }}
                                    >
                                      <div 
                                        className="absolute top-0 left-0 w-2 h-2 opacity-60"
                                        style={{
                                          background: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.7) 0%, transparent 60%)',
                                          borderRadius: '50%'
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {/* Status & Actions */}
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2 sm:gap-3">
                                  {/* Time */}
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" style={{ color: 'rgba(40, 28, 32, 0.4)' }} strokeWidth={1.5} />
                                    <DynamicTime dateString={notification.createdAt} />
                                  </div>
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex items-center gap-1">
                                  {/* View Button */}
                                  {(notification.type === 'order_placed' || 
                                    notification.type === 'order_dispatched' || 
                                    notification.type === 'order_delivered') && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewOrderStatus(notification);
                                      }}
                                      className="luxury-button flex items-center gap-1 text-xs font-bold tracking-widest cursor-pointer px-2 sm:px-3 py-1 bg-[#733857] text-white rounded hover:bg-[#8d4466] active:translate-y-0.5 transition-all"
                                      style={{
                                        letterSpacing: '0.05em',
                                        border: 'none',
                                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 0 #562943'
                                      }}
                                    >
                                      <Eye className="w-3 h-3" strokeWidth={2} />
                                      <span className="hidden sm:inline">VIEW</span>
                                    </button>
                                  )}
                                  
                                  {/* Delete Button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteNotification(notification._id);
                                    }}
                                    className="notification-button p-1.5 transition-all duration-300 group-hover:scale-105 hover:bg-red-50 hover:text-red-600 rounded"
                                    style={{ 
                                      color: 'rgba(40, 28, 32, 0.4)',
                                      backgroundColor: 'transparent',
                                      border: 'none'
                                    }}
                                    title="Remove notification"
                                  >
                                    <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" strokeWidth={1.5} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  
                  {/* Load More */}
                  {hasMore && (
                    <div className="p-4 sm:p-6 text-center">
                      <button
                        onClick={loadMore}
                        disabled={loading}
                        className={`notification-text-only font-bold text-xs tracking-widest transition-all duration-300 group cursor-pointer ${loading ? 'opacity-50 pointer-events-none' : 'hover:opacity-80'}`}
                        style={{ 
                          color: '#733857',
                          letterSpacing: '0.1em',
                          background: 'none',
                          border: 'none'
                        }}
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2} />
                            <span>LOADING</span>
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <span>LOAD MORE UPDATES</span>
                            <Package className="w-3 h-3 group-hover:scale-110 transition-transform" strokeWidth={2} />
                          </span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Luxury Footer */}
            {notifications.length > 0 && (
              <div 
                className="p-3 sm:p-4"
                style={{ 
                  borderTop: '2px solid rgba(115, 56, 87, 0.1)'
                }}
              >
                <div className="flex items-center justify-center">
                  <p 
                    className="text-xs font-light tracking-widest text-center"
                    style={{ 
                      color: 'rgba(40, 28, 32, 0.4)',
                      letterSpacing: '0.1em'
                    }}
                  >
                    LA PATISSERIE NOTIFICATIONS
                  </p>
                </div>
              </div>
            )}
          </motion.div>

        </>
      )}
    </AnimatePresence>
    </div>
  );
};

export default NotificationSidePanel;