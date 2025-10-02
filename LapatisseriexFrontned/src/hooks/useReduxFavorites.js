import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchFavorites, 
  addToFavorites, 
  removeFromFavorites 
} from '../redux/favoritesSlice';

export const useReduxFavorites = () => {
  const dispatch = useDispatch();
  
  const favoritesState = useSelector(state => state.favorites);
  
  const {
    favorites,
    favoriteIds,
    count,
    status,
    error
  } = favoritesState;

  // Action creators
  const actions = {
    fetchFavorites: () => dispatch(fetchFavorites()),
    addToFavorites: (productId) => dispatch(addToFavorites(productId)),
    removeFromFavorites: (productId) => dispatch(removeFromFavorites(productId)),
    toggleFavorite: (productId) => {
      if (favoriteIds.includes(productId)) {
        dispatch(removeFromFavorites(productId));
      } else {
        dispatch(addToFavorites(productId));
      }
    }
  };

  return {
    // State
    favorites,
    favoriteIds,
    count,
    status,
    error,
    
    // Loading states
    isLoading: status === 'loading',
    isIdle: status === 'idle',
    isSucceeded: status === 'succeeded',
    isFailed: status === 'failed',
    
    // Actions
    ...actions,
    
    // Computed values
    isEmpty: !favorites || favorites.length === 0,
    hasFavorites: favorites && favorites.length > 0,
    
    // Helper functions
    isFavorite: (productId) => {
      return favoriteIds.includes(productId);
    },
    
    getFavoriteProduct: (productId) => {
      return favorites?.find(product => 
        (product._id || product.productId) === productId
      );
    }
  };
};

export default useReduxFavorites;