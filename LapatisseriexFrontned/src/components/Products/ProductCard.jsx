import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Heart } from 'lucide-react';
import MediaDisplay from '../common/MediaDisplay';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext/FavoritesContext';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { useRecentlyViewed } from '../../context/RecentlyViewedContext/RecentlyViewedContext';

const ProductCard = ({ product, className = '', compact = false, featured = false }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const { addToCart, getProductQuantity, updateProductQuantity } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const { trackProductView } = useRecentlyViewed();
  const navigate = useNavigate();

  const currentQuantity = getProductQuantity(product._id);

  // Auto-slide functionality for multiple images - very slow and smooth
  useEffect(() => {
    if (product.images && product.images.length > 1 && !isHoveringImage) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => 
          (prevIndex + 1) % product.images.length
        );
      }, 4500); // Change image every 4.5 seconds for very slow, smooth experience

      return () => clearInterval(interval);
    }
  }, [product.images, isHoveringImage]);

  // Ensure we have variants and handle missing data
  const variant = product.variants?.[0] || { price: 0, discount: { value: 0 }, stock: 0 };
  const isActive = product.isActive !== false; // Default to true if undefined
  const totalStock = product.stock || variant.stock || 0;

  const discountedPrice = variant.price && variant.discount?.value
    ? variant.price - variant.discount.value
    : variant.price || 0;

  const discountPercentage = variant.price && variant.discount?.value
    ? Math.round((variant.discount.value / variant.price) * 100)
    : 0;

  // Debug logging for troubleshooting
  if (!isActive || totalStock === 0) {
    console.log('Product availability issue:', {
      productId: product._id,
      name: product.name,
      isActive: product.isActive,
      totalStock,
      variants: product.variants
    });
  }

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!isActive || totalStock === 0) return;
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
    if (!isActive || totalStock === 0) return;
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

  const handleFavoriteToggle = async (e) => {
    e.stopPropagation();
    if (!user) {
      return;
    }
    await toggleFavorite(product._id);
  };

  const handleCardClick = async () => {
    // Track the product view for logged-in users
    if (user && product._id) {
      await trackProductView(product._id);
    }
    
    // Navigate to product display page
    navigate(`/product/${product._id}`);
  };

  return (
<div
  onClick={handleCardClick}
  className={`
    rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all duration-500 ease-in-out hover:scale-[1.02] cursor-pointer border border-gray-200
    flex ${featured || compact ? 'flex-col' : 'flex-row'}
    h-full
    ${className}
  `}
>
      {/* Product Image */}
      <div
        className={`${
          featured || compact ? 'w-full aspect-square' : 'w-28 sm:w-32 md:w-36 flex-shrink-0'
        } relative`}
      >
        <div
          className={`w-full relative group overflow-hidden ${
            featured || compact ? 'aspect-square' : 'aspect-square sm:aspect-[3/4]'
          }`}
          onMouseEnter={() => setIsHoveringImage(true)}
          onMouseLeave={() => setIsHoveringImage(false)}
        >
          <MediaDisplay
            src={product.images?.[currentImageIndex] || null}
            alt={product.name}
            className="w-full h-full transition-all duration-1000 ease-in-out group-hover:scale-105"
            style={{
              transition: 'opacity 1.2s ease-in-out, transform 1.2s ease-in-out',
              opacity: 1
            }}
            aspectRatio="auto"
            objectFit="cover"
          />

          <button
            onClick={handleFavoriteToggle}
            className={`absolute top-2 left-2 p-1.5 transition-all duration-200 border ${
              isFavorite(product._id)
                ? 'bg-red-500 text-white shadow-md border-red-500'
                : 'bg-white bg-opacity-80 text-gray-600 hover:bg-opacity-100 hover:text-red-500 border-gray-300'
            }`}
            title={isFavorite(product._id) ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className={`w-4 h-4 ${isFavorite(product._id) ? 'fill-current' : ''}`}
            />
          </button>

          {/* Discount Badge on Image */}
       

          {/* Image dots indicator for multiple images - smooth and clean */}
          {product.images && product.images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1.5">
              {product.images.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 transition-all duration-500 ease-in-out ${
                    index === currentImageIndex
                      ? 'bg-white shadow-lg scale-110'
                      : 'bg-white bg-opacity-50 hover:bg-opacity-75'
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
            } cursor-pointer hover:text-pink-500 mb-1`}
            onClick={handleCardClick}
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
      {/* Square outline + shape */}
      <svg
        className="w-4 h-4"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Square outline */}
        <rect
          x="1"
          y="1"
          width="18"
          height="18"
          stroke={product.hasEgg ? '#F97316' : '#22C55E'}
          strokeWidth="2"
          fill="none"
        />

        {product.hasEgg ? (
          // Triangle for WITH EGG
          <polygon points="10,4 16,16 4,16" fill="#F97316" />
        ) : (
          // Circle for EGGLESS
          <circle cx="10" cy="10" r="5" fill="#22C55E" />
        )}
      </svg>

      <span className="uppercase tracking-tight font-medium">
        {product.hasEgg ? 'WITH EGG' : 'EGGLESS'}
      </span>
    </div>
  </span>
</div>

{/* Pricing */}
<div className="flex flex-col space-y-1">
  <div className="flex items-baseline space-x-2">
              {discountedPrice !== variant.price && (
                <span className="text-gray-500 line-through text-xs">
                  ₹{Math.round(variant.price)}
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
              <span className=" text-green-500 text-xs font-xs px-2 py-1   transition-transform duration-200">
                {discountPercentage}% OFF
              </span>
            )}
          </div>

          {totalStock > 0 && totalStock < 15 && (
            <span className="text-red-500 font-medium text-sm mb-2">
              Only {totalStock} left
            </span>
          )}

          {totalStock === 0 && (
            <span className="text-gray-500 font-medium text-sm mb-2">
              Out of Stock
            </span>
          )}
        </div>

        <div className={`${compact ? 'space-y-1 sm:space-y-2' : 'space-y-2'}`}>
          {currentQuantity > 0 ? (
            <div className="flex items-center justify-center bg-white p-2 border border-gray-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuantityChange(currentQuantity - 1);
                }}
                className="w-6 h-6 flex items-center justify-center bg-white text-black transition-colors border border-black hover:bg-gray-50"
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
                disabled={currentQuantity >= totalStock}
                className="w-6 h-6 flex items-center justify-center bg-white text-black transition-colors border border-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={!isActive || totalStock === 0 || isAddingToCart}
              className={`w-full py-2 px-3 text-xs font-medium transition-all duration-200 border ${
                !isActive || totalStock === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300'
                  : isAddingToCart
                  ? 'bg-gray-200 text-black cursor-wait border-gray-400'
                  : 'bg-white text-black border-black hover:bg-gray-50'
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
            disabled={!isActive || totalStock === 0}
            className={`w-full py-2 px-3 text-xs font-medium transition-all duration-200 ${
              !isActive || totalStock === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {!isActive
              ? 'Unavailable'
              : totalStock === 0
              ? 'Out of Stock'
              : 'Reserve Yours'}
          </button>
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
    hasEgg: PropTypes.bool,
  }).isRequired,
  className: PropTypes.string,
  compact: PropTypes.bool,
  featured: PropTypes.bool,
};

export default ProductCard;
