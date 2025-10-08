import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchFavorites } from '../redux/favoritesSlice';
import { fetchCart } from '../redux/cartSlice';

export const useInitializeUserData = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const favoritesStatus = useSelector(state => state.favorites.status);
  const cartLoaded = useSelector(state => state.cart.dbCartLoaded);

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
      
      // Initialize cart if not already loaded
      if (!cartLoaded) {
        console.log('useInitializeUserData - Fetching cart...');
        dispatch(fetchCart());
      }
    }
  }, [isAuthenticated, user, favoritesStatus, cartLoaded, dispatch]);
  
  // Additional effect to handle token availability for initialization
  useEffect(() => {
    if (isAuthenticated && user && (favoritesStatus === 'idle' || !cartLoaded)) {
      const checkTokenAndInitialize = () => {
        const token = localStorage.getItem('authToken');
        if (token) {
          // Initialize favorites if needed
          if (favoritesStatus === 'idle') {
            console.log('useInitializeUserData - Token now available, initializing favorites...');
            dispatch(fetchFavorites());
          }
          
          // Initialize cart if needed
          if (!cartLoaded) {
            console.log('useInitializeUserData - Token available, initializing cart...');
            dispatch(fetchCart());
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
  }, [dispatch, isAuthenticated, user, favoritesStatus, cartLoaded]);
};

export default useInitializeUserData;