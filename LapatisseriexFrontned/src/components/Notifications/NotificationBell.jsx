import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStar } from 'react-icons/fa';
import NotificationSidePanel from './NotificationSidePanel';
import notificationService from '../../services/notificationService';
import webSocketService from '../../services/websocketService';
import { useAuth } from '../../hooks/useAuth';


const NotificationBell = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const lastUnreadCountRef = useRef(0);
  const pulseTimeoutRef = useRef(null);

  const handleUnreadCountChange = useCallback((count) => {
    setUnreadCount(count);
    lastUnreadCountRef.current = count;
  }, []);

  const clearPulseTimeout = () => {
    if (pulseTimeoutRef.current) {
      clearTimeout(pulseTimeoutRef.current);
      pulseTimeoutRef.current = null;
    }
  };

  const triggerPulse = useCallback(() => {
    setHasNewNotification(true);
    clearPulseTimeout();
    pulseTimeoutRef.current = setTimeout(() => {
      setHasNewNotification(false);
      pulseTimeoutRef.current = null;
    }, 2000);
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      handleUnreadCountChange(0);
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      handleUnreadCountChange(0);
      return;
    }

    try {
      const response = await notificationService.getNotifications(1, 1, true);
      const newUnreadCount = response.unreadCount || 0;

      if (newUnreadCount > lastUnreadCountRef.current && lastUnreadCountRef.current > 0) {
        triggerPulse();
      }

      handleUnreadCountChange(newUnreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [isAuthenticated, triggerPulse, handleUnreadCountChange]);

  useEffect(() => {
    const userId = user?._id || user?.uid || null;
    webSocketService.connect(userId);

    fetchUnreadCount();

    const handleNewNotification = () => {
      triggerPulse();
      fetchUnreadCount();
    };

    webSocketService.onNewNotification(handleNewNotification);

    const interval = isAuthenticated ? setInterval(fetchUnreadCount, 30000) : null;

    return () => {
      if (interval) {
        clearInterval(interval);
      }
      webSocketService.offNewNotification(handleNewNotification);
    };
  }, [user?._id, user?.uid, isAuthenticated, fetchUnreadCount, triggerPulse]);

  useEffect(() => () => {
    clearPulseTimeout();
  }, []);

  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
  };

  return (
    <>
      <div className="relative group">
        <motion.button
          onClick={togglePanel}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="notification-bell-premium relative p-3 transition-all duration-300"
          style={{
            background: '#ffffff',
            boxShadow: isHovered 
              ? '0 4px 16px rgba(115, 56, 87, 0.1)' 
              : '0 2px 8px rgba(40, 28, 32, 0.05)'
          }}
          whileHover={{ 
            scale: 1.05,
            y: -1
          }}
          whileTap={{ 
            scale: 0.95 
          }}
        >
          {/* Premium Bell Icon */}
          <motion.div
            className="relative"
            animate={hasNewNotification ? { 
              rotate: [0, 15, -15, 15, -15, 0],
              scale: [1, 1.1, 1]
            } : {}}
            transition={{ duration: 0.6 }}
          >
            <img 
              src="/birthday.png" 
              alt="Notification Bell" 
              className="w-5 h-5 transition-all duration-300 filter drop-shadow-sm" 
              style={{
                filter: isHovered 
                  ? 'drop-shadow(0 2px 4px rgba(115, 56, 87, 0.3)) brightness(1.1)' 
                  : 'drop-shadow(0 1px 2px rgba(40, 28, 32, 0.2))'
              }}
            />
            
            {/* Luxury glow effect */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 bg-gradient-to-r from-[#733857]/20 to-[#8d4466]/20 blur-sm -z-10"
                />
              )}
            </AnimatePresence>
          </motion.div>

          {/* Premium Badge */}
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -top-1 -right-1"
              >
                <div
                  className="premium-badge rounded-full bg-gradient-to-r from-[#733857] to-[#281c20] text-white text-xs h-5 w-5 flex items-center justify-center font-bold shadow-lg relative overflow-hidden"
                  style={{
                 
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 2px 8px rgba(115, 56, 87, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                  
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: [-100, 100] }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 2,
                      ease: "easeInOut" 
                    }}
                  />
                  
                  {/* Pulse animation for new notifications */}
                  {hasNewNotification && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-[#ffd700]/30"
                      animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: 2,
                        ease: "easeOut" 
                      }}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating sparkles on hover */}
          <AnimatePresence>
            {isHovered && (
              <>
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute pointer-events-none"
                    initial={{ 
                      scale: 0, 
                      x: 0, 
                      y: 0, 
                      opacity: 0 
                    }}
                    animate={{ 
                      scale: [0, 1, 0], 
                      x: [-10 + i * 10, -15 + i * 15], 
                      y: [-10 - i * 5, -20 - i * 8], 
                      opacity: [0, 1, 0] 
                    }}
                    transition={{ 
                      duration: 1.5, 
                      delay: i * 0.2,
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                    style={{
                      left: '50%',
                      top: '50%'
                    }}
                  >
                    <FaStar 
                      className="text-[#ffd700] text-xs" 
                      style={{
                        filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.6))'
                      }}
                    />
                  </motion.div>
                ))}
              </>
            )}
          </AnimatePresence>

          {/* Hover tooltip - Hidden on mobile */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="hidden md:block absolute -bottom-12 left-1/2 transform -translate-x-1/2 px-3 py-1 text-xs font-medium text-white shadow-lg pointer-events-none z-50"
                style={{
                  background: 'linear-gradient(135deg, #281c20 0%, #412434 100%)',
                  border: '1px solid rgba(115, 56, 87, 0.3)'
                }}
              >
                {unreadCount > 0 ? `${unreadCount} new notification${unreadCount > 1 ? 's' : ''}` : 'Notifications'}
                <div 
                  className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45"
                  style={{
                    background: 'linear-gradient(135deg, #281c20 0%, #412434 100%)',
                    border: '1px solid rgba(115, 56, 87, 0.3)'
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
      
      {/* Notification Side Panel */}
      <NotificationSidePanel 
        isOpen={isPanelOpen} 
        onClose={closePanel}
        onUnreadCountChange={handleUnreadCountChange}
      />
    </>
  );
};

export default NotificationBell;