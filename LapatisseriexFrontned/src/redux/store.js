import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import favoritesReducer from './favoritesSlice';
import cartReducer from './cartSlice';
import productsReducer from './productsSlice';
import userReducer from './userSlice';
import cartMiddleware from './cartMiddleware';

// Root persist config
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['cart', 'favorites', 'user'],
  blacklist: ['products'],
};

// Slice-level persist configs
const cartPersistConfig = { key: 'cart', storage, whitelist: ['items', 'deliveryInfo'] };
const favoritesPersistConfig = { key: 'favorites', storage, whitelist: ['items'] };
const userPersistConfig = { key: 'user', storage, whitelist: ['user', 'token', 'isAuthenticated'] };

// Persisted reducers
const persistedCartReducer = persistReducer(cartPersistConfig, cartReducer);
const persistedFavoritesReducer = persistReducer(favoritesPersistConfig, favoritesReducer);
const persistedUserReducer = persistReducer(userPersistConfig, userReducer);

const rootReducer = combineReducers({
  user: persistedUserReducer,
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