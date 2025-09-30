import { configureStore } from '@reduxjs/toolkit';
import favoritesReducer from './favoritesSlice';
import cartReducer from './cartSlice';
import cartMiddleware from './cartMiddleware';

export const store = configureStore({
  reducer: {
    favorites: favoritesReducer,
    cart: cartReducer,
    // Add other reducers here as needed
  },
  // Enable Redux DevTools extension
  devTools: import.meta.env.MODE !== 'production',
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serializable check
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['cart.cache.timestamp', 'cart.lastUpdated'],
      },
    }).prepend(cartMiddleware.middleware),
});

export default store;