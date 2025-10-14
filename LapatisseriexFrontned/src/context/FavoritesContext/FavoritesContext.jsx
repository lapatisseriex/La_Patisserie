import React, { createContext, useContext, useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { fetchProductById } from '../../redux/productsSlice';
import { 
  fetchFavorites, 
  addToFavorites as addToFavoritesThunk, 
  removeFromFavorites as removeFromFavoritesThunk,
  localAddToFavorites,
  localRemoveFromFavorites,
  loadLocalFavorites,
  clearFavorites
} from '../../redux/favoritesSlice';

// Create context
const FavoritesContext = createContext();

// Custom hook to use the favorites context
export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

// Provider component
export const FavoritesProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [pendingIds, setPendingIds] = useState(new Set());
  // Track the desired target state for each pending productId (true = should be favorited, false = should be removed)
  const [pendingTargets, setPendingTargets] = useState(new Map());
  // Track timeouts to avoid permanent locks if something goes wrong
  const pendingTimeoutsRef = useRef(new Map());
  
  // Get data from Redux store
  const favorites = useSelector(state => state.favorites.favorites);
  const favoriteIds = useSelector(state => state.favorites.favoriteIds);
  const count = useSelector(state => state.favorites.count);
  const status = useSelector(state => state.favorites.status);
  const error = useSelector(state => state.favorites.error);
  
  const isLoading = status === 'loading';

  // Helpers to manage per-product pending state
  const setPending = useCallback((id, value) => {
    if (!id) return;
    setPendingIds(prev => {
      const next = new Set(prev);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const isPending = useCallback((id) => {
    if (!id) return false;
    return pendingIds.has(id);
  }, [pendingIds]);

  const setPendingTarget = useCallback((id, target) => {
    if (!id) return;
    setPendingTargets(prev => {
      const next = new Map(prev);
      if (target === null || target === undefined) {
        next.delete(id);
      } else {
        next.set(id, !!target);
      }
      return next;
    });
  }, []);
  
  // Load favorites when component mounts and user is properly authenticated
  useEffect(() => {
    if (user) {
      // Only proceed if we have a valid token - no immediate fetchFavorites call
      const token = localStorage.getItem('authToken');
      if (token) {
        console.log('FavoritesContext - User authenticated with token, fetching favorites...');
        dispatch(fetchFavorites());
      } else {
        console.log('FavoritesContext - User exists but no token yet, will wait for token availability...');
        // Don't make any API calls until token is available
      }
    } else {
      // Guest user, load favorites from localStorage
      dispatch(loadLocalFavorites());
    }
  }, [dispatch, user]);
  
  // Additional effect to handle token availability
  useEffect(() => {
    if (user && status === 'idle') {
      const checkAndFetchFavorites = () => {
        const token = localStorage.getItem('authToken');
        if (token) {
          console.log('FavoritesContext - Token now available, fetching favorites...');
          dispatch(fetchFavorites());
        }
      };
      
      // Check immediately
      checkAndFetchFavorites();
      
      // Only set up interval if token wasn't found immediately
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('FavoritesContext - No token yet, setting up retry interval...');
        // Check periodically for the first 10 seconds after user login
        const intervalId = setInterval(checkAndFetchFavorites, 1000);
        const timeoutId = setTimeout(() => {
          clearInterval(intervalId);
          console.log('FavoritesContext - Token retry timeout reached, stopping checks');
        }, 10000);
        
        return () => {
          clearInterval(intervalId);
          clearTimeout(timeoutId);
        };
      }
    }
  }, [dispatch, user, status]);
  
  // For guest users, try to fetch product details for favoriteIds
  useEffect(() => {
    // Only for guest users with local favorites
    if (!user && favoriteIds.length > 0) {
      const loadProductDetails = async () => {
        try {
          // Fetch product details for each favorite ID
          const productPromises = favoriteIds.map(id => 
            dispatch(fetchProductById(id)).unwrap()
          );
          
          const results = await Promise.allSettled(productPromises);
          
          // Process successful results
          const loadedProducts = results
            .filter(result => result.status === 'fulfilled' && result.value)
            .map(result => result.value);
          
          // Format products for favorites array
          const favoritesWithDetails = loadedProducts.map(product => ({
            productId: product._id,
            productDetails: product
          }));
          
          // Update Redux store with product details
          if (favoritesWithDetails.length > 0) {
            dispatch({
              type: 'favorites/setFavoriteDetails',
              payload: favoritesWithDetails
            });
          }
        } catch (error) {
          console.error('Error fetching product details for favorites:', error);
        }
      };
      
      loadProductDetails();
    }
  }, [user, favoriteIds, dispatch]);
  
  // Toggle favorite
  const toggleFavorite = useCallback(async (productId) => {
    if (!productId) return;
    if (isPending(productId)) return; // lock while pending

    const isCurrentlyFavorite = favoriteIds.includes(productId);
    // Mark as pending and record the target state we expect the UI to reach
    setPending(productId, true);
    setPendingTarget(productId, !isCurrentlyFavorite);
    // Keep a snapshot to optionally roll back if API fails (simple optimistic UI)
    const prevWasFavorite = isCurrentlyFavorite;
    const prevIds = favoriteIds;
    try {
      if (isCurrentlyFavorite) {
        if (user) {
          await dispatch(removeFromFavoritesThunk(productId));
          // No extra fetch needed; slice updates favoriteIds immediately
        } else {
          dispatch(localRemoveFromFavorites(productId));
        }
      } else {
        if (user) {
          // Optimistic: mark as favorite locally so icon flips faster
          // Caution: we don't directly mutate Redux here; we rely on thunk to fulfill quickly
          await dispatch(addToFavoritesThunk(productId));
          // Avoid immediate fetch to prevent global loading; slice updates favoriteIds
        } else {
          dispatch(localAddToFavorites(productId));
        }
      }
    } catch (e) {
      // Minimal rollback hint: if add failed, clear pending so user can retry
      console.warn('toggleFavorite error', e);
    } finally {
      // Do not clear pending here; wait until UI state (favoriteIds) reflects the target
      // Set a fallback timeout to avoid permanent lock (e.g., network error)
      if (!pendingTimeoutsRef.current.has(productId)) {
        const t = setTimeout(() => {
          setPending(productId, false);
          setPendingTarget(productId, null);
          pendingTimeoutsRef.current.delete(productId);
        }, 5000);
        pendingTimeoutsRef.current.set(productId, t);
      }
    }
  }, [dispatch, favoriteIds, user, isPending, setPending, setPendingTarget]);

  // When favoriteIds changes, clear pending for items that reached their target state
  useEffect(() => {
    if (pendingIds.size === 0) return;
    pendingIds.forEach((id) => {
      const target = pendingTargets.get(id);
      if (target === undefined) return; // no target, skip
      const currentlyFav = favoriteIds.includes(id);
      const reached = (target === true && currentlyFav) || (target === false && !currentlyFav);
      if (reached) {
        setPending(id, false);
        setPendingTarget(id, null);
        // clear timeout if any
        const t = pendingTimeoutsRef.current.get(id);
        if (t) {
          clearTimeout(t);
          pendingTimeoutsRef.current.delete(id);
        }
      }
    });
  }, [favoriteIds, pendingIds, pendingTargets, setPending, setPendingTarget]);
  
  // Check if a product is in favorites
  const isFavorite = useCallback((productId) => {
    return favoriteIds.includes(productId);
  }, [favoriteIds]);
  
  // Merge local favorites with database when user logs in
  useEffect(() => {
    if (user) {
      // Load local favorites
      const localFavorites = localStorage.getItem('lapatisserie_favorites');
      if (localFavorites) {
        const parsedFavorites = JSON.parse(localFavorites);
        
        // Add each local favorite to database
        parsedFavorites.forEach(productId => {
          dispatch(addToFavoritesThunk(productId));
        });
        
        // Clear local favorites
        localStorage.removeItem('lapatisserie_favorites');
      }
    }
  }, [dispatch, user]);
  
  // Clear favorites when user logs out
  const clearUserFavorites = useCallback(() => {
    dispatch(clearFavorites());
  }, [dispatch]);
  
  // Context value
  const contextValue = {
    favorites,
    favoriteIds,
    count,
    loading: isLoading,
    error,
    toggleFavorite,
    isFavorite,
    clearUserFavorites,
    isPending
  };
  
  return (
    <FavoritesContext.Provider value={contextValue}>
      {children}
    </FavoritesContext.Provider>
  );
};