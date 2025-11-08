import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
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
            className="fixed inset-0 bg-black bg-opacity-20 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white border border-gray-200 max-w-sm w-full p-6 relative">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <FaTimes size={18} />
              </button>

              <div className="flex justify-center mb-4">
                <motion.div 
                  className="w-12 h-12 border-2 border-blue-500 flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "linear"
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
                    <div className="w-6 h-6 bg-white"></div>
                  </div>
                </motion.div>
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-center text-gray-900 mb-3">
                Congratulations!
              </h2>

              {/* Message */}
              <p className="text-center text-gray-700 mb-4 leading-relaxed text-sm">
                You've unlocked a <span className="font-semibold text-blue-600 border-b border-blue-300 pb-0.5">free product</span> reward! 
                Pick any item from our catalog.
              </p>
              
              <p className="text-center text-xs text-gray-500 mb-6">
                Only one free product allowed per month
              </p>

              {/* Description */}
              <div className="border border-gray-200 p-4 mb-6">
                <p className="text-sm text-gray-700 leading-relaxed">
                  <span className="font-semibold text-gray-900">How it works:</span>
                  <br />
                  1. Browse our products
                  <br />
                  2. Select your favorite item
                  <br />
                  3. It will be added to your cart for free
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSelectProduct}
                  className="w-full border-2 border-blue-500 text-blue-600 hover:text-blue-700 hover:border-blue-600 font-semibold py-3 px-6 transition-colors duration-200 text-sm"
                >
                  Select Free Product
                </button>
                
                <button
                  onClick={onClose}
                  className="w-full border border-gray-300 text-gray-600 hover:text-gray-700 hover:border-gray-400 font-medium py-3 px-6 transition-colors duration-200 text-sm"
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
