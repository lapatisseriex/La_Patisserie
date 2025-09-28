import { configureStore } from '@reduxjs/toolkit';
import favoritesReducer from './favoritesSlice';

export const store = configureStore({
  reducer: {
    favorites: favoritesReducer,
    // Add other reducers here as needed
  },
  // Enable Redux DevTools extension
  devTools: import.meta.env.MODE !== 'production',
});

export default store;