import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import MediaDisplay from '../common/MediaDisplay';
import ImageSlideshow from '../common/ImageSlideshow';

const ProductCard = ({ product, className = '', compact = false }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  return (
    <Link
      to={`/product/${product._id}`}
      className={`block rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition ${className}`}
    >
      <div className={`${compact ? 'h-32' : 'h-48 sm:h-56'} overflow-hidden`}>
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
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {product.images.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full ${
                  idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className={`p-4 ${compact ? 'p-3' : 'p-4'}`}>
        <h3 className={`font-semibold text-gray-900 line-clamp-1 ${compact ? 'text-sm' : 'text-lg'}`}>
          {product.name}
        </h3>
        {!compact && (
          <p className="text-sm text-gray-600 line-clamp-2 mt-1 mb-3">
            {product.description}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-baseline space-x-2">
            <span className="text-green-600 font-bold">₹{Math.round(discountedPrice)}</span>
            {discountedPrice !== product.variants[0].price && (
              <span className="line-through text-gray-500 text-sm">
                ₹{Math.round(product.variants[0].price)}
              </span>
            )}
          </div>
          {discountPercentage > 0 && (
            <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded">
              -{discountPercentage}% OFF
            </span>
          )}
        </div>
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
