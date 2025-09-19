import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext/AuthContext';
import api, { apiGet } from '../../services/apiService';

const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const API_URL = import.meta.env.VITE_API_URL;
  const fetchingRef = useRef(false);
  const favoritesRef = useRef([]);

  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  const cacheKey = (uid) => `favorites_cache_${uid}`;

  const readCache = () => {
    if (!user?.uid) return null;
    try {
      const raw = localStorage.getItem(cacheKey(user.uid));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed.timestamp && parsed.timestamp + CACHE_TTL > Date.now()) {
        return parsed.favorites || [];
      }
      return null;
    } catch {
      return null;
    }
  };

  const writeCache = (data) => {
    if (!user?.uid) return;
    try {
      localStorage.setItem(
        cacheKey(user.uid),
        JSON.stringify({ favorites: data, timestamp: Date.now() })
      );
    } catch {}
  };

  // Fetch user's favorites
  const fetchFavorites = async () => {
    if (!user) {
      setFavorites([]);
      return;
    }

    try {
      // Only show spinner if we don't have cached data displayed
      const hasData = favoritesRef.current && favoritesRef.current.length > 0;
      if (!hasData) setLoading(true);
      setError(null);
      if (fetchingRef.current) return; // guard against rapid re-entry
      fetchingRef.current = true;

      // Use apiGet with de-dup and short cache to minimize redundant calls
      const data = await apiGet('/users/favorites', {
        cache: true,
        cacheTTL: 15000,
        dedupe: true
      });

      const list = data.favorites || [];
      setFavorites(list);
      favoritesRef.current = list;
      writeCache(list);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError('Failed to load favorites');
      setFavorites([]);
      favoritesRef.current = [];
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  };

  // Add product to favorites with optimistic update
  const addToFavorites = async (productId) => {
    if (!user) {
      setError('Please login to add favorites');
      return false;
    }

  // Avoid duplicating if already present in UI
    setFavorites(prev => {
      const next = prev.some(f => f._id === productId) ? prev : [...prev, { _id: productId, name: 'Loading...', images: [] }];
      favoritesRef.current = next;
      writeCache(next);
      return next;
    });

    try {
      // Auth headers handled by apiService interceptor
      const response = await api.post(`/users/favorites/${productId}`, {});

      // Update with actual product data if returned by API
      if (response.data.product) {
        setFavorites(prevFavorites => {
          const next = prevFavorites.map(fav => fav._id === productId ? response.data.product : fav);
          favoritesRef.current = next;
          writeCache(next);
          return next;
        });
      }

      return true;
    } catch (err) {
      console.error('Error adding to favorites:', err);
      setError(err.response?.data?.message || 'Failed to add to favorites');
      
      // Rollback optimistic update on error
      setFavorites(prevFavorites => {
        const next = prevFavorites.filter(fav => fav._id !== productId);
        favoritesRef.current = next;
        writeCache(next);
        return next;
      });
      
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
      // Auth headers handled by apiService interceptor
      await api.delete(`/users/favorites/${productId}`);

      return true;
    } catch (err) {
      console.error('Error removing from favorites:', err);
      setError(err.response?.data?.message || 'Failed to remove from favorites');
      
      // Rollback optimistic update on error
      if (favoriteItem) {
        setFavorites(prevFavorites => {
          const next = [...prevFavorites, favoriteItem];
          favoritesRef.current = next;
          writeCache(next);
          return next;
        });
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
    // Load from cache immediately for instant UI
    const cached = readCache();
    if (cached && cached.length) {
      setFavorites(cached);
      favoritesRef.current = cached;
      setLoading(false);
    } else {
      // Reset if no cache
      setFavorites([]);
      favoritesRef.current = [];
    }
    // Always revalidate in background
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
