import React, { useState } from 'react';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useShopStatus } from '../../context/ShopStatusContext';
import { motion, AnimatePresence } from 'framer-motion';
import MediaDisplay from '../common/MediaDisplay';

const CartSection = () => {
  const { cartItems, cartCount, updateQuantity, removeFromCart } = useCart();
  const { isOpen: isShopOpen } = useShopStatus();
  const [removingItems, setRemovingItems] = useState(new Set());

  // Don't render if cart is empty or shop is closed
  if (cartCount === 0 || !isShopOpen) return null;

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await updateQuantity(itemId, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const handleRemoveItem = async (itemId) => {
    setRemovingItems(prev => new Set([...prev, itemId]));
    try {
      await removeFromCart(itemId);
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setRemovingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const CartItemCard = ({ item }) => {
    const isRemoving = removingItems.has(item._id);
    
    // Prioritize productSnapshot, then fallback to populated product variants
    const price = item.productSnapshot?.price || 
      (item.product?.variants?.[0]?.price) || 0;
    const name = item.productSnapshot?.name || item.product?.name || 'Unknown Product';
    const image = item.productSnapshot?.image || (item.product?.images && item.product.images[0]) || null;
    
    console.log('Extracted data:', { price, name, image });
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 ${isRemoving ? 'opacity-50' : ''}`}
      >
        {/* Horizontal Layout - Image Left, Content Right */}
        <div className="flex">
          {/* Product Image - Left Side */}
          <div className="relative w-32 h-32 flex-shrink-0 bg-gray-100 overflow-hidden">
            {image ? (
              <MediaDisplay
                media={image}
                alt={name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <ShoppingCart className="text-gray-400 text-2xl" />
              </div>
            )}
            
            {/* Quantity Badge - Top left of image */}
            <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
              {item.quantity}
            </div>
          </div>

          {/* Content - Right Side */}
          <div className="flex-1 p-4 flex flex-col justify-between">
            {/* Top Section - Title and Remove */}
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 pr-2">
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{name}</h3>
                <p className="text-gray-500 text-xs">250g</p>
              </div>
              
              {/* Remove Button */}
              <button
                onClick={() => handleRemoveItem(item._id)}
                disabled={isRemoving}
                className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50 flex-shrink-0"
                title="Remove from cart"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Price Section */}
            <div className="mb-2">
              <div className="flex items-center">
                <span className="text-lg font-bold text-gray-900">₹{price}</span>
                <span className="text-gray-400 text-sm ml-2 line-through">₹{Math.round(price * 1.4)}</span>
              </div>
              <p className="text-sm text-gray-600">Total: ₹{(price * item.quantity).toFixed(0)}</p>
            </div>

            {/* Bottom Section - Quantity Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                <button
                  onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                  disabled={item.quantity <= 1 || isRemoving}
                  className="px-2 py-1 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus size={12} className="text-gray-600" />
                </button>
                
                <span className="px-2 py-1 bg-white text-center font-medium text-sm min-w-[30px]">
                  {item.quantity}
                </span>
                
                <button
                  onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                  disabled={isRemoving}
                  className="px-2 py-1 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus size={12} className="text-gray-600" />
                </button>
              </div>
              
              <span className="text-xs text-green-600 font-medium">In Cart</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <section className="w-full py-0 md:py-6">
      <div className="max-w-screen-xl mx-auto px-4 pt-6 pb-6 md:pt-0 md:pb-0">
        <div className="mb-8 space-y-3">
          <h2 className="text-2xl font-bold tracking-wide text-left" style={{ 
            background: 'linear-gradient(135deg, #e0a47d 0%, #c17e5b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0px 0px 1px rgba(224, 164, 125, 0.2)'
          }}>
            Your Cart ({cartCount} {cartCount === 1 ? 'item' : 'items'})
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {cartItems.map(item => (
              <CartItemCard key={item._id} item={item} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default CartSection;