import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import favoritesReducer from './favoritesSlice';
import cartReducer from './cartSlice';
import productsReducer from './productsSlice';
import authReducer from './authSlice';
import cartMiddleware from './cartMiddleware';

// Root persist config
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['cart', 'favorites', 'auth'],
  blacklist: ['products'],
};

// Slice-level persist configs
const cartPersistConfig = { key: 'cart', storage, whitelist: ['items', 'deliveryInfo'] };
const favoritesPersistConfig = { key: 'favorites', storage, whitelist: ['items'] };
const authPersistConfig = { key: 'auth', storage, whitelist: ['user', 'token', 'isAuthenticated'] };

// Persisted reducers
const persistedCartReducer = persistReducer(cartPersistConfig, cartReducer);
const persistedFavoritesReducer = persistReducer(favoritesPersistConfig, favoritesReducer);
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);

const rootReducer = combineReducers({
  auth: persistedAuthReducer,
  favorites: persistedFavoritesReducer,
  cart: persistedCartReducer,
  products: productsReducer,
});

const persistedRootReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedRootReducer,
  devTools: import.meta.env.MODE !== 'production',
  // cartMiddleware is a listener middleware object; use its .middleware function
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(cartMiddleware.middleware),
});

export const persistor = persistStore(store);

export default store;