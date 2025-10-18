import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import webSocketService from '../../services/websocketService.js';

// Create Shop Status Context
const ShopStatusContext = createContext();

// Custom hook to use shop status
export const useShopStatus = () => {
  const context = useContext(ShopStatusContext);
  if (!context) {
    throw new Error('useShopStatus must be used within a ShopStatusProvider');
  }
  return context;
};

// Shop Status Provider Component
export const ShopStatusProvider = ({ children }) => {
  const [shopStatus, setShopStatus] = useState({
    isOpen: true, // Default to open while loading
    nextOpeningTime: null,
    closingTime: null,
    currentTime: null,
    timezone: 'Asia/Kolkata',
    operatingHours: null,
    loading: true
  });
  
  const [lastFetch, setLastFetch] = useState(0);
  const CACHE_DURATION = 30 * 1000; // 30 seconds cache (reduced from 1 minute)

  // Toast styling to match site palette (header/products/orders)
  // Styling is now handled by toast-custom.css for consistency
  const getToastOptions = (variant = 'open') => {
    return {
      containerId: 'app-toasts',
      icon: variant === 'open' ? '🟢' : '🔒',
      autoClose: 3200,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    };
  };

  const formatNextOpening = (iso, tz = 'Asia/Kolkata') => {
    if (!iso) return null;
    try {
      const date = new Date(iso);
      const now = new Date();
      const todayStr = now.toLocaleDateString('en-CA', { timeZone: tz });
      const dateStr = date.toLocaleDateString('en-CA', { timeZone: tz });
      const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: tz });
      if (todayStr === dateStr) return `at ${timeStr}`;
      const weekday = date.toLocaleDateString('en-US', { weekday: 'short', timeZone: tz });
      return `${weekday} ${timeStr}`;
    } catch {
      return null;
    }
  };

  // Fetch shop status from backend
  const fetchShopStatus = async (forceRefresh = false) => {
    try {
      const now = Date.now();
      
      // Use cache if data is fresh and not forced refresh
      if (!forceRefresh && now - lastFetch < CACHE_DURATION && !shopStatus.loading) {
        return shopStatus;
      }

      console.log('ShopStatus: Fetching shop status from API...');
      
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const response = await fetch(`${apiBase}/time-settings/status`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.shopStatus) {
        const s = data.shopStatus;
        const newStatus = {
          isOpen: s.isOpen,
          nextOpeningTime: s.nextOpenTime || null,
          closingTime: s.closingTime || null,
          currentTime: s.currentTime || null,
          timezone: s.timezone || 'Asia/Kolkata',
          operatingHours: s.operatingHours || null,
          loading: false
        };
        
        setShopStatus(newStatus);
        setLastFetch(now);
        
        console.log('ShopStatus: Updated shop status:', newStatus);
      } else {
        console.error('ShopStatus: API returned error:', data.message);
        setShopStatus(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('ShopStatus: Error fetching shop status:', error);
      // On error, assume shop is open to not block functionality
      setShopStatus(prev => ({ 
        ...prev, 
        loading: false,
        isOpen: true 
      }));
    }
  };

  // Initial fetch and periodic updates
  useEffect(() => {
    fetchShopStatus();
    
    // Update every 5 minutes
    const interval = setInterval(fetchShopStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Subscribe to realtime shop status updates via WebSocket
  useEffect(() => {
    // Ensure socket is connected even for anonymous users for shop status
    if (!webSocketService.isConnected()) {
      webSocketService.connect(null);
    }

    const handleShopStatus = (status) => {
      const newStatus = {
        isOpen: !!status.isOpen,
        nextOpeningTime: status.nextOpenTime || null,
        closingTime: status.closingTime || null,
        currentTime: status.currentTime || null,
        timezone: status.timezone || 'Asia/Kolkata',
        operatingHours: status.operatingHours || null,
        loading: false
      };
      setShopStatus(newStatus);
      setLastFetch(Date.now());
    };

    webSocketService.onShopStatusUpdate(handleShopStatus);
    return () => webSocketService.offShopStatusUpdate(handleShopStatus);
  }, []);

  // Show toast when shop status flips (closed -> open or open -> closed)
  const prevOpenRef = useRef(null);
  const initialToastShownRef = useRef(false);
  useEffect(() => {
    if (shopStatus.loading) return;
    if (prevOpenRef.current === null) {
      // First resolved status on landing: show a one-time toast
      if (!initialToastShownRef.current) {
        if (shopStatus.isOpen) {
          const formattedClose = formatNextOpening(shopStatus.closingTime, shopStatus.timezone);
          toast.success(
            formattedClose ? `We're open. Closes ${formattedClose}` : "We're open.",
            getToastOptions('open')
          );
        } else {
          const formattedOpen = formatNextOpening(shopStatus.nextOpeningTime, shopStatus.timezone);
          toast.info(
            formattedOpen ? `We're closed. Opens ${formattedOpen}` : "We're closed.",
            getToastOptions('closed')
          );
        }
        initialToastShownRef.current = true;
      }
      prevOpenRef.current = shopStatus.isOpen;
      return;
    }
    if (prevOpenRef.current !== shopStatus.isOpen) {
      if (shopStatus.isOpen) {
        const formattedClose = formatNextOpening(shopStatus.closingTime, shopStatus.timezone);
        toast.success(
          formattedClose ? `We're now open! Closes ${formattedClose}` : "We're now open!",
          getToastOptions('open')
        );
      } else {
        const formatted = formatNextOpening(shopStatus.nextOpeningTime, shopStatus.timezone);
        toast.info(
          formatted ? `We're now closed. Opens ${formatted}` : "We're now closed.",
          getToastOptions('closed')
        );
      }
      prevOpenRef.current = shopStatus.isOpen;
    }
  }, [shopStatus.isOpen, shopStatus.loading, shopStatus.nextOpeningTime, shopStatus.closingTime, shopStatus.timezone]);

  // Manual refresh function
  const refreshShopStatus = () => {
    setLastFetch(0); // Clear cache
    fetchShopStatus();
  };

  // Force immediate status check (for cart/order actions)
  const checkShopStatusNow = async () => {
    try {
      console.log('ShopStatus: Force checking shop status...');
      
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const response = await fetch(`${apiBase}/time-settings/status`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.shopStatus) {
        const s = data.shopStatus;
        const newStatus = {
          isOpen: s.isOpen,
          nextOpeningTime: s.nextOpenTime || null,
          closingTime: s.closingTime || null,
          currentTime: s.currentTime || null,
          timezone: s.timezone || 'Asia/Kolkata',
          loading: false
        };
        
        // Update immediately without cache
        setShopStatus(newStatus);
        setLastFetch(Date.now());
        
        console.log('ShopStatus: Force updated shop status:', newStatus);
        return newStatus;
      }
    } catch (error) {
      console.error('ShopStatus: Error in force check:', error);
    }
    return shopStatus;
  };

  const contextValue = {
    ...shopStatus,
    refreshShopStatus,
    checkShopStatusNow,
    formatNextOpening,
    
    // Helper functions
    isProductAvailable: () => shopStatus.isOpen,
    shouldShowSection: () => shopStatus.isOpen,
    getClosureMessage: () => {
      if (shopStatus.isOpen) return null;
      const formatted = formatNextOpening(shopStatus.nextOpeningTime, shopStatus.timezone);
      return formatted 
        ? `Currently Closed — Opens ${formatted}`
        : 'Currently Closed';
    }
  };

  return (
    <ShopStatusContext.Provider value={contextValue}>
      {children}
    </ShopStatusContext.Provider>
  );
};

export default ShopStatusContext;