import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import MediaDisplay from '../common/MediaDisplay';
import ImageSlideshow from '../common/ImageSlideshow';
import { AlertCircle, Heart, Star, Clock, Zap } from 'lucide-react';
import { FaHeart, FaRegHeart, FaStar, FaFire } from 'react-icons/fa';

const ProductCard = ({ 
  product,
  className = '',
  compact = false
}) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Handle stock status display logic
  const getStockStatus = () => {
    if (!product.isActive) {
      return { 
        label: 'Unavailable', 
        color: 'bg-gray-500',
        icon: '❌'
      };
    }
    
    if (product.stock === 0) {
      return { 
        label: 'Out of Stock', 
        color: 'bg-red-500',
        icon: '⛔'
      };
    }
    
    if (product.stock < 5) {
      return { 
        label: 'Low Stock', 
        color: 'bg-amber-400',
        icon: '⚠️'
      };
    }
    
    return { 
      label: 'In Stock', 
      color: 'bg-green-500',
      icon: '✅'
    };
  };
  
  const stockStatus = getStockStatus();
  
  // Calculate discount percentage
  const discountPercentage = product.price && product.discountPrice 
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100) 
    : 0;

  // Handle wishlist toggle
  const toggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  return (
    <Link 
      to={`/product/${product._id}`}
      className={`product-card group block relative rounded-2xl overflow-hidden transition-all duration-500 ${
        compact ? 'border border-gray-100' : 'shadow-lg hover:shadow-2xl'
      } bg-white ${className} hover:-translate-y-2`}
    >
      {/* Product Image Container */}
      <div className={`relative overflow-hidden ${compact ? 'h-32' : 'h-56 sm:h-64'}`}>
        {/* Image Slideshow or Single Image */}
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
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        )}
        
        {/* Top Right Badges */}
        <div className="absolute top-3 right-3 flex flex-col space-y-2">
          {/* Wishlist Button */}
          <button
            onClick={toggleWishlist}
            className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-300 ${
              isWishlisted 
                ? 'bg-red-500 text-white shadow-lg' 
                : 'bg-white/90 text-gray-600 hover:bg-red-500 hover:text-white'
            } shadow-md hover:shadow-xl`}
          >
            {isWishlisted ? <FaHeart className="w-4 h-4" /> : <FaRegHeart className="w-4 h-4" />}
          </button>

          {/* Discount Badge */}
          {discountPercentage > 0 && (
            <div className="bg-gradient-to-r from-red-500 to-cakePink text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
              {discountPercentage}% OFF
            </div>
          )}
        </div>

        {/* Top Left Badges */}
        <div className="absolute top-3 left-3 flex flex-col space-y-2">
          {/* Featured Badge */}
          {product.featured && (
            <div className="bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded-full flex items-center">
              <FaFire className="w-3 h-3 mr-1" />
              Featured
            </div>
          )}

          {/* New Arrival Badge */}
          {product.isNew && (
            <div className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              NEW
            </div>
          )}
        </div>

        {/* Quick View Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-500 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span className="bg-white text-cakePink font-semibold px-4 py-2 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
            Quick View
          </span>
        </div>

        {/* Image Navigation Dots for multiple images */}
        {product.images && product.images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {product.images.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentImageIndex 
                    ? 'bg-white' 
                    : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Product Details */}
      <div className={`p-4 ${compact ? '' : 'p-5'}`}>
        {/* Category */}
        {product.category && (
          <span className="text-xs text-cakePink font-medium uppercase tracking-wide mb-2 block">
            {product.category.name}
          </span>
        )}

        {/* Title */}
        <h3 className={`font-semibold text-gray-900 line-clamp-1 group-hover:text-cakePink transition-colors ${
          compact ? 'text-sm' : 'text-lg'
        }`}>
          {product.name}
        </h3>
        
        {/* Rating */}
        <div className="flex items-center mt-2 mb-3">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <FaStar
                key={star}
                className={`w-3 h-3 ${
                  star <= (product.rating || 4.5)
                    ? 'text-amber-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500 ml-2">
            ({product.reviewCount || 128})
          </span>
        </div>

        {/* Short Description */}
        {!compact && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-4 min-h-[2.5rem]">
            {product.description}
          </p>
        )}  

        {/* Stock Status */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className={`flex items-center text-xs ${
            !product.isActive ? 'text-red-500' :
            product.stock === 0 ? 'text-red-500' :
            product.stock < 5 ? 'text-amber-500' : 'text-green-500'
          }`}>
            <span className="w-2 h-2 rounded-full bg-current mr-2"></span>
            {stockStatus.label}
            {product.stock > 0 && product.stock < 10 && (
              <span className="ml-2 text-gray-400">• Only {product.stock} left</span>
            )}
          </div>
        </div>

      </div>
    </Link>
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