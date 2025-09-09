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

  const getStockStatus = () => {
    if (!product.isActive) {
      return { label: 'Unavailable', color: 'bg-gray-500', icon: '❌' };
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

  return (
    <Link 
      to={`/product/${product._id}`}
      className={`product-card block relative rounded-2xl overflow-hidden ${
        compact ? 'border border-gray-100' : 'shadow-lg'
      } bg-white ${className}`}
    >
      <div className={`relative overflow-hidden ${compact ? 'h-32' : 'h-56 sm:h-64'}`}>
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
        {product.images && product.images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {product.images.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
      <div className={`p-4 ${compact ? '' : 'p-5'}`}>
        <h3 className={`font-semibold text-gray-900 line-clamp-1 ${
          compact ? 'text-sm' : 'text-lg'
        }`}>
          {product.name}
        </h3>
        {!compact && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-4 min-h-[2.5rem]">
            {product.description}
          </p>
        )}
        <p>
          <span className="text-green-600 font-bold">
            ₹{Math.round(discountedPrice)}
          </span>{' '}
          {discountedPrice !== product.variants[0].price && (
            <span className="line-through text-gray-500 ml-2">
              ₹{Math.round(product.variants[0].price)}
            </span>
          )}
        </p>
        {/* Stock status removed as requested */}
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
