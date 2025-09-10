import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import MediaDisplay from '../common/MediaDisplay';
import ImageSlideshow from '../common/ImageSlideshow';
import { useCart } from '../../context/CartContext';

const ProductCard = ({ product, className = '', compact = false }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addToCart, getProductQuantity, updateProductQuantity } = useCart();
  const navigate = useNavigate();

  const currentQuantity = getProductQuantity(product._id);

  const discountedPrice =
    product.variants[0].price && product.variants[0].discount.value
      ? product.variants[0].price - product.variants[0].discount.value
      : product.variants[0].price;
      
  const discountPercentage = 
    product.variants[0].price && product.variants[0].discount.value
      ? Math.round((product.variants[0].discount.value / product.variants[0].price) * 100)
      : 0;

  const getStockStatus = () => {
    if (!product.isActive) {
      return { label: 'Unavailable', color: 'bg-gray-500' };
    }
    if (product.stock === 0) {
      return { label: 'Out of Stock', color: 'bg-red-500' };
    }
    if (product.stock < 5) {
      return { label: 'Low Stock', color: 'bg-amber-400' };
    }
    return { label: 'In Stock', color: 'bg-green-500' };
  };

  const stockStatus = getStockStatus();

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
      className={`rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${className}`}
    >
      <div className={`relative ${compact ? 'h-32 sm:h-40' : 'h-48 sm:h-56 lg:h-64'} overflow-hidden`}>
        {product.images && product.images.length > 1 ? (
          <ImageSlideshow
            images={product.images}
            alt={product.name}
            aspectRatio={compact ? 'auto' : '4/3'}
            className="w-full h-full object-cover"
            onIndexChange={setCurrentImageIndex}
          />
        ) : (
          <MediaDisplay
            src={product.images?.[0] || ''}
            alt={product.name}
            aspectRatio={compact ? 'auto' : '4/3'}
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <div className="absolute top-2 left-2">
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
              -{discountPercentage}% OFF
            </span>
          </div>
        )}
        
        {/* Image Indicators */}
        {product.images && product.images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {product.images.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className={`p-4 ${compact ? 'p-3' : 'p-4 lg:p-5'}`}>
        <h3 className={`font-semibold text-gray-900 line-clamp-2 mb-2 ${compact ? 'text-sm' : 'text-base lg:text-lg'}`}>
          {product.name}
        </h3>
        
        {/* Egg/No Egg Indicator - Moved below image */}
        <div className="mb-2">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            product.hasEgg === true
              ? 'bg-orange-100 text-orange-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {product.hasEgg === true ? '🥚 With Egg' : '🌱 No Egg'}
          </span>
        </div>
        {!compact && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3 leading-relaxed">
            {product.description}
          </p>
        )}
        
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-lg lg:text-xl font-bold text-green-600">
                ₹{Math.round(discountedPrice)}
              </span>
              {discountedPrice !== product.variants[0].price && (
                <span className="line-through text-gray-500 text-sm">
                  ₹{Math.round(product.variants[0].price)}
                </span>
              )}
            </div>
          </div>
          
          {/* Stock Status and Add to Cart */}
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${stockStatus.color} text-white`}>
              {stockStatus.label}
            </span>
            {!compact && (
              <div className="text-xs text-gray-500">
                {product.stock > 0 ? `${product.stock} left` : 'Out of stock'}
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {/* Quantity Control or Add to Cart */}
            {currentQuantity > 0 ? (
              <div className="flex items-center justify-center bg-gray-100 rounded-lg p-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuantityChange(currentQuantity - 1);
                  }}
                  className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-cakePink hover:bg-cakePink hover:text-white transition-colors border border-gray-300"
                >
                  −
                </button>
                <span className="mx-4 font-medium text-gray-900 min-w-[2rem] text-center">
                  {currentQuantity}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuantityChange(currentQuantity + 1);
                  }}
                  disabled={currentQuantity >= product.stock}
                  className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-cakePink hover:bg-cakePink hover:text-white transition-colors border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={!product.isActive || product.stock === 0 || isAddingToCart}
                className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                  !product.isActive || product.stock === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : isAddingToCart
                    ? 'bg-cakePink-light text-white cursor-wait'
                    : 'bg-gray-100 text-cakePink border border-cakePink hover:bg-cakePink hover:text-white active:scale-95'
                }`}
              >
                {isAddingToCart ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Adding...
                  </div>
                ) : !product.isActive ? (
                  'Unavailable'
                ) : product.stock === 0 ? (
                  'Out of Stock'
                ) : (
                  'Add to Cart'
                )}
              </button>
            )}

            {/* Buy Now Button */}
            <button
              onClick={handleBuyNow}
              disabled={!product.isActive || product.stock === 0}
              className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                !product.isActive || product.stock === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-cakePink text-white hover:bg-cakePink-dark active:scale-95'
              }`}
            >
              {!product.isActive ? 'Unavailable' : product.stock === 0 ? 'Out of Stock' : 'Buy Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    variants: PropTypes.arrayOf(
      PropTypes.shape({
        price: PropTypes.number.isRequired,
        discount: PropTypes.shape({
          value: PropTypes.number,
        }),
      })
    ).isRequired,
    images: PropTypes.arrayOf(PropTypes.string),
    isActive: PropTypes.bool,
    stock: PropTypes.number,
  }).isRequired,
  className: PropTypes.string,
  compact: PropTypes.bool,
};

export default ProductCard;
