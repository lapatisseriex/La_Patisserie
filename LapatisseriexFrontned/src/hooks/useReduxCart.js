import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchCart, 
  addToCart, 
  updateCartQuantity, 
  removeFromCart, 
  clearCart 
} from '../redux/cartSlice';

export const useReduxCart = () => {
  const dispatch = useDispatch();
  
  const cartState = useSelector(state => state.cart);
  
  const {
    items: cartItems,
    cartTotal,
    cartCount,
    isLoading,
    error,
    dbCartLoaded
  } = cartState;

  // Action creators
  const actions = {
    fetchCart: () => dispatch(fetchCart()),
    addToCart: (product, quantity = 1, variantIndex = 0) => 
      dispatch(addToCart({ product, quantity, variantIndex })),
    updateQuantity: (productId, quantity) => 
      dispatch(updateCartQuantity({ productId, quantity })),
    removeFromCart: (productId) => 
      dispatch(removeFromCart(productId)),
    clearCart: () => dispatch(clearCart())
  };

  return {
    // State
    cartItems,
    cartTotal,
    cartCount,
    isLoading,
    error,
    dbCartLoaded,
    
    // Actions
    ...actions,
    
    // Computed values
    isEmpty: !cartItems || cartItems.length === 0,
    hasItems: cartItems && cartItems.length > 0,
    
    // Helper functions
    isItemInCart: (productId) => {
      return cartItems?.some(item => item.productId === productId) || false;
    },
    
    getItemQuantity: (productId) => {
      const item = cartItems?.find(item => item.productId === productId);
      return item?.quantity || 0;
    }
  };
};

export default useReduxCart;