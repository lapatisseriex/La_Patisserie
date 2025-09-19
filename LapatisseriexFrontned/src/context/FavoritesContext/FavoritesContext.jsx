import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext/AuthContext';

const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch user's favorites
  const fetchFavorites = async () => {
    if (!user) {
      setFavorites([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get ID token from Firebase
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);

      const response = await axios.get(`${API_URL}/users/favorites`, {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      setFavorites(response.data.favorites || []);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError('Failed to load favorites');
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  // Add product to favorites with optimistic update
  const addToFavorites = async (productId) => {
    if (!user) {
      setError('Please login to add favorites');
      return false;
    }

    // Optimistic update - add immediately to UI with placeholder
    const placeholderProduct = { _id: productId, name: 'Loading...', images: [] };
    setFavorites(prevFavorites => [...prevFavorites, placeholderProduct]);

    try {
      // Get ID token from Firebase
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);

      const response = await axios.post(`${API_URL}/users/favorites/${productId}`, {}, {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      // Update with actual product data if returned by API
      if (response.data.product) {
        setFavorites(prevFavorites => 
          prevFavorites.map(fav => 
            fav._id === productId ? response.data.product : fav
          )
        );
      }

      return true;
    } catch (err) {
      console.error('Error adding to favorites:', err);
      setError(err.response?.data?.message || 'Failed to add to favorites');
      
      // Rollback optimistic update on error
      setFavorites(prevFavorites => 
        prevFavorites.filter(fav => fav._id !== productId)
      );
      
      return false;
    }
  };

  // Remove product from favorites with optimistic update
  const removeFromFavorites = async (productId) => {
    if (!user) return false;

    // Store the favorite item for potential rollback
    const favoriteItem = favorites.find(fav => fav._id === productId);

    // Optimistic update - remove immediately from UI
    setFavorites(prevFavorites => 
      prevFavorites.filter(fav => fav._id !== productId)
    );

    try {
      // Get ID token from Firebase
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);

      await axios.delete(`${API_URL}/users/favorites/${productId}`, {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      return true;
    } catch (err) {
      console.error('Error removing from favorites:', err);
      setError(err.response?.data?.message || 'Failed to remove from favorites');
      
      // Rollback optimistic update on error
      if (favoriteItem) {
        setFavorites(prevFavorites => [...prevFavorites, favoriteItem]);
      }
      
      return false;
    }
  };

  // Check if product is in favorites
  const isFavorite = (productId) => {
    return favorites.some(fav => fav._id === productId);
  };

  // Toggle favorite status
  const toggleFavorite = async (productId) => {
    if (isFavorite(productId)) {
      return await removeFromFavorites(productId);
    } else {
      return await addToFavorites(productId);
    }
  };

  // Fetch favorites when user changes
  useEffect(() => {
    fetchFavorites();
  }, [user]);

  const value = {
    favorites,
    loading,
    error,
    fetchFavorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    toggleFavorite
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export default FavoritesContext;
