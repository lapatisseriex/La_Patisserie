import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useFavorites } from '../../context/FavoritesContext/FavoritesContext';

const FavoritesIcon = () => {
  const { count } = useFavorites();
  
  return (
    <div className="tooltip">
      <div className="tooltip-content">
        <div className="animate-bounce text-[#A855F7] -rotate-10 text-sm font-black italic select-none">Favorites</div>
      </div>
      <Link 
        to="/favorites" 
        className="flex items-center px-3 py-2 rounded-lg transition-all duration-300 relative group" 
        style={{fontFamily: 'sans-serif', color: '#281c20'}}
        data-favorites-icon="true"
      >
        <Heart className="h-4 w-4 transition-colors duration-300" style={{color: '#281c20'}} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-[#733857] to-[#281c20] text-white text-xs px-1.5 py-0.5 rounded-full min-w-[1.25rem] h-5 flex items-center justify-center font-medium shadow-lg">
            {count}
          </span>
        )}
      </Link>
    </div>
  );
};

export default FavoritesIcon;