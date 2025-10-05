import { createListenerMiddleware } from '@reduxjs/toolkit';
import {
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  fetchCart,
  syncLocalCart,
  resetCartState
} from './cartSlice';

// Import logout action from userSlice
import { logout } from './userSlice';

// Create listener middleware for cart persistence and synchronization
export const cartMiddleware = createListenerMiddleware();

// Cache management constants
const CART_CACHE_KEY = 'lapatisserie_cart_cache';
const CART_CACHE_TIMESTAMP_KEY = 'lapatisserie_cart_cache_timestamp';
const LOCAL_CART_KEY = 'lapatisserie_cart';

// Helper functions
const saveToCache = (data) => {
  try {
    localStorage.setItem(CART_CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CART_CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error saving cart to cache:', error);
  }
};

const saveToLocalStorage = (items) => {
  try {
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
  }
};

const clearLocalStorage = () => {
  try {
    localStorage.removeItem(LOCAL_CART_KEY);
    localStorage.removeItem(CART_CACHE_KEY);
    localStorage.removeItem(CART_CACHE_TIMESTAMP_KEY);
  } catch (error) {
    console.error('Error clearing cart from localStorage:', error);
  }
};

// Listen for successful cart operations and update cache
cartMiddleware.startListening({
  actionCreator: fetchCart.fulfilled,
  effect: (action, listenerApi) => {
    const { items, cartTotal, cartCount } = action.payload;
    
    // Cache the cart data
    const cacheData = {
      items: items.map(item => ({
        id: item._id,
        productId: item.productId,
        name: item.productDetails.name,
        price: item.productDetails.price,
        image: item.productDetails.image,
        quantity: item.quantity,
        addedAt: item.addedAt,
        productDetails: item.productDetails
      })),
      cartTotal,
      cartCount
    };
    
    saveToCache(cacheData);
    console.log('💾 Cart cached successfully');
  }
});

// Listen for successful add to cart and update cache
cartMiddleware.startListening({
  actionCreator: addToCart.fulfilled,
  effect: (action, listenerApi) => {
    const state = listenerApi.getState();
    const { items, cartTotal, cartCount } = state.cart;
    
    const cacheData = { items, cartTotal, cartCount };
    saveToCache(cacheData);
    console.log('💾 Cart updated in cache after add');
  }
});

// Listen for successful quantity updates and update cache
cartMiddleware.startListening({
  actionCreator: updateCartQuantity.fulfilled,
  effect: (action, listenerApi) => {
    const state = listenerApi.getState();
    const { items, cartTotal, cartCount } = state.cart;
    
    const cacheData = { items, cartTotal, cartCount };
    saveToCache(cacheData);
    console.log('💾 Cart updated in cache after quantity change');
  }
});

// Listen for successful removal and update cache
cartMiddleware.startListening({
  actionCreator: removeFromCart.fulfilled,
  effect: (action, listenerApi) => {
    const state = listenerApi.getState();
    const { items, cartTotal, cartCount } = state.cart;
    
    const cacheData = { items, cartTotal, cartCount };
    saveToCache(cacheData);
    console.log('💾 Cart updated in cache after item removal');
  }
});

// Listen for cart clear and clear cache
cartMiddleware.startListening({
  actionCreator: clearCart.fulfilled,
  effect: (action, listenerApi) => {
    clearLocalStorage();
    console.log('🧹 Cart cache cleared');
  }
});

// For guest users, save to localStorage
cartMiddleware.startListening({
  predicate: (action, currentState, previousState) => {
    // Check if cart items changed and user is not authenticated
    const currentCart = currentState.cart;
    const previousCart = previousState.cart;
    
    // Assume user is guest if dbCartLoaded is false
    // This is a simplified check - in real app you'd have user state
    return (
      !currentCart.dbCartLoaded &&
      currentCart.items !== previousCart.items &&
      currentCart.items.length > 0
    );
  },
  effect: (action, listenerApi) => {
    const state = listenerApi.getState();
    const { items } = state.cart;
    
    // Save guest cart to localStorage
    saveToLocalStorage(items);
    console.log('👤 Guest cart saved to localStorage');
  }
});

// 🛠️ FIX: Listen for user logout and reset cart state
cartMiddleware.startListening({
  actionCreator: logout,
  effect: (action, listenerApi) => {
    console.log('🔄 User logged out - resetting cart state and clearing localStorage');
    
    // Clear all cart-related localStorage
    clearLocalStorage();
    
    // Reset cart state
    listenerApi.dispatch(resetCartState());
  }
});

export default cartMiddleware;