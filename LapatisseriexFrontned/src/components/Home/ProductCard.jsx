import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import MediaDisplay from '../common/MediaDisplay';
import ImageSlideshow from '../common/ImageSlideshow';


const ProductCard = ({ 
  product,
  className = '',
  compact = false
}) => {
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
  // Calculate discounted price
    const discountedPrice = product.variants[0].price && product.variants[0].discount.value
    ? product.variants[0].price - product.variants[0].discount.value
    : product.variants[0].price;

  return (
    <Link 
      to={`/product/${product._id}`}
      className={`product-card block relative rounded-2xl overflow-hidden ${
        compact ? 'border border-gray-100' : 'shadow-lg'
      } bg-white ${className}`}
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
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Top Right Badges */}
        <div className="absolute top-3 right-3 flex flex-col space-y-2"></div>
        {/* Image Navigation Dots for multiple images */}
        {product.images && product.images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {product.images.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
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

        {/* Title */}
        <h3 className={`font-semibold text-gray-900 line-clamp-1 ${
          compact ? 'text-sm' : 'text-lg'
        }`}>
          {product.name}
        </h3>

        {/* Short Description */}
        {!compact && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-4 min-h-[2.5rem]">
            {product.description}
          </p>
        )}  

        <p>
          <span className="text-green-600 font-bold">
            ₹{Math.round(discountedPrice)}
          </span>{' '}
          {discountedPrice !== product.variants[0].price? (
            <span className="line-through text-gray-500 ml-2">
              ₹{Math.round(product.variants[0].price)}
            </span>
          ) : null}
        </p>


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