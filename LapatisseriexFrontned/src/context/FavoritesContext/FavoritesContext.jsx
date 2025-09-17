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

  // Add product to favorites
  const addToFavorites = async (productId) => {
    if (!user) {
      setError('Please login to add favorites');
      return false;
    }

    try {
      // Get ID token from Firebase
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);

      await axios.post(`${API_URL}/users/favorites/${productId}`, {}, {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      // Refresh favorites
      await fetchFavorites();
      return true;
    } catch (err) {
      console.error('Error adding to favorites:', err);
      setError(err.response?.data?.message || 'Failed to add to favorites');
      return false;
    }
  };

  // Remove product from favorites
  const removeFromFavorites = async (productId) => {
    if (!user) return false;

    try {
      // Get ID token from Firebase
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);

      await axios.delete(`${API_URL}/users/favorites/${productId}`, {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      // Refresh favorites
      await fetchFavorites();
      return true;
    } catch (err) {
      console.error('Error removing from favorites:', err);
      setError(err.response?.data?.message || 'Failed to remove from favorites');
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
