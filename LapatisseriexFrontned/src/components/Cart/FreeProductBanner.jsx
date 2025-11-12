import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import { checkFreeProductEligibility, getFreeProductProgress } from '../../services/freeProductService';
import { useCart } from '../../hooks/useCart';

const FreeProductBanner = ({ onSelectFreeProduct }) => {
  const [eligibility, setEligibility] = useState(null);
  const [progress, setProgress] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const { cartItems } = useCart();

  // Check if cart has a free product
  const hasFreeProductInCart = cartItems?.some(item => item.isFreeProduct);

  const fetchEligibilityData = async (isInitial = false) => {
    try {
      // Only show loading state on initial fetch to prevent flickering
      if (isInitial) {
        setInitialLoading(true);
      }
      
      const [eligibilityRes, progressRes] = await Promise.all([
        checkFreeProductEligibility(),
        getFreeProductProgress()
      ]);

      if (eligibilityRes.success) {
        setEligibility(eligibilityRes.data);
      }

      if (progressRes.success) {
        setProgress(progressRes.data);
      }
    } catch (error) {
      console.error('Error fetching free product data:', error);
    } finally {
      if (isInitial) {
        setInitialLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchEligibilityData(true);
    
    // Listen for cart updates
    const handleCartUpdate = () => {
      fetchEligibilityData(false);
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  // Refresh when cart changes (when free product is added or removed)
  // But don't show loading state to prevent flickering
  useEffect(() => {
    if (!initialLoading) {
      fetchEligibilityData(false);
    }
  }, [hasFreeProductInCart]);

  if (initialLoading || dismissed) {
    return null;
  }

  // CRITICAL: Hide ALL banners if free product is already in cart
  if (hasFreeProductInCart) {
    return null;
  }

  // STRICT: Show "already claimed" message if user used their free product this month
  if (eligibility?.freeProductUsed && progress?.currentDays >= 10) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="relative border-l-2 border-green-400 pl-4 py-3 mb-4"
        >
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss"
          >
            <FaTimes size={14} />
          </button>

          <div className="flex items-start gap-3 pr-8">
            <motion.div 
              className="flex-shrink-0 w-6 h-6 rounded-full overflow-hidden border border-green-400 bg-white"
              animate={{ rotate: 360 }}
              transition={{
                duration: 0.8,
                ease: "easeOut"
              }}
            >
              <img 
                src="/images/logo.png" 
                alt="La Patisserie Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback if logo doesn't load
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="w-full h-full bg-green-500 flex items-center justify-center" style={{ display: 'none' }}>
                <div className="w-2 h-2 bg-white"></div>
              </div>
            </motion.div>
            
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-green-800 mb-1">
                Free Product Claimed This Month
              </h3>
              
              <p className="text-xs text-green-700 leading-relaxed mb-1">
                You've already received your monthly free product reward.
              </p>
              
              <p className="text-xs text-green-600 leading-relaxed">
                Progress resets next month. Keep ordering to unlock your next reward.
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Don't show progress banner if user already used their free product (only show "claimed" message above)
  if (eligibility?.freeProductUsed) {
    return null;
  }

  // Don't show eligibility banner if free product is already in cart
  // Show eligibility banner if user is eligible and no free product in cart
  if (eligibility?.eligible && !hasFreeProductInCart) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="relative border-l-4 border-blue-500 pl-4 py-3 mb-4"
        >
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss"
          >
            <FaTimes size={14} />
          </button>

          <div className="flex items-start gap-3 sm:gap-4 pr-8">
            <motion.div 
              className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden border-2 border-blue-500 bg-white"
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                ease: "easeOut"
              }}
            >
              <img 
                src="/images/logo.png" 
                alt="La Patisserie Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback if logo doesn't load
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="w-full h-full bg-blue-500 flex items-center justify-center" style={{ display: 'none' }}>
                <div className="w-3 h-3 bg-white"></div>
              </div>
            </motion.div>
            
            <div className="flex-1">
              <h3 className="text-sm sm:text-base font-semibold text-blue-900 mb-2">
                Congratulations! You've Unlocked a Free Product
              </h3>
              <p className="text-xs sm:text-sm text-blue-800 mb-3 leading-relaxed">
                You've ordered on 10 different days this month. Pick any item from our catalog as your reward.
              </p>
              <p className="text-xs text-blue-700 mb-4">
                Note: Only one free product per month
              </p>
              
              <button
                onClick={onSelectFreeProduct}
                className="border border-blue-500 text-blue-600 hover:text-blue-700 hover:border-blue-600 font-medium text-xs sm:text-sm px-4 py-2 transition-colors duration-200"
              >
                Select Your Free Product
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Show progress banner if user is making progress
  if (progress && progress.currentDays > 0 && progress.currentDays < 10) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="relative border-l-2 border-purple-400 pl-4 py-3 mb-4"
        >
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss"
          >
            <FaTimes size={14} />
          </button>

          <div className="flex items-start gap-3 pr-8">
            <div className="flex-shrink-0 w-6 h-6 rounded-full overflow-hidden border border-purple-400 bg-white">
              <img 
                src="/images/logo.png" 
                alt="La Patisserie Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback if logo doesn't load
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="w-full h-full bg-purple-500 flex items-center justify-center" style={{ display: 'none' }}>
                <div className="w-2 h-2 bg-white"></div>
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-purple-900 mb-2">
                Free Product Reward Progress
              </h3>
              
              <div className="mb-2">
                <div className="flex justify-between text-xs text-purple-800 mb-2">
                  <span>Order on {progress.daysRemaining} more {progress.daysRemaining === 1 ? 'day' : 'days'} to unlock</span>
                  <span className="font-semibold">{progress.currentDays}/10 days</span>
                </div>
                
                {/* Innovative dotted progress */}
                <div className="flex items-center gap-1 mb-1">
                  {Array.from({ length: 10 }, (_, index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0 }}
                      animate={{ 
                        scale: index < progress.currentDays ? 1 : 0.3,
                        backgroundColor: index < progress.currentDays ? '#8b5cf6' : '#e5e7eb'
                      }}
                      transition={{ 
                        duration: 0.3, 
                        delay: index * 0.05,
                        type: "spring",
                        stiffness: 300
                      }}
                      className={`w-2 h-2 transition-all duration-300 ${
                        index < progress.currentDays 
                          ? 'bg-purple-500 shadow-sm' 
                          : 'bg-gray-200'
                      }`}
                      style={{
                        borderRadius: index < progress.currentDays ? '2px' : '50%'}}
                    />
                  ))}
                </div>
                
                {/* Progress percentage line with moving cube */}
                <div className="relative mb-2">
                  <div className="w-full h-px bg-gray-200"></div>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.percentage}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
                    className="absolute top-0 left-0 h-px bg-gradient-to-r from-purple-400 to-purple-600"
                  />
                  
                  {/* Moving cube on progress line */}
                  <motion.div
                    initial={{ left: 0 }}
                    animate={{ left: `${progress.percentage}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
                    className="absolute -top-1.5 transform -translate-x-1/2"
                  >
                    <motion.div
                      animate={{ rotate: (progress.percentage / 100) * 360 }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                      className="w-3 h-3 border border-purple-500 bg-purple-500 flex items-center justify-center"
                    >
                      <div className="w-1 h-1 bg-white"></div>
                    </motion.div>
                  </motion.div>
                </div>

                {/* Compact Timeline - Always visible, smart display */}
                {progress.orderDates && progress.orderDates.length > 0 && (
                  <div className="mt-2 bg-purple-50/50 rounded px-2 py-1.5">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] text-purple-700 font-medium mr-1">Ordered:</span>
                      {progress.orderDates.slice(0, 5).map((date, index) => {
                        const day = new Date(date).getDate();
                        const month = new Date(date).toLocaleDateString('en-US', { month: 'short' });
                        return (
                          <motion.span
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="inline-flex items-center gap-0.5 bg-white text-purple-800 px-1.5 py-0.5 rounded text-[10px] font-medium border border-purple-200"
                          >
                            {month} {day}
                          </motion.span>
                        );
                      })}
                      {progress.orderDates.length > 5 && (
                        <span className="text-[10px] text-purple-600 font-medium">
                          +{progress.orderDates.length - 5}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Timeline View */}
              <AnimatePresence>
                {showTimeline && progress.orderDates && progress.orderDates.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-3 bg-purple-50 rounded-lg p-3 border border-purple-200"
                  >
                    <p className="text-xs font-semibold text-purple-900 mb-2">
                      Your Order Timeline:
                    </p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {progress.orderDates.map((date, index) => {
                        const formattedDate = new Date(date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        });
                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center gap-2"
                          >
                            <div className="flex-shrink-0 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-[10px]">
                              {index + 1}
                            </div>
                            <div className="flex-1 bg-white rounded px-2 py-1 border border-purple-100">
                              <p className="text-xs font-medium text-purple-900">{formattedDate}</p>
                            </div>
                            <div className="flex-shrink-0 text-green-500 text-xs">✓</div>
                          </motion.div>
                        );
                      })}
                    </div>
                    {progress.daysRemaining > 0 && (
                      <p className="text-[10px] text-center text-purple-700 mt-2 pt-2 border-t border-purple-200">
                        {progress.daysRemaining} more {progress.daysRemaining === 1 ? 'day' : 'days'} to unlock your reward!
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              
              <p className="text-xs text-purple-700 leading-relaxed">
                Order on different days this month to earn a free product of your choice
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
};

export default FreeProductBanner;
