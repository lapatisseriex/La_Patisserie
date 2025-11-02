import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to monitor network status
 * Provides real-time network connectivity information
 */
const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  // Handle online event
  const handleOnline = useCallback(() => {
    setIsOnline(true);
    // Track if user was previously offline (for showing reconnection messages)
    if (wasOffline) {
      setWasOffline(false);
      // Optional: Trigger any reconnection logic here
      console.log('Connection restored');
    }
  }, [wasOffline]);

  // Handle offline event
  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setWasOffline(true);
    console.log('Connection lost');
  }, []);

  useEffect(() => {
    // Add event listeners for online/offline status
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup listeners on unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  // Additional method to check connectivity with a ping
  const checkConnectivity = async () => {
    try {
      // Try to fetch a small resource to verify actual connectivity
      const response = await fetch('/favicon.ico?t=' + Date.now(), {
        method: 'HEAD',
        cache: 'no-store',
        timeout: 5000
      });
      
      const isConnected = response.ok;
      setIsOnline(isConnected);
      return isConnected;
    } catch (error) {
      setIsOnline(false);
      return false;
    }
  };

  return {
    isOnline,
    wasOffline,
    checkConnectivity
  };
};

export default useNetworkStatus;