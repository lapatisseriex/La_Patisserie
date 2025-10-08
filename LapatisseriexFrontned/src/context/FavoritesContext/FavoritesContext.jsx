import React, { createContext, useContext, useEffect, useCallback } from 'react';
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
  
  // Get data from Redux store
  const favorites = useSelector(state => state.favorites.favorites);
  const favoriteIds = useSelector(state => state.favorites.favoriteIds);
  const count = useSelector(state => state.favorites.count);
  const status = useSelector(state => state.favorites.status);
  const error = useSelector(state => state.favorites.error);
  
  const isLoading = status === 'loading';
  
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
  const toggleFavorite = useCallback((productId) => {
    if (!productId) return;
    
    const isCurrentlyFavorite = favoriteIds.includes(productId);
    
    if (isCurrentlyFavorite) {
      // Remove from favorites
      if (user) {
        dispatch(removeFromFavoritesThunk(productId))
          .then(() => {
            // Refresh favorites data after removing
            dispatch(fetchFavorites());
          });
      } else {
        dispatch(localRemoveFromFavorites(productId));
      }
    } else {
      // Add to favorites
      if (user) {
        dispatch(addToFavoritesThunk(productId))
          .then(() => {
            // Refresh favorites data after adding
            dispatch(fetchFavorites());
          });
      } else {
        dispatch(localAddToFavorites(productId));
      }
    }
  }, [dispatch, favoriteIds, user]);
  
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
    clearUserFavorites
  };
  
  return (
    <FavoritesContext.Provider value={contextValue}>
      {children}
    </FavoritesContext.Provider>
  );
};