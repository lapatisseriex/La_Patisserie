import React from 'react';
import PropTypes from 'prop-types';
import { Heart, Loader2 } from 'lucide-react';
import { useFavorites } from '../../context/FavoritesContext/FavoritesContext';

const FavoriteButton = ({ productId, size = 'md', className = '' }) => {
  const { toggleFavorite, isFavorite, loading, isPending } = useFavorites();
  
  // Check if product is in favorites
  const isFavorited = isFavorite(productId);
  
  // Handle click
  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPending(productId)) return;
    await toggleFavorite(productId);
  };
  
  // Determine size of heart icon
  const iconSize = {
    'sm': 'h-3.5 w-3.5',
    'md': 'h-5 w-5',
    'lg': 'h-6 w-6'
  };
  
  const pending = isPending(productId);

  return (
    <button
      type="button"
      onClick={handleClick}
  disabled={pending}
      className={`
        relative z-10 
        transition-all duration-300 
        hover:scale-110 active:scale-95
        ${isFavorited 
          ? 'text-rose-500 hover:text-rose-600 drop-shadow-sm' 
          : 'text-gray-400 hover:text-rose-500'
        }
  ${pending ? 'opacity-50 cursor-not-allowed' : 'opacity-100 cursor-pointer'}
        ${className}
      `}
      aria-label={pending ? 'Saving…' : (isFavorited ? 'Remove from favorites' : 'Add to favorites')}
      title={pending ? 'Saving…' : (isFavorited ? 'Remove from favorites' : 'Add to favorites')}
    >
      <span className={`inline-flex items-center justify-center ${iconSize[size]}`}>
        {pending ? (
          <Loader2 className="h-full w-full animate-spin" />
        ) : (
          <Heart 
            className={`
              h-full w-full 
              transition-all duration-300
              ${isFavorited ? 'fill-current animate-pulse' : 'stroke-2 hover:stroke-1'}
            `} 
          />
        )}
      </span>
    </button>
  );
};

FavoriteButton.propTypes = {
  productId: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string};

export default FavoriteButton;