import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';
import favoritesReducer from './favoritesSlice';
import cartReducer from './cartSlice';
import productsReducer from './productsSlice';
import authReducer from './authSlice';
import userProfileReducer from './userProfileSlice';
import cartMiddleware from './cartMiddleware';
import authMiddleware from './authMiddleware';


// Persist configurations
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'userProfile', 'cart', 'favorites'], // Persist these slices
  blacklist: ['products'], // Don't persist products
};

const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['user', 'token', 'isAuthenticated'], // Only persist essential auth data
};

const userProfilePersistConfig = {
  key: 'userProfile',
  storage,
  whitelist: ['preferences', 'addresses'], // Persist preferences and addresses
};

const cartPersistConfig = {
  key: 'cart',
  storage,
  whitelist: ['items', 'deliveryInfo'], // Persist cart items and delivery info
};

const favoritesPersistConfig = {
  key: 'favorites',
  storage,
  whitelist: ['items'], // Persist favorite items
};

// Create persisted reducers
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedUserProfileReducer = persistReducer(userProfilePersistConfig, userProfileReducer);
const persistedCartReducer = persistReducer(cartPersistConfig, cartReducer);
const persistedFavoritesReducer = persistReducer(favoritesPersistConfig, favoritesReducer);

// Root reducer
const rootReducer = combineReducers({
  auth: persistedAuthReducer,
  userProfile: persistedUserProfileReducer,
  favorites: persistedFavoritesReducer,
  cart: persistedCartReducer,
  products: productsReducer, // Don't persist products as they change frequently
});

// Create persisted root reducer
const persistedRootReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedRootReducer,
  // Enable Redux DevTools extension
  devTools: import.meta.env.MODE !== 'production',
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serializable check
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/REGISTER',
          'persist/PURGE',
          'persist/FLUSH',
          'persist/PAUSE',
        ],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp', 'register'],
        // Ignore these paths in the state
        ignoredPaths: [
          'cart.cache.timestamp', 
          'cart.lastUpdated',
          '_persist'
        ],
      },
    })
    .prepend(cartMiddleware.middleware)
    .prepend(authMiddleware.middleware),
});

export const persistor = persistStore(store);

export default store;