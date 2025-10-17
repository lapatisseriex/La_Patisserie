import React, { createContext, useContext, useState, useEffect } from 'react';

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
    currentTime: null,
    timezone: 'Asia/Kolkata',
    loading: true
  });
  
  const [lastFetch, setLastFetch] = useState(0);
  const CACHE_DURATION = 30 * 1000; // 30 seconds cache (reduced from 1 minute)

  // Fetch shop status from backend
  const fetchShopStatus = async (forceRefresh = false) => {
    try {
      const now = Date.now();
      
      // Use cache if data is fresh and not forced refresh
      if (!forceRefresh && now - lastFetch < CACHE_DURATION && !shopStatus.loading) {
        return shopStatus;
      }

      console.log('ShopStatus: Fetching shop status from API...');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://la-patisserie.onrender.com/api'}/time-settings/status`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check content type first to avoid JSON parse errors on non-JSON responses
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        // Try to read text for better debugging
        const text = await response.text();
        console.error('ShopStatus: Expected JSON response but received:', text);
        setShopStatus(prev => ({ ...prev, loading: false }));
        return shopStatus;
      }

      let data;
      try {
        data = await response.json();
      } catch (err) {
        // If parse fails, capture text and bail gracefully
        const text = await response.text();
        console.error('ShopStatus: Failed to parse JSON response:', err, text);
        setShopStatus(prev => ({ ...prev, loading: false }));
        return shopStatus;
      }

      // Defensive checks - ensure shape exists before accessing data.data
      if (data && data.success && data.data && typeof data.data === 'object') {
        const newStatus = {
          isOpen: !!data.data.isOpen,
          nextOpeningTime: data.data.nextOpeningTime || null,
          currentTime: data.data.currentTime || null,
          timezone: data.data.timezone || shopStatus.timezone,
          loading: false
        };

        setShopStatus(newStatus);
        setLastFetch(now);

        console.log('ShopStatus: Updated shop status:', newStatus);
        return newStatus;
      } else {
        console.error('ShopStatus: API returned unexpected payload:', data);
        setShopStatus(prev => ({ ...prev, loading: false }));
        return shopStatus;
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

  // Manual refresh function
  const refreshShopStatus = () => {
    setLastFetch(0); // Clear cache
    fetchShopStatus();
  };

  // Force immediate status check (for cart/order actions)
  const checkShopStatusNow = async () => {
    try {
      console.log('ShopStatus: Force checking shop status...');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://la-patisserie.onrender.com/api'}/time-settings/status`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        console.error('ShopStatus (force): Expected JSON response but received:', text);
        return shopStatus;
      }

      let data;
      try {
        data = await response.json();
      } catch (err) {
        const text = await response.text();
        console.error('ShopStatus (force): Failed to parse JSON response:', err, text);
        return shopStatus;
      }

      if (data && data.success && data.data && typeof data.data === 'object') {
        const newStatus = {
          isOpen: !!data.data.isOpen,
          nextOpeningTime: data.data.nextOpeningTime || null,
          currentTime: data.data.currentTime || null,
          timezone: data.data.timezone || shopStatus.timezone,
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
    
    // Helper functions
    isProductAvailable: () => shopStatus.isOpen,
    shouldShowSection: () => shopStatus.isOpen,
    getClosureMessage: () => {
      if (shopStatus.isOpen) return null;
      return shopStatus.nextOpeningTime 
        ? `Currently Closed - Opens ${shopStatus.nextOpeningTime}`
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