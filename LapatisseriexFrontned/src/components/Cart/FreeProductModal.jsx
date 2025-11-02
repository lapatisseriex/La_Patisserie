import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaGift } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const FreeProductModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleSelectProduct = () => {
    onClose();
    // Navigate to products page with a query parameter to indicate free product selection
    navigate('/products?selectFreeProduct=true');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-white to-[#f9f4f6] rounded-2xl shadow-2xl max-w-md w-full p-6 relative border border-[#d9c4cd]/50 overflow-hidden">
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#733857]/5 rounded-full -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#8d4466]/5 rounded-full -ml-16 -mb-16"></div>
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-[#733857]/60 hover:text-[#733857] transition-colors z-10"
                aria-label="Close"
              >
                <FaTimes size={24} />
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-4 relative z-10">
                <div className="bg-gradient-to-br from-[#733857] to-[#8d4466] rounded-full p-4 shadow-lg">
                  <FaGift className="text-white text-4xl" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-center text-[#412434] mb-3 relative z-10">
                🎉 Congratulations!
              </h2>

              {/* Message */}
              <p className="text-center text-[#733857] mb-6 leading-relaxed relative z-10">
                You've unlocked a <span className="font-semibold text-[#733857] bg-[#f7eef3] px-2 py-0.5 rounded">FREE product</span>! 
                <br />
                Pick any item from our catalog as your reward.
              </p>

              {/* Description */}
              <div className="bg-[#f7eef3] border border-[#d9c4cd] rounded-lg p-4 mb-6 relative z-10">
                <p className="text-sm text-[#412434] leading-relaxed">
                  <strong className="text-[#733857]">How it works:</strong>
                  <br />
                  1. Click below to browse our products
                  <br />
                  2. Select your favorite item
                  <br />
                  3. It will be added to your cart for FREE!
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 relative z-10">
                <button
                  onClick={handleSelectProduct}
                  className="w-full bg-gradient-to-r from-[#733857] to-[#8d4466] hover:from-[#8d4466] hover:to-[#733857] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Select Free Product
                </button>
                
                <button
                  onClick={onClose}
                  className="w-full bg-[#e8dce3] hover:bg-[#d9c4cd] text-[#733857] font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FreeProductModal;
