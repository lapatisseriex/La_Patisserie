import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ColdStartLoader({ isLoading, message, onClose }) {
  const [dots, setDots] = useState('');
  const [elapsed, setElapsed] = useState(0);
  
  // Animated dots effect
  useEffect(() => {
    if (!isLoading) return;
    
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    
    return () => clearInterval(interval);
  }, [isLoading]);
  
  // Track elapsed time
  useEffect(() => {
    if (!isLoading) {
      setElapsed(0);
      return;
    }
    
    const startTime = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            {/* Website Logo with Animation */}
            <div className="flex justify-center mb-6">
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1, 1.05, 1],
                  rotate: [0, -2, 2, -2, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative"
              >
                <img 
                  src="/images/logo.png" 
                  alt="La Patisserie Logo" 
                  className="h-20 w-20 object-contain"
                  onError={(e) => {
                    // Fallback to croissant emoji if logo fails to load
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div class="text-6xl">🥐</div>';
                  }}
                />
              </motion.div>
            </div>

            {/* Loading Spinner */}
            <div className="flex justify-center mb-4">
              <div className="relative w-16 h-16">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#733857] border-r-[#8d4466]"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-2 rounded-full border-4 border-transparent border-b-[#733857] border-l-[#8d4466]"
                />
              </div>
            </div>

            {/* Message */}
            <h3 className="text-2xl font-bold text-center mb-3 bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">
              Waking up the bakery{dots}
            </h3>
            
            <p className="text-gray-600 text-center mb-4">
              {message || "Our ovens are heating up! This happens when the site hasn't been visited recently."}
            </p>

            {/* Progress Info */}
            <div className="bg-gradient-to-r from-[#733857]/10 to-[#8d4466]/10 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Elapsed time:</span>
                <span className="font-semibold text-[#733857]">{elapsed}s</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600">Expected time:</span>
                <span className="font-semibold text-gray-700">5-15s</span>
              </div>
            </div>

            {/* Helpful Tip */}
            <div className="text-xs text-gray-500 text-center">
              💡 <span className="font-medium">Pro tip:</span> This only happens on the first visit after inactivity. 
              Subsequent loads will be instant!
            </div>

            {/* Progress Bar */}
            <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: elapsed > 15 ? "100%" : `${(elapsed / 15) * 100}%` }}
                className="h-full bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434]"
              />
            </div>

            {/* Long wait message */}
            {elapsed > 15 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-center"
              >
                <p className="text-sm text-amber-600">
                  ⏱️ Taking longer than usual...
                </p>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="mt-2 text-sm text-[#733857] hover:underline"
                  >
                    Continue anyway
                  </button>
                )}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
