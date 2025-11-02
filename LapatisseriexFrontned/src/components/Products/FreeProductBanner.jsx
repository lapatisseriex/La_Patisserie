import React from 'react';
import { motion } from 'framer-motion';
import { Gift, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FreeProductBanner = ({ onClose }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] text-white shadow-lg"
      style={{ marginTop: typeof window !== 'undefined' && window.innerWidth < 768 ? '75px' : '130px' }}
    >
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                🎉 Select Your FREE Product!
              </h3>
              <p className="text-sm text-white/90" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                Click on any product below to add it to your cart for FREE
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default FreeProductBanner;
