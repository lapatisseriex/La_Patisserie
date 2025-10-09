import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useFavorites } from '../../context/FavoritesContext/FavoritesContext';
import { calculatePricing } from '../../utils/pricingUtils';

const FavoriteProductCard = ({ product }) => {
  const { toggleFavorite } = useFavorites();

  if (!product) {
    return null;
  }

  // Use centralized pricing calculation for consistency
  const variant = product.variants?.[0] || { price: 0, discount: { value: 0 }, stock: 0 };
  const pricing = calculatePricing(variant);

  const handleRemove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product._id);
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
      <Link to={`/product/${product._id}`} className="block">
        <div className="relative">
          {/* Product Image */}
          <div className="w-full aspect-square overflow-hidden rounded-t-lg">
            <img 
              src={product.images && product.images.length > 0 && product.images[0]?.url 
                ? product.images[0].url 
                : '/placeholder-image.jpg'} 
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/placeholder-image.jpg';
              }}
            />
          </div>
          
          {/* Favorite Button */}
          <button
            onClick={handleRemove}
            className="absolute top-3 right-3 bg-white bg-opacity-70 rounded-full p-2 shadow-md hover:bg-opacity-100 transition-all duration-200"
            aria-label="Remove from favorites"
          >
            <Heart className="w-5 h-5 text-rose-500 fill-current" />
          </button>
          
          {/* Badge if any */}
          {product.badge && (
            <div className="absolute top-3 left-3 bg-rose-500 text-white text-xs px-2 py-1 rounded-md">
              {product.badge}
            </div>
          )}
        </div>
        
        <div className="p-4">
          {/* Product Name */}
          <h3 className="text-lg font-medium mb-1 line-clamp-1">{product.name}</h3>
          
          {/* Product Description */}
          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
            {product.description || 'No description available'}
          </p>
          
          {/* Price */}
          <div className="mt-2 flex justify-between items-center">
            <div className="text-lg font-bold text-rose-600">
              ₹{Math.round(pricing.finalPrice)}
              {pricing.mrp > pricing.finalPrice && (
                <span className="text-sm text-gray-500 line-through ml-2">
                  ₹{Math.round(pricing.mrp)}
                </span>
              )}
            </div>
            
            {/* Veg/Non-veg Indicator */}
            <div className="border border-green-600 p-0.5 rounded">
              <div className={`w-3 h-3 rounded-full ${product.isVeg ? 'bg-green-600' : 'bg-red-600'}`}></div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default FavoriteProductCard;