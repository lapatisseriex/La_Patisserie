import React, { createContext, useContext } from 'react';
import { useAuth as useReduxAuth } from '../../hooks/useAuth';

/**
 * Compatibility AuthContext that bridges the old context API with Redux
 * This allows existing components to continue working without changes
 * while they are gradually migrated to use Redux directly
 */
const CompatibilityAuthContext = createContext();

export const useAuth = () => {
  const context = useContext(CompatibilityAuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthCompatibilityProvider = ({ children }) => {
  const reduxAuth = useReduxAuth();

  // Map Redux auth state to the old context API structure
  const contextValue = {
    // User and authentication state
    user: reduxAuth.user,
    token: reduxAuth.token,
    isAuthenticated: reduxAuth.isAuthenticated,
    loading: reduxAuth.loading,
    authError: reduxAuth.error,

    // Auth panel state
    authType: reduxAuth.authType,
    tempPhoneNumber: reduxAuth.tempPhoneNumber,
    confirmationResult: reduxAuth.confirmationResult,
    isAuthPanelOpen: reduxAuth.isAuthPanelOpen,
    isNewUser: reduxAuth.isNewUser,

    // Loading states
    otpSending: reduxAuth.otpSending,
    otpVerifying: reduxAuth.otpVerifying,
    profileUpdating: reduxAuth.profileUpdating,

    // Action methods (keeping the same interface)
    sendOTP: async (phoneNumber, recaptchaContainerId) => {
      return await reduxAuth.sendOTP(phoneNumber, recaptchaContainerId);
    },

    verifyOTP: async (otp, locationId = null) => {
      if (!reduxAuth.confirmationResult) {
        throw new Error('No confirmation result available');
      }
      return await reduxAuth.verifyOTP(reduxAuth.confirmationResult, otp, locationId);
    },

    updateUserProfile: async (profileData) => {
      return await reduxAuth.updateUserProfile(profileData);
    },

    logout: async () => {
      return await reduxAuth.logout();
    },

    // State setters
    setAuthType: reduxAuth.setAuthType,
    setTempPhoneNumber: reduxAuth.setTempPhoneNumber,
    setIsAuthPanelOpen: reduxAuth.setIsAuthPanelOpen,
    setIsNewUser: reduxAuth.setIsNewUser,
    clearError: reduxAuth.clearError,

    // Additional methods for compatibility
    setAuthError: (error) => {
      // For compatibility - errors are now managed through Redux actions
      console.warn('setAuthError is deprecated. Use Redux actions instead.');
    },

    // Method to get fresh user data
    refreshUser: async () => {
      return await reduxAuth.getCurrentUser();
    },
  };

  return (
    <CompatibilityAuthContext.Provider value={contextValue}>
      {children}
    </CompatibilityAuthContext.Provider>
  );
};

export default AuthCompatibilityProvider;