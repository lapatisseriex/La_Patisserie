import React, { useState, useEffect } from 'react';
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
import './NotificationPanel.css';

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
        return <img src="/checkout.png" alt="Order Placed" className="w-4 h-4" />;
      case 'order_dispatched':
        return <img src="/market-capitalization.png" alt="Order Dispatched" className="w-4 h-4" />;
      case 'order_delivered':
        return <img src="/delivery-box.png" alt="Order Delivered" className="w-4 h-4" />;
      default:
        return <img src="/market-capitalization.png" alt="Order Update" className="w-4 h-4" />;
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
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(40, 28, 32, 0.5)',
                zIndex: 999998
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
              style={{
                position: 'fixed',
                right: 0,
                top: 0,
                height: '100vh',
                backgroundColor: '#ffffff',
                boxShadow: '0 32px 64px -12px rgba(40, 28, 32, 0.25), 0 0 0 1px rgba(115, 56, 87, 0.1)',
                zIndex: 999999,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
              className="w-full sm:w-96 md:w-1/2 lg:w-2/5 xl:w-1/3"
            >
            {/* Header */}
            <div 
              className="flex items-center justify-between p-6"
              style={{ 
                borderBottom: '2px solid rgba(115, 56, 87, 0.1)'
              }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(115, 56, 87, 0.1)' }}>
                  <Bell 
                    className="w-5 h-5" 
                    style={{ color: '#733857' }}
                    strokeWidth={1.5}
                  />
                </div>
                <div>
                  <h3 
                    className="text-lg font-light tracking-wide uppercase luxury-text-shimmer" 
                    style={{ 
                      letterSpacing: '0.08em',
                      fontSize: '14px'
                    }}
                  >
                    NOTIFICATIONS
                  </h3>
                  {unreadCount > 0 && (
                    <p 
                      className="text-xs font-medium mt-0.5"
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
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <span
                    onClick={markAllAsRead}
                    className="text-xs font-bold tracking-widest flex items-center gap-2 transition-all duration-300 group cursor-pointer"
                    style={{ 
                      color: '#733857',
                      letterSpacing: '0.08em'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#8d4466';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#733857';
                    }}
                  >
                    <CheckCheck className="w-3 h-3 group-hover:scale-110 transition-transform" strokeWidth={2} />
                    MARK ALL READ
                  </span>
                )}
                <button
                  onClick={onClose}
                  className="p-2 transition-all duration-300 group"
                  style={{ 
                    color: 'rgba(40, 28, 32, 0.4)',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.1)';
                    e.currentTarget.style.color = '#dc2626';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'rgba(40, 28, 32, 0.4)';
                  }}
                >
                  <X className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div 
              className="flex-1 overflow-y-auto scrollbar-hidden" 
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                WebkitScrollbar: 'none'
              }}
            >
              {loading && notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12">
                  <div className="p-4 mb-4 rounded-xl" style={{ backgroundColor: 'rgba(115, 56, 87, 0.1)' }}>
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#733857' }} strokeWidth={1.5} />
                  </div>
                  <h4 
                    className="text-sm font-light tracking-wide mb-2"
                    style={{ 
                      color: '#281c20',
                      letterSpacing: '0.05em'
                    }}
                  >
                    LOADING NOTIFICATIONS
                  </h4>
                  <p 
                    className="text-xs tracking-wide"
                    style={{ 
                      color: 'rgba(40, 28, 32, 0.5)',
                      letterSpacing: '0.03em'
                    }}
                  >
                    Please wait while we fetch your updates
                  </p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center p-12">
                  <div className="p-6 mb-6 mx-auto rounded-2xl" style={{ 
                    backgroundColor: 'rgba(115, 56, 87, 0.05)',
                    width: 'fit-content'
                  }}>
                    <Bell className="w-12 h-12" style={{ color: 'rgba(115, 56, 87, 0.3)' }} strokeWidth={1} />
                  </div>
                  <h4 
                    className="text-lg font-light tracking-wide mb-3"
                    style={{ 
                      color: '#281c20',
                      letterSpacing: '0.05em'
                    }}
                  >
                    ALL CAUGHT UP
                  </h4>
                  <p 
                    className="text-sm tracking-wide"
                    style={{ 
                      color: 'rgba(40, 28, 32, 0.5)',
                      letterSpacing: '0.03em'
                    }}
                  >
                    No new notifications at this time
                  </p>
                  <div 
                    className="mt-6 pt-4"
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
                    const { text, price } = getDisplayText(notification);
                    
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
                          borderBottom: '1px solid rgba(115, 56, 87, 0.08)',
                          borderLeft: 'none'
                        }}
                        whileHover={{
                          scale: 1.02,
                          boxShadow: '0 8px 25px rgba(115, 56, 87, 0.15)',
                          backgroundColor: 'rgba(115, 56, 87, 0.08)',
                          borderLeft: 'none'
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="p-5">
                          <div className="flex items-start gap-4">
                            {/* Icon Container */}
                            <div className="flex-shrink-0">
                              {getNotificationIcon(notification.type)}
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              {/* Header */}
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 pr-2">
                                  <h4 
                                    className="text-sm font-medium truncate tracking-wide"
                                    style={{ 
                                      color: !notification.read ? '#281c20' : 'rgba(40, 28, 32, 0.8)',
                                      letterSpacing: '0.02em'
                                    }}
                                  >
                                    {text}
                                  </h4>
                                  {price && (
                                    <p 
                                      className="text-sm font-bold mt-0.5"
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
                                    {/* Subtle pulsing glow */}
                                    <div 
                                      className="absolute inset-0 animate-pulse opacity-40"
                                      style={{
                                        background: 'radial-gradient(circle, rgba(115, 56, 87, 0.6) 0%, transparent 70%)',
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%'
                                      }}
                                    />
                                    {/* Main elegant dot */}
                                    <div 
                                      className="relative transition-all duration-300"
                                      style={{
                                        background: 'linear-gradient(135deg, rgba(115, 56, 87, 0.9) 0%, rgba(141, 68, 102, 0.8) 100%)',
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        border: '1px solid rgba(255, 255, 255, 0.8)',
                                        boxShadow: '0 1px 3px rgba(115, 56, 87, 0.3)'
                                      }}
                                    >
                                      {/* Subtle inner shine */}
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
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {/* Status PNG Icon */}
                                  <div className="flex items-center">
                                    {(() => {
                                      switch (notification.type) {
                                        case 'order_placed':
                                          return <img src="/checkout.png" alt="Order Placed" className="w-3 h-3" />;
                                        case 'order_dispatched':
                                          return <img src="/market-capitalization.png" alt="Order Dispatched" className="w-3 h-3" />;
                                        case 'order_delivered':
                                          return <img src="/delivery-box.png" alt="Order Delivered" className="w-3 h-3" />;
                                        default:
                                          return <img src="/images/status/order-update.png" alt="Order Update" className="w-3 h-3" />;
                                      }
                                    })()}
                                  </div>
                                  
                                  {/* Time */}
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" style={{ color: 'rgba(40, 28, 32, 0.4)' }} strokeWidth={1.5} />
                                    <span 
                                      className="text-xs tracking-wide"
                                      style={{ 
                                        color: 'rgba(40, 28, 32, 0.5)',
                                        letterSpacing: '0.02em'
                                      }}
                                    >
                                      {formatDate(notification.createdAt)}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex items-center gap-1">
                                  {/* View Text Link */}
                                  {(notification.type === 'order_placed' || 
                                    notification.type === 'order_dispatched' || 
                                    notification.type === 'order_delivered') && (
                                    <span
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewOrderStatus(notification);
                                      }}
                                      className="flex items-center gap-1 text-xs font-bold tracking-widest transition-all duration-300 group-hover:scale-105 cursor-pointer"
                                      style={{
                                        color: '#733857',
                                        letterSpacing: '0.05em'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.color = '#8d4466';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.color = '#733857';
                                      }}
                                    >
                                      <Eye className="w-3 h-3" strokeWidth={2} />
                                      VIEW
                                    </span>
                                  )}
                                  
                                  {/* Delete Button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteNotification(notification._id);
                                    }}
                                    className="p-1.5 transition-all duration-300 group-hover:scale-105"
                                    style={{ 
                                      color: 'rgba(40, 28, 32, 0.4)',
                                      backgroundColor: 'transparent'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.1)';
                                      e.currentTarget.style.color = '#dc2626';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                      e.currentTarget.style.color = 'rgba(40, 28, 32, 0.4)';
                                    }}
                                    title="Remove notification"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  
                  {/* Load More Text Link */}
                  {hasMore && (
                    <div className="p-6 text-center">
                      <span
                        onClick={loadMore}
                        className={`font-bold text-xs tracking-widest transition-all duration-300 group cursor-pointer ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                        style={{ 
                          color: '#733857',
                          letterSpacing: '0.1em'
                        }}
                        onMouseEnter={(e) => {
                          if (!loading) {
                            e.currentTarget.style.color = '#8d4466';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!loading) {
                            e.currentTarget.style.color = '#733857';
                          }
                        }}
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2} />
                            <span>LOADING</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <span>LOAD MORE UPDATES</span>
                            <Package className="w-3 h-3 group-hover:scale-110 transition-transform" strokeWidth={2} />
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Luxury Footer */}
            {notifications.length > 0 && (
              <div 
                className="p-4"
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