import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Search, ShoppingCart, Check, AlertCircle } from 'lucide-react';
import { getAvailableFreeProducts, addFreeProductToCart } from '../../services/loyaltyService';
import { toast } from 'react-hot-toast';
import { calculatePricing, formatCurrency } from '../../utils/pricingUtils';
import OfferBadge from '../common/OfferBadge';
import BlobButton from '../common/BlobButton';

const FreeProductSelectionModal = ({ isOpen, onClose, onProductSelected }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchFreeProducts();
    }
  }, [isOpen]);

  const fetchFreeProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAvailableFreeProducts();
      if (response.success) {
        setProducts(response.data.products || []);
      }
    } catch (err) {
      console.error('Error fetching free products:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to load available products');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = async (product) => {
    try {
      setAdding(true);
      
      // Add free product to cart
      await addFreeProductToCart(product._id, selectedVariantIndex);
      
      toast.success(
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-green-500" />
          <span>Free product added to cart! 🎉</span>
        </div>,
        {
          duration: 4000,
          position: 'top-center'}
      );

      if (onProductSelected) {
        onProductSelected(product);
      }

      onClose();
    } catch (err) {
      console.error('Error adding free product:', err);
      toast.error(
        err.response?.data?.error || 'Failed to add free product to cart'
      );
    } finally {
      setAdding(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden z-10"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                  <Gift className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold" style={{  }}>Select Your Free Product</h2>
                  <p className="text-sm text-white/90 mt-1" style={{  }}>
                    Choose any product below - it's on us! 🎉
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="mt-4 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#733857]/30" />
              <input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                style={{  }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-220px)]">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 rounded-xl h-48 mb-3"></div>
                    <div className="bg-gray-200 rounded h-4 w-3/4 mb-2"></div>
                    <div className="bg-gray-200 rounded h-4 w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 inline-block">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                  <p className="text-red-700 font-semibold">{error}</p>
                  <button
                    onClick={onClose}
                    className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {searchQuery ? 'No products found matching your search' : 'No products available'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((product) => {
                  const variant = product.variants && product.variants.length > 0 
                    ? product.variants[selectedVariantIndex || 0]
                    : null;
                  
                  const pricing = variant ? calculatePricing(variant) : null;
                  const finalPrice = pricing ? pricing.finalPrice : product.price;
                  const mrp = pricing ? pricing.mrp : product.price;
                  const discountPercentage = pricing ? pricing.discountPercentage : 0;
                  const hasDiscount = discountPercentage > 0;
                  
                  return (
                    <motion.div
                      key={product._id}
                      whileHover={{ y: -2 }}
                      className="group relative bg-white border border-gray-200 hover:border-[#733857]/30 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
                    >
                      {/* Product Image Container */}
                      <div className="relative w-full aspect-square overflow-hidden bg-gray-50">
                        <img
                          src={product.images?.[0]?.url || '/placeholder.jpg'}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        
                        {/* FREE Badge */}
                        <div className="absolute top-2 right-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded shadow-md text-xs font-bold">
                          FREE
                        </div>

                        {/* Egg/Eggless indicator */}
                        {product.hasEgg !== undefined && (
                          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-2 py-1 rounded shadow-sm">
                            <span 
                              className="text-[10px] font-light tracking-wide"
                            >
                              {product.hasEgg ? 'WITH EGG' : 'EGGLESS'}
                            </span>
                            <div className="flex items-center justify-center">
                              <svg
                                className="w-4 h-4 bg-white rounded"
                                viewBox="0 0 20 20"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <rect
                                  x="1"
                                  y="1"
                                  width="18"
                                  height="18"
                                  stroke={product.hasEgg ? '#FF0000' : '#22C55E'} 
                                  strokeWidth="2"
                                  fill="none"
                                />
                                {product.hasEgg ? (
                                  <polygon points="10,4 16,16 4,16" fill="#FF0000" />
                                ) : (
                                  <circle cx="10" cy="10" r="5" fill="#22C55E" />
                                )}
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content Section */}
                      <div className="p-3 sm:p-4 flex flex-col justify-between flex-1">
                        <div className="space-y-2">
                          <h3
                            className="font-light bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent line-clamp-2 text-sm cursor-pointer hover:from-[#8d4466] hover:via-[#412434] hover:to-[#733857] transition-all duration-300"
                          >
                            {product.name}
                          </h3>

                          {/* Variants Selection */}
                          {product.variants && product.variants.length > 0 && (
                            <div className="space-y-1">
                              <label className="text-[10px] text-gray-500 font-light block">
                                Select Variant:
                              </label>
                              <select
                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#733857]/30 focus:border-[#733857] font-light"
                                onChange={(e) => setSelectedVariantIndex(parseInt(e.target.value))}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {product.variants.map((v, idx) => (
                                  <option key={idx} value={idx}>
                                    {v.weight || v.size || `Variant ${idx + 1}`}
                                    {v.stock <= 0 && ' (Out of Stock)'}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Pricing */}
                          <div className="flex items-baseline gap-2 mt-2">
                            {hasDiscount && (
                              <span className="text-xs text-gray-400 line-through font-light">
                                {formatCurrency(mrp)}
                              </span>
                            )}
                            <span className="text-sm font-light text-gray-400 line-through">
                              {formatCurrency(finalPrice)}
                            </span>
                            <span className="text-lg font-semibold text-green-600">
                              ₹0
                            </span>
                          </div>

                          {hasDiscount && (
                            <div className="mt-1">
                              <OfferBadge label={`${discountPercentage}% OFF`} className="text-[10px]" />
                            </div>
                          )}
                        </div>

                        {/* Select Button */}
                        <div className="mt-3">
                          <BlobButton
                            onClick={() => handleSelectProduct(product)}
                            disabled={adding || (product.variants?.[selectedVariantIndex]?.stock <= 0) || product.stock <= 0}
                            className="w-full px-4 py-2 text-xs font-light"
                          >
                            {adding ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Adding...
                              </>
                            ) : (
                              'Select This Product'
                            )}
                          </BlobButton>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FreeProductSelectionModal;
