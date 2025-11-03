import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGift, FaTimes } from 'react-icons/fa';
import { checkFreeProductEligibility, getFreeProductProgress } from '../../services/freeProductService';
import { useCart } from '../../hooks/useCart';

const FreeProductBanner = ({ onSelectFreeProduct }) => {
  const [eligibility, setEligibility] = useState(null);
  const [progress, setProgress] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
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
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="relative bg-gradient-to-br from-[#f9f4f6] to-[#f8f5f6] border border-[#d9c4cd] rounded-lg p-5 mb-6 shadow-sm overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#733857]/3 rounded-full -mr-12 -mt-12"></div>
          
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-3 right-3 text-[#733857]/50 hover:text-[#733857] transition-colors z-10"
            aria-label="Dismiss"
          >
            <FaTimes size={16} />
          </button>

          <div className="flex items-start gap-4 relative z-10">
            <div className="flex-shrink-0 bg-gradient-to-br from-[#8d4466] to-[#733857] rounded-full p-3 shadow-sm opacity-50">
              <FaGift className="text-white text-xl" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-base font-semibold text-[#412434] mb-2">
                ✓ Free Product Already Claimed This Month
              </h3>
              
              <p className="text-sm text-[#733857]/80 leading-relaxed mb-2">
                You've already received your free product reward for this month. 
              </p>
              
              <p className="text-xs text-[#733857]/60 leading-relaxed">
                Your progress will reset next month. Keep ordering on different days to unlock your next free product! 🎉
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
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="relative bg-gradient-to-br from-[#f7eef3] to-[#f9f4f6] border-2 border-[#733857] rounded-lg p-5 mb-6 shadow-lg overflow-hidden"
        >
          {/* Decorative background pattern */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#733857]/5 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#8d4466]/5 rounded-full -ml-12 -mb-12"></div>
          
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-3 right-3 text-[#733857]/60 hover:text-[#733857] transition-colors z-10"
            aria-label="Dismiss"
          >
            <FaTimes size={16} />
          </button>

          <div className="flex items-start gap-4 relative z-10">
            <div className="flex-shrink-0 bg-gradient-to-br from-[#733857] to-[#8d4466] rounded-full p-3.5 shadow-md">
              <FaGift className="text-white text-2xl" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-[#412434] mb-1.5 flex items-center gap-2">
                🎉 Congratulations! You've Unlocked a Free Product!
              </h3>
              <p className="text-sm text-[#733857] mb-4 leading-relaxed">
                You've ordered on 10 different days this month. Pick any item from our catalog as your reward!
                <br />
                <span className="text-xs font-medium text-[#8d4466] mt-1 inline-block">
                  ⚠️ Note: Only ONE free product per month
                </span>
              </p>
              
              <button
                onClick={onSelectFreeProduct}
                className="bg-gradient-to-r from-[#733857] to-[#8d4466] hover:from-[#8d4466] hover:to-[#733857] text-white font-medium px-6 py-2.5 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
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
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="relative bg-gradient-to-br from-[#f9f4f6] to-[#f8f5f6] border border-[#d9c4cd] rounded-lg p-5 mb-6 shadow-sm overflow-hidden"
        >
          {/* Subtle decorative elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#733857]/3 rounded-full -mr-12 -mt-12"></div>
          
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-3 right-3 text-[#733857]/50 hover:text-[#733857] transition-colors z-10"
            aria-label="Dismiss"
          >
            <FaTimes size={16} />
          </button>

          <div className="flex items-start gap-4 relative z-10">
            <div className="flex-shrink-0 bg-gradient-to-br from-[#8d4466] to-[#733857] rounded-full p-3 shadow-sm">
              <FaGift className="text-white text-xl" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-base font-semibold text-[#412434] mb-2.5">
                Free Product Reward Progress
              </h3>
              
              <div className="mb-2">
                <div className="flex justify-between text-sm text-[#733857] mb-2">
                  <span>Order on {progress.daysRemaining} more {progress.daysRemaining === 1 ? 'day' : 'days'} to unlock</span>
                  <span className="font-semibold text-[#412434]">{progress.currentDays}/10 days</span>
                </div>
                
                <div className="w-full bg-[#e8dce3] rounded-full h-2.5 overflow-hidden shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.percentage}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="bg-gradient-to-r from-[#733857] to-[#8d4466] h-2.5 rounded-full shadow-sm"
                  />
                </div>
              </div>
              
              <p className="text-xs text-[#733857]/80 leading-relaxed">
                Order on different days this month to earn a free product of your choice!
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
