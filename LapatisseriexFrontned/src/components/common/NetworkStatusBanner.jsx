import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, X } from 'lucide-react';
import useNetworkStatus from '../../hooks/useNetworkStatus';

const NetworkStatusBanner = () => {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [showBanner, setShowBanner] = useState(false);
  const [bannerType, setBannerType] = useState('offline'); // 'offline' or 'reconnected'

  useEffect(() => {
    if (!isOnline) {
      // Show offline banner
      setBannerType('offline');
      setShowBanner(true);
    } else if (wasOffline && isOnline) {
      // Show reconnected banner temporarily
      setBannerType('reconnected');
      setShowBanner(true);
      
      // Auto-hide reconnected banner after 3 seconds
      const timer = setTimeout(() => {
        setShowBanner(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    } else {
      setShowBanner(false);
    }
  }, [isOnline, wasOffline]);

  const handleDismiss = () => {
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 text-white`}
      style={{
        backgroundColor: bannerType === 'offline' ? '#dc2626' : '#16a34a',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <div className="flex items-center justify-between px-4 py-2 max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {bannerType === 'offline' ? (
              <WifiOff className="w-5 h-5" />
            ) : (
              <Wifi className="w-5 h-5" />
            )}
          </div>
          
          <div className="flex-1">
            {bannerType === 'offline' ? (
              <div>
                <p className="text-sm font-medium">
                  No Internet Connection
                </p>
                <p className="text-xs opacity-90">
                  Some features may not be available. Please check your connection.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium">
                  Connection Restored
                </p>
                <p className="text-xs opacity-90">
                  You're back online! All features are now available.
                </p>
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 hover:bg-black/10 rounded transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default NetworkStatusBanner;