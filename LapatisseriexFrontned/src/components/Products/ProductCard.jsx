import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Heart } from 'lucide-react';
import MediaDisplay from '../common/MediaDisplay';
import ProductImageModal from '../common/ProductImageModal';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext/FavoritesContext';
import { useAuth } from '../../context/AuthContext/AuthContext';

const ProductCard = ({ product, className = '', compact = false, featured = false }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const { addToCart, getProductQuantity, updateProductQuantity } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();
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

  const handleFavoriteToggle = async (e) => {
    e.stopPropagation();
    if (!user) {
      return;
    }
    await toggleFavorite(product._id);
  };

  return (
    <div
      className={`rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300 h-72 ${
        featured
          ? 'h-full flex flex-col'
          : compact
          ? 'flex flex-col'
          : 'flex flex-row'
      } ${className}`}
    >
      {/* Product Image */}
      <div
        className={`${
          featured || compact ? 'w-full aspect-square' : 'w-28 sm:w-32 md:w-36 flex-shrink-0'
        } relative`}
      >
        <div
          className={`w-full relative cursor-pointer group rounded-lg overflow-hidden ${
            featured || compact ? 'aspect-square' : 'aspect-square sm:aspect-[3/4]'
          }`}
          onClick={openImageModal}
        >
          <MediaDisplay
            src={product.images?.[currentImageIndex] || null}
            alt={product.name}
            className="w-full h-full"
            aspectRatio="auto"
            objectFit="cover"
          />

          <button
            onClick={handleFavoriteToggle}
            className={`absolute top-2 left-2 p-1.5 rounded-full transition-all duration-200 ${
              isFavorite(product._id)
                ? 'bg-red-500 text-white shadow-md'
                : 'bg-white bg-opacity-80 text-gray-600 hover:bg-opacity-100 hover:text-red-500'
            }`}
            title={isFavorite(product._id) ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className={`w-4 h-4 ${isFavorite(product._id) ? 'fill-current' : ''}`}
            />
          </button>

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

      {/* Content Section */}
      <div className={`flex-1 ${featured || compact ? 'p-3' : 'p-3 sm:p-4'} flex flex-col justify-between`}>
        <div>
          <h3
            className={`font-semibold text-black line-clamp-2 ${
              featured ? 'text-sm' : compact ? 'text-xs sm:text-sm' : 'text-sm'
            } cursor-pointer hover:text-orange-500 mb-1`}
            onClick={openImageModal}
          >
            {product.name}
          </h3>

          {/* Egg/No Egg Indicator */}
          <div className="mb-2">
            <span
              className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full ${
                product.hasEgg
                  ? 'border border-orange-200 bg-white text-orange-600'
                  : 'border border-green-200 bg-white text-green-600'
              }`}
            >
              <div className="flex items-center gap-1">
                {/* Triangle SVG */}
                <svg
                  className="w-2 h-2"
                  viewBox="0 0 10 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0 10L10 10L5 0L0 10Z"
                    fill={product.hasEgg ? '#F97316' : '#22C55E'}
                  />
                </svg>
                <span className="uppercase tracking-tight font-medium">
                  {product.hasEgg ? 'WITH EGG' : 'EGGLESS'}
                </span>
              </div>
            </span>
          </div>

          <p
            className={`text-xs text-gray-700 leading-relaxed mb-2 ${
              compact ? 'line-clamp-1 sm:line-clamp-2' : 'line-clamp-2'
            }`}
          >
            {product.description ||
              'Delicious handcrafted treat made with premium ingredients.'}
          </p>

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-baseline gap-1">
              {discountedPrice !== product.variants[0].price && (
                <span className="text-gray-500 line-through text-xs">
                  ₹{Math.round(product.variants[0].price)}
                </span>
              )}
              <span
                className={`font-bold text-black ${
                  featured || compact ? 'text-sm' : 'text-base'
                }`}
              >
                ₹{Math.round(discountedPrice)}
              </span>
            </div>
            {discountPercentage > 0 && (
              <span className="bg-green-50 text-green-600 text-xs font-medium px-2 py-0.5 rounded">
                {discountPercentage}% OFF
              </span>
            )}
          </div>

          {product.stock > 0 && product.stock < 15 && (
            <span className="text-red-500 font-medium text-sm mb-2">
              Only {product.stock} left
            </span>
          )}

          {product.stock === 0 && (
            <span className="text-gray-500 font-medium text-sm mb-2">
              Out of Stock
            </span>
          )}
        </div>

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
            <button
              onClick={handleAddToCart}
              disabled={!product.isActive || product.stock === 0 || isAddingToCart}
              className={`w-full py-2 px-3 text-xs font-medium rounded-md transition-all duration-200 ${
                !product.isActive || product.stock === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-300'
                  : isAddingToCart
                  ? 'bg-gray-200 text-black cursor-wait border border-gray-400'
                  : 'bg-white text-black border border-black hover:bg-gray-50'
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
          )}

          <button
            onClick={handleBuyNow}
            disabled={!product.isActive || product.stock === 0}
            className={`w-full py-2 px-3 text-xs font-medium rounded-md transition-all duration-200 ${
              !product.isActive || product.stock === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {!product.isActive
              ? 'Unavailable'
              : product.stock === 0
              ? 'Out of Stock'
              : 'Reserve Yours'}
          </button>
        </div>
      </div>

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
    hasEgg: PropTypes.bool,
  }).isRequired,
  className: PropTypes.string,
  compact: PropTypes.bool,
  featured: PropTypes.bool,
};

export default ProductCard;
