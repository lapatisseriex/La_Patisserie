import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useFavorites } from '../../context/FavoritesContext/FavoritesContext';

const FavoriteNotification = () => {
  const [notification, setNotification] = useState(null);
  const { favoriteIds } = useFavorites();
  
  useEffect(() => {
    const lastFavoriteId = localStorage.getItem('lastFavoriteId');
    const currentIds = JSON.stringify(favoriteIds.sort());
    const previousIds = localStorage.getItem('previousFavoriteIds') || '[]';
    
    // Update previous favorites in localStorage
    localStorage.setItem('previousFavoriteIds', currentIds);
    
    // If a favorite was added or removed recently
    if (lastFavoriteId) {
      const parsedPreviousIds = JSON.parse(previousIds);
      const isAdded = favoriteIds.includes(lastFavoriteId) && !parsedPreviousIds.includes(lastFavoriteId);
      const isRemoved = !favoriteIds.includes(lastFavoriteId) && parsedPreviousIds.includes(lastFavoriteId);
      
      if (isAdded || isRemoved) {
        setNotification({
          type: isAdded ? 'added' : 'removed',
          id: lastFavoriteId
        });
        
        // Clear notification after 3 seconds
        setTimeout(() => {
          setNotification(null);
          localStorage.removeItem('lastFavoriteId');
        }, 3000);
      }
      
      // Clear lastFavoriteId from localStorage
      localStorage.removeItem('lastFavoriteId');
    }
  }, [favoriteIds]);
  
  if (!notification) return null;
  
  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 right-4 z-50"
        >
          <div className="flex items-center bg-white p-3 rounded-lg shadow-lg border border-gray-100">
            <Heart className={`h-5 w-5 mr-2 ${notification.type === 'added' ? 'text-rose-500 fill-current' : 'text-gray-400'}`} />
            <span className="text-sm font-medium">
              {notification.type === 'added'
                ? 'Added to favorites'
                : 'Removed from favorites'}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FavoriteNotification;