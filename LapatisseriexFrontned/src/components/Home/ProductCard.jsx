import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import MediaDisplay from '../common/MediaDisplay';
import ImageSlideshow from '../common/ImageSlideshow';
import ProductImageModal from '../common/ProductImageModal';
import { useCart } from '../../context/CartContext';
import { ShoppingCart } from 'lucide-react';

const ProductCard = ({ 
  product,
  className = '',
  compact = false
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const { addToCart, getProductQuantity, updateProductQuantity } = useCart();
  const navigate = useNavigate();

  const currentQuantity = getProductQuantity(product._id);

  const getStockStatus = () => {
    if (!product.isActive) {
      return { label: 'Unavailable', color: 'bg-white', icon: '❌' };
    }
    if (product.stock === 0) {
      return { label: 'Out of Stock', color: 'bg-red-500', icon: '⛔' };
    }
    if (product.stock < 5) {
      return { label: 'Low Stock', color: 'bg-amber-400', icon: '⚠️' };
    }
    return { label: 'In Stock', color: 'bg-green-500', icon: '✅' };
  };

  const stockStatus = getStockStatus();

  const discountedPrice = product.variants[0].price && product.variants[0].discount.value
    ? product.variants[0].price - product.variants[0].discount.value
    : product.variants[0].price;
    
  const discountPercentage = product.variants[0].price && product.variants[0].discount.value
    ? Math.round((product.variants[0].discount.value / product.variants[0].price) * 100)
    : 0;

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!product.isActive || product.stock === 0) return;
    
    setIsAddingToCart(true);
    try {
      await addToCart(product, 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async (e) => {
    e.stopPropagation();
    if (!product.isActive || product.stock === 0) return;
    
    try {
      if (currentQuantity === 0) {
        await addToCart(product, 1);
      }
      navigate('/cart');
    } catch (error) {
      console.error('Error in buy now:', error);
    }
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 0) return;
    updateProductQuantity(product._id, newQuantity);
  };

  return (
    <div
      className={`product-card relative rounded-2xl overflow-hidden ${
        compact ? 'border border-gray-300' : 'shadow-lg'
      } bg-white transition-all duration-300 transform w-full ${
        compact ? 'min-h-[200px]' : 'min-h-[240px]'
      } flex ${className}`}
    >
      {/* Content Section - Left Side */}
      <div className={`flex-1 ${compact ? 'p-3' : 'p-4'} flex flex-col justify-between min-h-0`}>
        {/* Product Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className={`font-semibold text-black line-clamp-1 flex-1 ${
              compact ? 'text-sm' : 'text-base'
            } leading-tight`}>
              {product.name}
            </h3>
            
            {/* Discount Badge */}
            {discountPercentage > 0 && (
              <div className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                {discountPercentage}% OFF
              </div>
            )}
          </div>

          {/* Egg/No Egg Indicator */}
          <div className="mb-2">
            <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full ${
              product.hasEgg === true
                ? 'border border-orange-200 bg-white text-orange-600' 
                : 'border border-green-200 bg-white text-green-600'
            }`}>
              {product.hasEgg === true ? (
                <div className="flex items-center">
                  <span className="inline-block w-2 h-2 bg-orange-500 rounded-full mr-1"></span>
                  <span className="uppercase tracking-tight font-medium">WITH EGG</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  <span className="uppercase tracking-tight font-medium">EGGLESS</span>
                </div>
              )}
            </span>
          </div>

          {/* Description - Always visible */}
          <p className={`text-xs text-gray-700 leading-relaxed mb-2 ${
            compact 
              ? 'line-clamp-2' 
              : 'line-clamp-3'
          }`}>
            {product.description || "Delicious handcrafted treat made with premium ingredients"}
          </p>
          
          {/* Pricing */}
          <div className="flex flex-wrap items-baseline gap-1 mb-3">
            {discountedPrice !== product.variants[0].price && (
              <span className="text-gray-500 line-through text-xs">
                ₹{Math.round(product.variants[0].price)}
              </span>
            )}
            <span className={`font-bold text-black ${compact ? 'text-base' : 'text-lg'}`}>
              ₹{Math.round(discountedPrice)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleAddToCart}
            disabled={!product.isActive || product.stock === 0 || isAddingToCart}
            className={`w-full py-2 px-3 rounded-lg transition-colors duration-300 text-xs font-medium flex items-center justify-center gap-1 ${
              !product.isActive || product.stock === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-400'
                : 'bg-white border-2 border-red-500 text-red-500 hover:bg-red-50'
            }`}
          >
            <ShoppingCart className="w-3 h-3" />
            {isAddingToCart ? 'Adding...' : 'Add to Box'}
          </button>
          
          <button
            onClick={handleBuyNow}
            disabled={!product.isActive || product.stock === 0}
            className={`w-full py-2 px-3 rounded-lg transition-colors duration-300 text-xs font-medium ${
              !product.isActive || product.stock === 0
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            Reserve Yours
          </button>
        </div>
      </div>

      {/* Image Section - Right Side */}
      <div className={`${compact ? 'w-20' : 'w-24 sm:w-28'} flex-shrink-0 relative overflow-hidden cursor-pointer`}
        onClick={(e) => {
          e.stopPropagation();
          setIsImageModalOpen(true);
        }}>
        {product.images && product.images.length > 1 ? (
          <ImageSlideshow
            images={product.images}
            alt={product.name}
            className="w-full h-full object-cover rounded-r-2xl"
            onIndexChange={setCurrentImageIndex}
          />
        ) : (
          <MediaDisplay
            src={product.images?.[0] || ''}
            alt={product.name}
            className="w-full h-full object-cover rounded-r-2xl"
          />
        )}
        
        {/* Image Indicators for slideshow */}
        {product.images && product.images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {product.images.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Product Image Modal */}
      {isImageModalOpen && (
        <ProductImageModal
          isOpen={isImageModalOpen}
          images={product.images || []}
          initialIndex={currentImageIndex}
          onClose={() => setIsImageModalOpen(false)}
        />
      )}
    </div>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    price: PropTypes.number.isRequired,
    discountPrice: PropTypes.number,
    images: PropTypes.arrayOf(PropTypes.string),
    category: PropTypes.shape({
      _id: PropTypes.string,
      name: PropTypes.string
    }),
    isActive: PropTypes.bool,
    stock: PropTypes.number,
    badge: PropTypes.string,
    rating: PropTypes.number,
    reviewCount: PropTypes.number,
    featured: PropTypes.bool,
    isNew: PropTypes.bool
  }).isRequired,
  className: PropTypes.string,
  compact: PropTypes.bool
};

export default ProductCard;







