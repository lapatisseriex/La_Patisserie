import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

const FloatingCartBar = () => {
  const { cartCount, cartTotal, cartItems } = useCart();
  const navigate = useNavigate();
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollTimeout, setScrollTimeout] = useState(null);

  // Handle scroll events to hide/show floating cart
  useEffect(() => {
    const handleScroll = () => {
      // Hide cart when scrolling
      setIsScrolling(true);
      
      // Clear existing timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      // Set new timeout to show cart when scrolling stops
      const newTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 150); // Show cart 150ms after scrolling stops
      
      setScrollTimeout(newTimeout);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [scrollTimeout]);

  // Only show if there are items in cart
  if (cartCount === 0) return null;

  const handleViewCart = () => {
    navigate('/cart');
  };

  return (
    <AnimatePresence>
      {!isScrolling && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-2xl border-t border-gray-200"
        >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Cart Info */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9m-9 0v-1m9 1v-1" />
                  </svg>
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium text-black">
                    {cartCount} item{cartCount !== 1 ? 's' : ''} in cart
                  </div>
                  <div className="text-xs text-black">
                    {cartItems.slice(0, 2).map(item => item.name).join(', ')}
                    {cartItems.length > 2 && ` +${cartItems.length - 2} more`}
                  </div>
                </div>
              </div>
            </div>

            {/* Total and Action */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">
                  ₹{Math.round(cartTotal)}
                </div>
                <div className="text-xs text-black">Total</div>
              </div>
              
              <button
                onClick={handleViewCart}
                className="bg-black text-white px-6 py-2 rounded-lg font-medium transition-colors active:scale-95 transform"
              >
                View Cart
              </button>
            </div>
          </div>
        </div>

        {/* Mobile optimized version */}
        <div className="sm:hidden">
          <div className="bg-white/10 px-4 py-2">
            <div className="flex items-center justify-between text-xs text-black">
              <span>Free delivery on orders over ₹500</span>
              <span>
                {cartTotal >= 500 ? '✅ Eligible' : `₹${500 - cartTotal} more needed`}
              </span>
            </div>
          </div>
        </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingCartBar;







