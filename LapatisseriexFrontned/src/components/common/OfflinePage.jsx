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
    <div className="min-h-[calc(100vh-200px)] bg-white flex items-center justify-center p-4" style={{fontFamily: 'sans-serif'}}>
      <div className="max-w-2xl w-full text-center">
        {/* Offline Illustration */}
        <div className="mb-8">
          <img 
            src="/images/offline-illustration.png" 
            alt="Offline illustration" 
            className="w-96 h-72 mx-auto object-contain"
            onError={(e) => {
              // Fallback if image fails to load
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          {/* Fallback visual element */}
          <div 
            className="w-96 h-72 mx-auto rounded-2xl flex items-center justify-center text-6xl"
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
          <div className="mb-6">
            <h1 className="text-3xl font-normal mb-4" style={{color: '#281c20', fontFamily: 'sans-serif'}}>
              Connection Restored!
            </h1>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 rounded-lg font-normal text-white hover:opacity-90 transition-all duration-200"
              style={{ backgroundColor: '#281c20', fontFamily: 'sans-serif' }}
            >
              Continue
            </button>
          </div>
        ) : (
          <div className="mb-6">
            <h1 className="text-3xl font-normal mb-8" style={{color: '#281c20', fontFamily: 'sans-serif'}}>
              No Internet Connection
            </h1>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`px-8 py-3 rounded-lg font-normal transition-all duration-200 ${
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