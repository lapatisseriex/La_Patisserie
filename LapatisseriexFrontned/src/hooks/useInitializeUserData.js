import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchFavorites } from '../redux/favoritesSlice';

export const useInitializeUserData = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const favoritesStatus = useSelector(state => state.favorites.status);
  // Cart initialization is handled by useCart globally

  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if we have a valid token before making API calls
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('useInitializeUserData - User authenticated but no token yet, waiting...');
        return;
      }
      
      console.log('Initializing user data for:', user.uid);
      
      // Initialize favorites if not already loaded
      if (favoritesStatus === 'idle') {
        console.log('useInitializeUserData - Fetching favorites with valid token...');
        dispatch(fetchFavorites());
      }
    }
  }, [isAuthenticated, user, favoritesStatus, dispatch]);
  
  // Additional effect to handle token availability for initialization
  useEffect(() => {
    if (isAuthenticated && user && (favoritesStatus === 'idle')) {
      const checkTokenAndInitialize = () => {
        const token = localStorage.getItem('authToken');
        if (token) {
          if (favoritesStatus === 'idle') {
            console.log('useInitializeUserData - Token now available, initializing favorites...');
            dispatch(fetchFavorites());
          }
        }
      };
      
      // Check immediately
      checkTokenAndInitialize();
      
      // Check periodically for the first 10 seconds
      const intervalId = setInterval(checkTokenAndInitialize, 1000);
      const timeoutId = setTimeout(() => clearInterval(intervalId), 10000);
      
      return () => {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
      };
    }
  }, [dispatch, isAuthenticated, user, favoritesStatus]);
};

export default useInitializeUserData;