import React, { useState, useEffect } from 'react';
import { getLoyaltyStatus } from '../../services/loyaltyService';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Calendar, TrendingUp, Award, Sparkles } from 'lucide-react';

const LoyaltyProgress = ({ onFreeProductEligible, onSelectFreeProduct }) => {
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLoyaltyStatus();
  }, []);

  const fetchLoyaltyStatus = async () => {
    try {
      setLoading(true);
      const response = await getLoyaltyStatus();
      console.log('🎁 Loyalty Status Response:', response);
      if (response.success) {
        setLoyaltyData(response.data);
        console.log('🎁 Loyalty Data:', {
          uniqueDaysCount: response.data.uniqueDaysCount,
          freeProductEligible: response.data.freeProductEligible,
          freeProductClaimed: response.data.freeProductClaimed
        });
        
        // Notify parent if eligible for free product
        if (response.data.freeProductEligible && onFreeProductEligible) {
          console.log('🎉 User is ELIGIBLE for free product!');
          onFreeProductEligible(response.data);
        } else {
          console.log('⚠️ User is NOT eligible:', {
            eligible: response.data.freeProductEligible,
            claimed: response.data.freeProductClaimed
          });
        }
      }
    } catch (err) {
      console.error('Error fetching loyalty status:', err);
      setError('Failed to load loyalty status');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-purple-200 rounded w-3/4"></div>
          <div className="h-4 bg-purple-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !loyaltyData) {
    return null;
  }

  const { uniqueDaysCount, freeProductEligible, freeProductClaimed, remainingDays } = loyaltyData;
  const progressPercentage = (uniqueDaysCount / 10) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-[#faf5f0] to-[#f5ebe1] rounded-xl p-6 shadow-sm border border-[#733857]/10"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-[#733857] to-[#8d4466] p-3 rounded-lg shadow-md">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#733857]" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>Loyalty Rewards</h3>
            <p className="text-sm text-gray-600" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>Order more, earn free products!</p>
          </div>
        </div>
        {freeProductEligible && !freeProductClaimed && (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg"
            style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}
          >
            <span className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Eligible!
            </span>
          </motion.div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {freeProductEligible && !freeProductClaimed ? (
          <motion.div
            key="eligible"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-xl p-5 mb-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-green-500 p-2 rounded-lg">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-green-800">
                  🎉 Congratulations!
                </h4>
                <p className="text-sm text-green-700">
                  You've earned a FREE product!
                </p>
              </div>
            </div>
            <p className="text-sm text-green-800 font-medium mb-4">
              Click the button below to choose your free product!
            </p>
            
            {/* Select Free Product Button */}
            {onSelectFreeProduct && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onSelectFreeProduct}
                className="w-full bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] text-white py-3 px-6 rounded font-bold hover:opacity-90 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                <Sparkles className="w-5 h-5" />
                <span>Select Your Free Product Now!</span>
                <Gift className="w-5 h-5" />
              </motion.button>
            )}
          </motion.div>
        ) : freeProductClaimed ? (
          <motion.div
            key="claimed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-300 rounded-xl p-5 mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 p-2 rounded-lg">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-blue-800">
                  Free Product Claimed!
                </h4>
                <p className="text-sm text-blue-700">
                  Keep ordering to earn another one next month!
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="progress"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#733857]" />
                  <span className="text-sm font-semibold text-gray-700" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>
                    Progress This Month
                  </span>
                </div>
                <span className="text-sm font-bold text-[#733857]" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>
                  {uniqueDaysCount}/10 days
                </span>
              </div>
              <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] rounded-full shadow-md"
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </motion.div>
              </div>
            </div>

            {remainingDays > 0 && (
              <div className="bg-white/80 rounded-lg p-4 border border-[#733857]/20">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-[#733857] to-[#8d4466] p-2 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>
                      Order on <span className="text-[#733857] font-bold">{remainingDays} more {remainingDays === 1 ? 'day' : 'different days'}</span>
                    </p>
                    <p className="text-xs text-gray-600 mt-1" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>
                      to get a FREE product next order! 🎁
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 pt-4 border-t border-[#733857]/10">
        <p className="text-xs text-gray-600 text-center" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>
          💡 <span className="font-semibold">Tip:</span> Order on different days to unlock rewards faster!
        </p>
      </div>
    </motion.div>
  );
};

export default LoyaltyProgress;
