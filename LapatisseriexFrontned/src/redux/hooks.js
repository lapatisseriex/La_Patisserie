import { useSelector, useDispatch } from 'react-redux';
import { 
  signInWithGoogle,
  signUpWithEmail,
  signInWithEmail,
  getCurrentUser, 
  updateUserProfile, 
  logoutUser,
  setAuthType,
  setIsAuthPanelOpen,
  setIsNewUser,
  clearError,
  initializeAuth,
  authExpired
} from './authSlice';
import {
  uploadProfilePhoto,
  deleteProfilePhoto,
  updateUserPreferences,
  loadUserPreferences,
  addToRecentlyViewed,
  clearRecentlyViewed,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  resetUserProfile
} from './userProfileSlice';

// Custom hooks for auth state
export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  
  return {
    // Auth state
    user: auth.user,
    token: auth.token,
    isAuthenticated: auth.isAuthenticated,
    loading: auth.loading,
    error: auth.error,
    authType: auth.authType,
    isAuthPanelOpen: auth.isAuthPanelOpen,
    isNewUser: auth.isNewUser,
    authenticating: auth.authenticating,
    profileUpdating: auth.profileUpdating,
    
    // New Auth actions
    signInWithGoogle: (data) => dispatch(signInWithGoogle(data)),
    signUpWithEmail: (data) => dispatch(signUpWithEmail(data)),
    signInWithEmail: (data) => dispatch(signInWithEmail(data)),
    getCurrentUser: () => dispatch(getCurrentUser()),
    updateUserProfile: (data) => dispatch(updateUserProfile(data)),
    logout: () => dispatch(logoutUser()),
    setAuthType: (type) => dispatch(setAuthType(type)),
    setIsAuthPanelOpen: (open) => dispatch(setIsAuthPanelOpen(open)),
    setIsNewUser: (isNew) => dispatch(setIsNewUser(isNew)),
    clearError: () => dispatch(clearError()),
    initializeAuth: () => dispatch(initializeAuth()),
    authExpired: () => dispatch(authExpired()),
  };
};

// Custom hooks for user profile state
export const useUserProfile = () => {
  const dispatch = useDispatch();
  const userProfile = useSelector((state) => state.userProfile);
  
  return {
    // User profile state
    preferences: userProfile.preferences,
    recentlyViewed: userProfile.recentlyViewed,
    addresses: userProfile.addresses,
    orders: userProfile.orders,
    loading: userProfile.loading,
    error: userProfile.error,
    
    // User profile actions
    uploadProfilePhoto: (formData) => dispatch(uploadProfilePhoto(formData)),
    deleteProfilePhoto: () => dispatch(deleteProfilePhoto()),
    updatePreferences: (preferences) => dispatch(updateUserPreferences(preferences)),
    loadPreferences: () => dispatch(loadUserPreferences()),
    addToRecentlyViewed: (product) => dispatch(addToRecentlyViewed(product)),
    clearRecentlyViewed: () => dispatch(clearRecentlyViewed()),
    addAddress: (address) => dispatch(addAddress(address)),
    updateAddress: (address) => dispatch(updateAddress(address)),
    deleteAddress: (id) => dispatch(deleteAddress(id)),
    setDefaultAddress: (id) => dispatch(setDefaultAddress(id)),
    resetUserProfile: () => dispatch(resetUserProfile()),
  };
};

// Combined hook for all user-related data
export const useUser = () => {
  const auth = useAuth();
  const userProfile = useUserProfile();
  
  return {
    // Combined user data
    ...auth,
    ...userProfile,
    
    // Computed properties
    isProfileComplete: auth.user?.name && auth.user?.dob,
    hasAddresses: userProfile.addresses.length > 0,
    defaultAddress: userProfile.addresses.find(addr => addr.isDefault),
  };
};

// Selector hooks for specific data
export const useAuthStatus = () => {
  return useSelector((state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    loading: state.auth.loading,
    user: state.auth.user,
  }));
};

export const useUserPreferences = () => {
  return useSelector((state) => state.userProfile.preferences);
};

export const useUserAddresses = () => {
  return useSelector((state) => state.userProfile.addresses);
};

export const useRecentlyViewed = () => {
  return useSelector((state) => state.userProfile.recentlyViewed);
};