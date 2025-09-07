import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import MediaDisplay from '../common/MediaDisplay';
import ImageSlideshow from '../common/ImageSlideshow';
import { AlertCircle } from 'lucide-react';

const ProductCard = ({ 
  product,
  className = '',
  compact = false
}) => {
  // Handle stock status display logic
  const getStockStatus = () => {
    if (!product.isActive) {
      return { 
        label: 'Unavailable', 
        color: 'bg-gray-500',
        textColor: 'text-white'
      };
    }
    
    if (product.stock === 0) {
      return { 
        label: 'Out of Stock', 
        color: 'bg-red-500',
        textColor: 'text-white'
      };
    }
    
    if (product.stock < 5) {
      return { 
        label: 'Low Stock', 
        color: 'bg-amber-400',
        textColor: 'text-amber-800'
      };
    }
    
    return { 
      label: 'In Stock', 
      color: 'bg-green-500',
      textColor: 'text-white'
    };
  };
  
  const stockStatus = getStockStatus();
  
  // Calculate discount percentage
  const discountPercentage = product.price && product.discountPrice 
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100) 
    : 0;
  
  return (
    <Link 
      to={`/products/${product._id}`}
      className={`product-card group block relative rounded-lg overflow-hidden transition-all duration-300 ${
        compact ? 'border border-gray-100' : 'shadow-sm hover:shadow-md'
      } bg-white ${className}`}
    >
      {/* Product Image with Slideshow - clean with no text overlays */}
      <div className={`relative overflow-hidden ${compact ? 'h-28' : 'h-48 sm:h-56'}`}>
        {/* Use ImageSlideshow for multiple images, or MediaDisplay for single image */}
        {product.images && product.images.length > 1 ? (
          <ImageSlideshow
            images={product.images}
            alt={product.name}
            aspectRatio={compact ? 'auto' : '1/1'}
            className="w-full h-full"
          />
        ) : (
          <MediaDisplay
            src={product.images?.[0] || ''}
            alt={product.name}
            aspectRatio={compact ? 'auto' : '1/1'}
          />
        )}
        
        {/* Removed Category Badge as requested */}

        {/* Discount Badge is now only shown below with the price */}        {/* Stock Status Badge - shown below product details instead of on image */}
        {/* Removed from image overlay as requested */}
      </div>
      
      {/* Product Details */}
      <div className={`p-2 ${compact ? '' : 'p-3'}`}>
        {/* Title */}
        <h3 className={`font-medium text-gray-800 line-clamp-1 ${compact ? 'text-sm' : ''}`}>
          {product.name}
        </h3>
        
        {/* Short Description */}
        {!compact && (
          <p className="text-xs text-gray-500 line-clamp-2 mt-1 mb-2 min-h-[2.5rem]">
            {product.description}
          </p>
        )}
        
        {/* Price section */}
        <div className="mt-2">
          {/* Price display */}
          <div className="flex items-baseline gap-1">
            {product.discountPrice ? (
              <>
                <span className={`font-semibold text-black ${compact ? 'text-sm' : ''}`}>
                  ₹{(typeof product.discountPrice === 'number' ? product.discountPrice : '0')}
                </span>
                <span className="text-gray-500 line-through text-xs">
                  ₹{(typeof product.price === 'number' ? product.price : '0')}
                </span>
                {/* Discount Badge - styled to match screenshot */}
                {discountPercentage > 0 && (
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-sm ml-1">
                    {discountPercentage}% OFF
                  </span>
                )}
              </>
            ) : (
              <span className={`font-semibold text-black ${compact ? 'text-sm' : ''}`}>
                ₹{(typeof product.price === 'number' ? product.price : '0')}
              </span>
            )}
          </div>
        </div>
        
        {/* Badge (e.g. Best seller) - styled to match screenshot */}
        {product.badge && (
          <div className="mt-1.5">
            <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium px-2 py-0.5 rounded-sm">
              {product.badge}
            </span>
          </div>
        )}
        
        {/* Stock Status and Not active warning */}
        {!product.isActive ? (
          <div className="flex items-center mt-1 text-xs text-red-500">
            <AlertCircle size={12} className="mr-1" />
            <span>Product unavailable</span>
          </div>
        ) : product.stock === 0 ? (
          <div className="flex items-center mt-1 text-xs text-red-500">
            <AlertCircle size={12} className="mr-1" />
            <span>Out of stock</span>
          </div>
        ) : product.stock < 5 ? (
          <div className="flex items-center mt-1 text-xs text-amber-600">
            <AlertCircle size={12} className="mr-1" />
            <span>Low stock</span>
          </div>
        ) : null}
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
    badge: PropTypes.string
  }).isRequired,
  className: PropTypes.string,
  compact: PropTypes.bool
};

export default ProductCard;
