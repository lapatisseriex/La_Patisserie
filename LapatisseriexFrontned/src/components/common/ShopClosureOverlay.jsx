import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { useShopStatus } from '../../context/ShopStatusContext';

const ShopClosureOverlay = ({ 
  children, 
  showWhenClosed = true, 
  className = '', 
  overlayType = 'section' // 'section', 'button', 'page'
}) => {
  const { isOpen, nextOpeningTime, timezone, formatNextOpening } = useShopStatus();
  const formattedOpen = formatNextOpening?.(nextOpeningTime, timezone) || null;

  if (isOpen) {
    return children;
  }

  if (!showWhenClosed) {
    return null;
  }

  const renderOverlay = () => {
    switch (overlayType) {
      case 'button':
        return (
          <div className={`relative ${className}`}>
            <div className="opacity-50 pointer-events-none">
              {children}
            </div>
            <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center rounded-lg">
              <div className="text-white text-center">
                <Clock className="h-5 w-5 mx-auto mb-1" />
                <span className="text-xs">Closed</span>
              </div>
            </div>
          </div>
        );

      case 'page':
        return (
          <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${className}`}>
            <div className="max-w-md mx-auto text-center p-8">
              <div className="bg-white rounded-xl shadow-lg p-8">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Shop Currently Closed</h2>
                <p className="text-gray-600 mb-4">
                  We're currently closed and not accepting orders.
                </p>
                {formattedOpen && (
                  <p className="text-sm text-gray-500">
                    We'll reopen <span className="font-medium text-gray-700">{formattedOpen}</span>
                  </p>
                )}
                <button 
                  onClick={() => window.location.href = '/'}
                  className="mt-4 bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition-colors"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        );

      case 'section':
      default:
        return (
          <div className={`relative ${className}`}>
            <div className="opacity-30">
              {children}
            </div>
            <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="bg-white rounded-lg p-6 max-w-sm mx-4 text-center shadow-xl">
                <Clock className="h-12 w-12 text-red-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Section Unavailable
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  This section is not available while the shop is closed.
                </p>
                {formattedOpen && (
                  <p className="text-xs text-gray-500">
                    Available again <span className="font-medium">{formattedOpen}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return renderOverlay();
};

export default ShopClosureOverlay;