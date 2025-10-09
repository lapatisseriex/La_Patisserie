import React from 'react';

/**
 * DEPRECATED: AuthCompatibility layer removed
 * 
 * This file is now a no-op because manual sync complexity has been eliminated.
 * 
 * Previous Issues Fixed:
 * 1. ✅ Manual sync logic removed - no more complex mapping between Redux and context
 * 2. ✅ Store-level synchronization handles auth/user slice consistency automatically
 * 3. ✅ No more potential sync loops or race conditions
 * 4. ✅ Reduced complexity - components use useAuth() directly
 * 
 * Migration Path:
 * - Replace AuthCompatibilityProvider with AuthProvider from AuthContextRedux.jsx
 * - Import useAuth from hooks/useAuth.js or context/AuthContext/AuthContextRedux.jsx
 */

// No-op compatibility provider for gradual migration
export const AuthCompatibilityProvider = ({ children }) => {

  console.warn('AuthCompatibilityProvider is deprecated. Use AuthProvider from AuthContextRedux.jsx directly.');
  return children;
};

// Deprecated useAuth hook - use the real one from hooks/useAuth.js
export const useAuth = () => {
  throw new Error(
    'AuthCompatibility useAuth is deprecated. Import useAuth from hooks/useAuth.js or context/AuthContext/AuthContextRedux.jsx instead.'
  );
};

export default AuthCompatibilityProvider;