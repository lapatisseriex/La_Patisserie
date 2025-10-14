import React, { useState, useEffect } from 'react';
import { FaBell } from 'react-icons/fa';
import NotificationSidePanel from './NotificationSidePanel';
import notificationService from '../../services/notificationService';

const NotificationBell = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationService.getNotifications(1, 1, true);
      setUnreadCount(response.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    
    // Listen for real-time notifications
    const handleNewNotification = () => {
      fetchUnreadCount();
    };

    // Add event listener for WebSocket notifications
    window.addEventListener('newNotification', handleNewNotification);
    
    // Refresh count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('newNotification', handleNewNotification);
    };
  }, []);

  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={togglePanel}
          className="relative p-2 transition-colors"
          style={{color: '#281c20'}}
        >
          <img 
            src="/birthday.png" 
            alt="Notification Bell" 
            className="w-5 h-5 transition-all duration-300" 
          />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-[#733857] to-[#281c20] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
      
      {/* Notification Side Panel */}
      <NotificationSidePanel 
        isOpen={isPanelOpen} 
        onClose={closePanel}
        onUnreadCountChange={setUnreadCount}
      />
    </>
  );
};

export default NotificationBell;