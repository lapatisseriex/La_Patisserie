import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import MediaDisplay from '../common/MediaDisplay';
import ProductImageModal from '../common/ProductImageModal';
import { useCart } from '../../context/CartContext';

const ProductCard = ({ product, className = '', compact = false, featured = false }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
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

  const openImageModal = (e) => {
    e.stopPropagation();
    setIsImageModalOpen(true);
  };

  return (
    <div
      className={`rounded-xl overflow-hidden bg-white shadow-sm transition-all duration-300 w-full ${
        featured
          ? 'h-full'
          : compact
          ? 'min-h-[180px] sm:min-h-[200px] md:min-h-[240px] lg:min-h-[260px]'
          : 'min-h-[200px] sm:min-h-[220px] md:min-h-[280px] lg:min-h-[300px]'
      } flex flex-row ${className}`}
    >
      {/* Product Image */}
      <div
        className={`${
          compact ? 'w-24 sm:w-28 md:w-32 lg:w-28' : 'w-28 sm:w-32 md:w-36 lg:w-32'
        } flex-shrink-0 relative`}
      >
        {/* Mobile: Square aspect ratio, SM and up: Vertical rectangle */}
        <div
          className="w-full relative cursor-pointer group aspect-square sm:aspect-[3/4] rounded-lg overflow-hidden"
          onClick={openImageModal}
        >
          <MediaDisplay
            src={product.images?.[currentImageIndex] || null}
            alt={product.name}
            className="w-full h-full"
            aspectRatio="auto"
            objectFit="cover"
          />
          
          {/* Zoom Indicator */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 rounded-full p-2">
              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
              </svg>
            </div>
          </div>

          {/* Discount Badge */}
        

          {/* Image Navigation for multiple images */}
          {product.images && product.images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
                }}
                className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-90 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
                }}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-90 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Image Dots Indicator */}
          {product.images && product.images.length > 1 && (
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-1">
              {product.images.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className={`flex-1 ${
          compact ? 'p-2 sm:p-3 md:p-4 lg:p-5' : 'p-2 sm:p-3 md:p-5 lg:p-6'
        } flex flex-col justify-between`}
      >
        {/* Info */}
        <div>
          <h3
            className={`font-semibold text-black line-clamp-2 ${
              compact
                ? 'text-xs sm:text-sm md:text-base'
                : 'text-sm sm:text-base md:text-lg'
            } cursor-pointer hover:text-orange-500`}
            onClick={openImageModal}
          >
            {product.name}
          </h3>

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

          <p
            className={`text-xs text-gray-700 leading-relaxed mb-2 ${
              compact ? 'line-clamp-1 sm:line-clamp-2' : 'line-clamp-2'
            }`}
          >
            {product.description ||
              'Delicious handcrafted treat made with premium ingredients'}
          </p>

          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <div className="flex items-baseline gap-1">
              {discountedPrice !== product.variants[0].price && (
                <span className="text-gray-500 line-through text-xs">
                  ₹{Math.round(product.variants[0].price)}
                </span>
              )}
              <span className="font-bold text-black text-base">
                ₹{Math.round(discountedPrice)}
              </span>
            </div>
            {/* Green Discount Badge next to price */}
            {discountPercentage > 0 && (
              <span className="bg-white text-green-500 text-xs font-bold px-2 py-1 rounded-md">
                {discountPercentage}% OFF
              </span>
            )}
          </div>
        </div>
        
            {/* Stock info text */}
            {product.stock > 0 && product.stock < 15 && (
              <span className="text-red-500 font-medium text-sm">
                Only {product.stock} left
              </span>
            )}

            {product.stock === 0 && (
              <span className="text-gray-500 font-medium text-sm">
                Out of Stock
              </span>
            )}
        {/* Actions */}
        <div className={`${compact ? 'space-y-1 sm:space-y-2' : 'space-y-2'}`}>
        {currentQuantity > 0 ? (
          <div className="flex items-center justify-center bg-white rounded-lg p-2 border border-gray-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleQuantityChange(currentQuantity - 1);
              }}
              className="w-6 h-6 flex items-center justify-center bg-white rounded-full text-black transition-colors border border-black hover:bg-gray-50"
            >
              −
            </button>
            <span className="mx-3 font-medium text-black min-w-[2rem] text-center text-sm">
              {currentQuantity}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleQuantityChange(currentQuantity + 1);
              }}
              disabled={currentQuantity >= product.stock}
              className="w-6 h-6 flex items-center justify-center bg-white rounded-full text-black transition-colors border border-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              +
            </button>
              </div>
            ) : (
              <div className="flex flex-col space-y-1">
            <button
              onClick={handleAddToCart}
              disabled={!product.isActive || product.stock === 0 || isAddingToCart}
              className={`w-full ${compact ? 'py-2 px-2 text-xs sm:py-2.5 sm:px-3 sm:text-sm' : 'py-2.5 px-3 text-sm'} rounded-lg font-medium transition-all duration-200 ${
                !product.isActive || product.stock === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-300'
                  : isAddingToCart
                  ? 'bg-gray-200 text-black cursor-wait border border-gray-400'
                  : 'bg-white text-black border-2 border-black hover:bg-gray-50 active:scale-95'
              }`}
            >
        
        {isAddingToCart ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-400 mr-2"></div>
            Adding...
          </div>
              ) : (
                'Add to Box'
              )}
            </button>
          </div>
        )}


          {/* Reserve Yours Button */}
          <button
            onClick={handleBuyNow}
            disabled={!product.isActive || product.stock === 0}
            className={`w-full ${compact ? 'py-2 px-2 text-xs sm:py-2.5 sm:px-3 sm:text-sm' : 'py-2.5 px-3 text-sm'} rounded-lg font-medium transition-all duration-200 ${
              !product.isActive || product.stock === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800 active:scale-95'
            }`}
          >
            {!product.isActive ? 'Unavailable' : product.stock === 0 ? 'Out of Stock' : 'Reserve Yours'}
          </button>
        </div>
      </div>

      {/* Modal */}
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
  featured: PropTypes.bool,
};

export default ProductCard;
