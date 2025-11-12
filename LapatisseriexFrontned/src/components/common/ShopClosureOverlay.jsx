import React from 'react';
import { Clock } from 'lucide-react';
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
          <div className={`min-h-screen px-6 py-12 sm:px-10 lg:px-16 ${className}`} style={{  }}>
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-12">
              <div className="flex flex-col items-center gap-3 text-center">
                <img src="/images/logo.png" alt="La Patisserie" className="h-12 w-auto" />
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#733857]">
                  La Patisserie
                </p>
              </div>

              <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1fr),minmax(0,1fr)] md:gap-12">
                <img
                  src="/images/closed.png"
                  alt="Shop temporarily closed illustration"
                  className="w-full max-w-md justify-self-center md:max-w-lg md:justify-self-start"
                  loading="lazy"
                />

                <div className="w-full  p-8 text-center sm:p-10 md:text-left">
                  <h2 className="text-2xl font-semibold uppercase tracking-[0.2em] text-[#1a1a1a] sm:text-3xl">
                    We&apos;re taking a short pause
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-[#6f5260] sm:text-base">
                    Our dessert kitchen is currently closed for orders while we prep the next batch of sweet creations.
                    Thank you for your patience!
                  </p>
                  {formattedOpen && (
                    <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-[#8d4466]">
                      Back whisks up at <span className="text-[#733857]">{formattedOpen}</span>
                    </p>
                  )}
                  <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center md:justify-start">
                    <button
                      onClick={() => window.location.href = '/'}
                      className="w-full border border-[#733857] px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#733857] transition hover:bg-[#733857] hover:text-white sm:w-auto"
                    >
                      Browse the collection
                    </button>
                    <button
                      onClick={() => window.location.href = '/newsletter'}
                      className="w-full border border-transparent bg-[#733857] px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#5e2c46] sm:w-auto"
                    >
                      Notify me when open
                    </button>
                  </div>
                </div>
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