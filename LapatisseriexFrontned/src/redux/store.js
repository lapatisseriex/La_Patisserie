import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import favoritesReducer from './favoritesSlice';
import cartReducer from './cartSlice';
import productsReducer from './productsSlice';
import authReducer from './authSlice';
import userReducer from './userSlice';
import paymentsReducer from './paymentsSlice';
import cartMiddleware from './cartMiddleware';

// Root persist config - persist both auth and user for compatibility
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['cart', 'favorites', 'auth', 'user'],
  blacklist: ['products', 'payments']};

// Slice-level persist configs
const cartPersistConfig = { key: 'cart', storage, whitelist: ['items', 'deliveryInfo'] };
const favoritesPersistConfig = { key: 'favorites', storage, whitelist: ['items'] };
const authPersistConfig = { key: 'auth', storage, whitelist: ['user', 'token', 'isAuthenticated', 'authType', 'isNewUser'] };
const userPersistConfig = { key: 'user', storage, whitelist: ['user', 'token', 'isAuthenticated'] };

// Persisted reducers
const persistedCartReducer = persistReducer(cartPersistConfig, cartReducer);
const persistedFavoritesReducer = persistReducer(favoritesPersistConfig, favoritesReducer);
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedUserReducer = persistReducer(userPersistConfig, userReducer);

// Combined reducers with both auth and user slices
const combinedReducers = combineReducers({
  auth: persistedAuthReducer,
  user: persistedUserReducer,
  favorites: persistedFavoritesReducer,
  cart: persistedCartReducer,
  products: productsReducer,
  payments: paymentsReducer});

// Synchronization middleware to keep auth and user slices in sync
const rootReducer = (state, action) => {
  const nextState = combinedReducers(state, action);
  
  // Always keep both slices synchronized after any action
  try {
    const authState = nextState.auth || {};
    const userState = nextState.user || {};
    
    // Determine the most up-to-date data source based on action type
    let canonicalAuth = authState;
    let canonicalUser = userState;
    
    // If auth slice was updated, sync to user slice
    if (action.type?.startsWith('auth/')) {
      canonicalUser = {
        ...userState,
        user: authState.user ?? userState.user,
        token: authState.token ?? userState.token,
        isAuthenticated: authState.isAuthenticated ?? userState.isAuthenticated,
        loading: authState.loading ?? userState.loading,
        error: authState.error ?? userState.error};
    }
    
    // If user slice was updated, sync to auth slice  
    if (action.type?.startsWith('user/')) {
      canonicalAuth = {
        ...authState,
        user: userState.user ?? authState.user,
        token: userState.token ?? authState.token,
        isAuthenticated: userState.isAuthenticated ?? authState.isAuthenticated,
        loading: userState.loading ?? authState.loading,
        error: userState.error ?? authState.error};
    }
    
    return {
      ...nextState,
      auth: canonicalAuth,
      user: canonicalUser};
  } catch (error) {
    console.warn('Store synchronization error:', error);
    return nextState;
  }
};

const persistedRootReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedRootReducer,
  devTools: import.meta.env.MODE !== 'production',
  // cartMiddleware is a listener middleware object; use its .middleware function
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(cartMiddleware.middleware)});

// Subscribe to store changes to keep localStorage in sync with Redux state
// This replaces manual localStorage writes and ensures consistency
let previousAuthState = store.getState().auth;
let previousUserState = store.getState().user;

store.subscribe(() => {
  const currentState = store.getState();
  const currentAuthState = currentState.auth;
  const currentUserState = currentState.user;

  // Update localStorage when auth state changes (for Firebase compatibility)
  if (previousAuthState !== currentAuthState) {
    try {
      if (currentAuthState.token) {
        localStorage.setItem('authToken', currentAuthState.token);
      } else {
        localStorage.removeItem('authToken');
      }

      if (currentAuthState.user) {
        localStorage.setItem('cachedUser', JSON.stringify(currentAuthState.user));
      } else {
        localStorage.removeItem('cachedUser');
      }
    } catch (error) {
      console.warn('Error updating localStorage from auth state:', error);
    }
    previousAuthState = currentAuthState;
  }

  previousUserState = currentUserState;
});

export const persistor = persistStore(store);

// Expose store for debugging/non-hook access in rare cases
try {
  if (typeof window !== 'undefined') {
    window.__APP_STORE__ = store;
  }
} catch {}

export default store;