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
      console.log('Initializing user data for:', user.uid);
      
      // Initialize favorites if not already loaded
      if (favoritesStatus === 'idle') {
        console.log('Fetching favorites...');
        dispatch(fetchFavorites());
      }
      
      // Initialize cart if not already loaded
      if (!cartLoaded) {
        console.log('Fetching cart...');
        dispatch(fetchCart());
      }
    }
  }, [isAuthenticated, user, favoritesStatus, cartLoaded, dispatch]);
};

export default useInitializeUserData;