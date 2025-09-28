import React from 'react';
import PropTypes from 'prop-types';
import { Heart } from 'lucide-react';
import { useFavorites } from '../../context/FavoritesContext/FavoritesContext';

const FavoriteButton = ({ productId, size = 'md', className = '' }) => {
  const { toggleFavorite, isFavorite, loading } = useFavorites();
  
  // Check if product is in favorites
  const isFavorited = isFavorite(productId);
  
  // Handle click
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(productId);
  };
  
  // Determine size of heart icon
  const iconSize = {
    'sm': 'h-3.5 w-3.5',
    'md': 'h-5 w-5',
    'lg': 'h-6 w-6'
  };
  
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`
        relative z-10 
        transition-all duration-300 
        hover:scale-110 active:scale-95
        ${isFavorited 
          ? 'text-rose-500 hover:text-rose-600 drop-shadow-sm' 
          : 'text-gray-400 hover:text-rose-500'
        }
        ${loading ? 'opacity-50 cursor-not-allowed' : 'opacity-100 cursor-pointer'}
        ${className}
      `}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart 
        className={`
          ${iconSize[size]} 
          transition-all duration-300
          ${isFavorited ? 'fill-current animate-pulse' : 'stroke-2 hover:stroke-1'}
        `} 
      />
    </button>
  );
};

FavoriteButton.propTypes = {
  productId: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
};

export default FavoriteButton;