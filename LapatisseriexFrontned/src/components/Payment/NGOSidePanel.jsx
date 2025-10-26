import { useState, useEffect } from 'react';
import { X, Heart, Sparkles } from 'lucide-react';
import NGODonation from './NGODonation';

const NGOSidePanel = ({ isOpen, onClose }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      // Prevent body scroll when panel is open
      document.body.style.overflow = 'hidden';
    } else {
      // Re-enable body scroll when panel is closed
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen && !isAnimating) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        } touch-manipulation`}
        onClick={onClose}
        onTransitionEnd={() => {
          if (!isOpen) setIsAnimating(false);
        }}
        role="button"
        aria-label="Close side panel"
      />

      {/* Side Panel */}
      <div
        className={`fixed top-0 left-0 h-full w-full sm:w-[90%] md:w-[70%] lg:w-[520px] xl:w-[580px] bg-white z-50 shadow-2xl transition-transform duration-500 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Decorative Header Border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#733857] to-transparent" />
        
        {/* Close Button - Creative Design */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 group"
          aria-label="Close panel"
        >
          <div className="relative">
            {/* Animated background circle */}
            <div className="absolute inset-0 bg-[#733857] rounded-full scale-0 group-hover:scale-100 transition-transform duration-300" />
            
            {/* Close icon */}
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center border-2 border-[#733857] bg-white group-hover:bg-[#733857] group-hover:border-white transition-all duration-300 rounded-full">
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-[#733857] group-hover:text-white transition-colors duration-300" />
            </div>
            
            {/* Sparkle effect on hover */}
            <Sparkles className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 text-[#cf91d9] opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-300" />
          </div>
        </button>

        {/* Panel Header */}
        <div className="sticky top-0 bg-white border-b-2 border-gray-200 px-4 py-4 sm:px-6 sm:py-5 z-10">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-[#733857] fill-[#733857] animate-pulse" />
              <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-[#cf91d9] rounded-full animate-ping" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-light tracking-wide" style={{ color: '#281c20', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                கற்பிப்போம் (Karpippom)
              </h2>
              <p className="text-sm sm:text-base font-normal tracking-wide" style={{ color: '#555', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                To Teach. To Empower. To Transform Lives.
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="h-[calc(100%-75px)] sm:h-[calc(100%-85px)] overflow-y-auto overscroll-contain scroll-smooth webkit-overflow-scrolling-touch">
          <div className="p-4 sm:p-6">
            <NGODonation />
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#733857] via-[#cf91d9] to-[#f2a9ce]" />
      </div>
    </>
  );
};

export default NGOSidePanel;
