import { createListenerMiddleware } from '@reduxjs/toolkit';
import { authExpired, initializeAuth } from './authSlice';
import { resetUserProfile, loadUserPreferences } from './userProfileSlice';

// Create auth middleware
export const authMiddleware = createListenerMiddleware();

// Listen for auth expired events
authMiddleware.startListening({
  actionCreator: authExpired,
  effect: async (action, listenerApi) => {
    // Reset user profile when auth expires
    listenerApi.dispatch(resetUserProfile());
    
    // Clear any cached auth data
    localStorage.removeItem('authToken');
    localStorage.removeItem('cachedUser');
    
    console.log('Authentication expired - user data cleared');
  },
});

// Listen for initialization
authMiddleware.startListening({
  actionCreator: initializeAuth,
  effect: async (action, listenerApi) => {
    const { getState } = listenerApi;
    const { auth } = getState();
    
    // If user is authenticated, load their preferences
    if (auth.isAuthenticated) {
      listenerApi.dispatch(loadUserPreferences());
    }
  },
});

// Listen for successful login
authMiddleware.startListening({
  matcher: (action) => {
    return action.type === 'auth/verifyOTP/fulfilled' || 
           action.type === 'auth/getCurrentUser/fulfilled';
  },
  effect: async (action, listenerApi) => {
    // Load user preferences after successful login
    listenerApi.dispatch(loadUserPreferences());
  },
});

// Listen for logout
authMiddleware.startListening({
  matcher: (action) => action.type === 'auth/logoutUser/fulfilled',
  effect: async (action, listenerApi) => {
    // Reset user profile on logout
    listenerApi.dispatch(resetUserProfile());
    
    console.log('User logged out - profile data reset');
  },
});

export default authMiddleware;