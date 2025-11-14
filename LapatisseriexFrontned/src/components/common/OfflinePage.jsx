import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Home } from 'lucide-react';

const OfflinePage = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Automatically redirect when connection is restored
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const goHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-[calc(100vh-200px)] bg-white flex items-center justify-center p-3 sm:p-4 md:p-6" style={{fontFamily: 'sans-serif'}}>
      <div className="max-w-xl lg:max-w-2xl w-full text-center px-2 sm:px-4">
        {/* Offline Illustration */}
        <div className="mb-6 sm:mb-8">
          <img 
            src="/images/offline-illustration.png" 
            alt="Offline illustration" 
            className="w-48 h-36 sm:w-64 sm:h-48 md:w-80 md:h-60 lg:w-96 lg:h-72 mx-auto object-contain"
            onError={(e) => {
              // Fallback if image fails to load
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          {/* Fallback visual element */}
          <div 
            className="w-48 h-36 sm:w-64 sm:h-48 md:w-80 md:h-60 lg:w-96 lg:h-72 mx-auto rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center text-4xl sm:text-5xl md:text-6xl"
            style={{
              display: 'none',
              backgroundColor: '#f8fafc',
              border: '2px dashed #cbd5e1',
              color: '#64748b'
            }}
          >
            📡
          </div>
        </div>

        {/* Status Messages */}
        {isOnline ? (
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-normal mb-3 sm:mb-4 px-2" style={{color: '#281c20', fontFamily: 'sans-serif'}}>
              Connection Restored!
            </h1>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 sm:px-6 sm:py-2.5 md:px-8 md:py-3 rounded-lg font-normal text-sm sm:text-base text-white hover:opacity-90 transition-all duration-200 active:scale-95"
              style={{ backgroundColor: '#281c20', fontFamily: 'sans-serif' }}
            >
              Continue
            </button>
          </div>
        ) : (
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-normal mb-4 sm:mb-6 md:mb-8 px-2" style={{color: '#281c20', fontFamily: 'sans-serif'}}>
              No Internet Connection
            </h1>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`px-5 py-2 sm:px-6 sm:py-2.5 md:px-8 md:py-3 rounded-lg font-normal text-sm sm:text-base transition-all duration-200 active:scale-95 ${
                isRefreshing
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'text-white hover:opacity-90'
              }`}
              style={{
                backgroundColor: isRefreshing ? undefined : '#281c20',
                fontFamily: 'sans-serif'
              }}
            >
              {isRefreshing ? 'Refreshing...' : 'Try Again'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfflinePage;