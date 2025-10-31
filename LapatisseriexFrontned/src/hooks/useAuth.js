import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { 
  signInWithGoogle,
  signUpWithEmail,
  signInWithEmail,
  sendSignupOTP,
  verifySignupOTP,
  getCurrentUser, 
  updateUserProfile, 
  logoutUser,
  setAuthType,
  setIsAuthPanelOpen,
  setIsNewUser,
  clearError,
  updateUser,
  initializeAuth,
  authExpired,
  initializeAuthListener,
  sendPasswordResetOTP,
  verifyPasswordResetOTP,
  resetPassword,
  resetPasswordState,
  setPasswordResetStep,
  setPasswordResetEmail,
  setLoginFormEmail,
  resetSignupOtpState
} from '../redux/authSlice';

// Custom hook for authentication - Compatible with existing modal interface
export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector(state => state.auth) || {};

  // Google Sign In function
  const signInWithGoogleAction = useCallback(async (options = {}) => {
    try {
      const resultAction = await dispatch(signInWithGoogle(options));
      return signInWithGoogle.fulfilled.match(resultAction);
    } catch (error) {
      console.error('Error in signInWithGoogle:', error);
      return false;
    }
  }, [dispatch]);

  // Email Sign Up function
  const signUpWithEmailAction = useCallback(async (credentials) => {
    try {
      const resultAction = await dispatch(signUpWithEmail(credentials));
      return signUpWithEmail.fulfilled.match(resultAction);
    } catch (error) {
      console.error('Error in signUpWithEmail:', error);
      return false;
    }
  }, [dispatch]);

  // Email Sign In function
  const signInWithEmailAction = useCallback(async (credentials) => {
    try {
      const resultAction = await dispatch(signInWithEmail(credentials));
      return signInWithEmail.fulfilled.match(resultAction);
    } catch (error) {
      console.error('Error in signInWithEmail:', error);
      return false;
    }
  }, [dispatch]);

  // Send Signup OTP function
  const sendSignupOTPAction = useCallback(async (data) => {
    try {
      const resultAction = await dispatch(sendSignupOTP(data));
      return sendSignupOTP.fulfilled.match(resultAction);
    } catch (error) {
      console.error('Error in sendSignupOTP:', error);
      return false;
    }
  }, [dispatch]);

  // Verify Signup OTP function
  const verifySignupOTPAction = useCallback(async (data) => {
    try {
      const resultAction = await dispatch(verifySignupOTP(data));
      return verifySignupOTP.fulfilled.match(resultAction);
    } catch (error) {
      console.error('Error in verifySignupOTP:', error);
      return false;
    }
  }, [dispatch]);

  // Update profile function - matches existing interface
  const updateProfileAction = useCallback(async (profileData) => {
    try {
      const resultAction = await dispatch(updateUserProfile(profileData));
      return updateUserProfile.fulfilled.match(resultAction);
    } catch (error) {
      console.error('Error in updateProfile:', error);
      return false;
    }
  }, [dispatch]);

  // Toggle auth panel function
  const toggleAuthPanel = useCallback(() => {
    dispatch(setIsAuthPanelOpen(!(auth.isAuthPanelOpen || false)));
  }, [dispatch, auth.isAuthPanelOpen]);

  // Change auth type function
  const changeAuthType = useCallback((type) => {
    dispatch(setAuthType(type));
  }, [dispatch]);

  // Update user function (for compatibility)
  const updateUserAction = useCallback((userData) => {
    dispatch(updateUser(userData));
  }, [dispatch]);

  return {
    // State - updated for new auth system with defaults
    user: auth.user || null,
    token: auth.token || null,
    isAuthenticated: auth.isAuthenticated || false,
    loading: auth.loading || auth.authenticating || auth.profileUpdating || false,
    authError: auth.error || null,
    error: auth.error || null, // Alias for authError for backward compatibility
    authType: auth.authType || 'login',
    isAuthPanelOpen: auth.isAuthPanelOpen || false,
    isNewUser: auth.isNewUser || false,
    hydrated: auth.hydrated || false,
    loginFormEmail: auth.loginFormEmail || '',
    
    // Password reset state
    passwordReset: auth.passwordReset || {
      step: 'email',
      email: '',
      loading: false,
      error: null,
      message: '',
      otpVerified: false
    },

    // Signup OTP state
    signupOtp: auth.signupOtp || {
      email: '',
      otpSent: false,
      loading: false,
      error: null,
      message: ''
    },

    // New authentication actions
    signInWithGoogle: signInWithGoogleAction,
    signUpWithEmail: signUpWithEmailAction,
    signInWithEmail: signInWithEmailAction,
    sendSignupOTP: sendSignupOTPAction,
    verifySignupOTP: verifySignupOTPAction,
    updateProfile: updateProfileAction,
    updateUser: updateUserAction,
    logout: () => dispatch(logoutUser()),
    toggleAuthPanel,
    changeAuthType,
    clearError: () => dispatch(clearError()),
    
    // Password reset actions
    sendPasswordResetOTP: (email) => dispatch(sendPasswordResetOTP({ email })),
    verifyPasswordResetOTP: (email, otp) => dispatch(verifyPasswordResetOTP({ email, otp })),
    resetPassword: (email, newPassword) => dispatch(resetPassword({ email, newPassword })),
    resetPasswordState: () => dispatch(resetPasswordState()),
    setPasswordResetStep: (step) => dispatch(setPasswordResetStep(step)),
    setPasswordResetEmail: (email) => dispatch(setPasswordResetEmail(email)),
    setLoginFormEmail: (email) => dispatch(setLoginFormEmail(email)),
    
    // Signup OTP actions
    resetSignupOtpState: () => dispatch(resetSignupOtpState()),
    
    // Additional Redux actions (for advanced usage)
    getCurrentUser: () => dispatch(getCurrentUser()),
    initializeAuth: () => dispatch(initializeAuth()),
    initializeAuthListener: () => dispatch(initializeAuthListener()),
    authExpired: () => dispatch(authExpired()),
    
    // Legacy phone/OTP methods removed for cleaner codebase

    
    // Helper functions (for compatibility)
    isProfileIncomplete: () => auth.user && (!auth.user.name || !auth.user.dob || !auth.user.location),
    getUserDisplayName: () => auth.user?.name || auth.user?.email || 'User',
    // Prefer only custom uploaded avatars (with public_id). Avoid showing provider photos (e.g., Google) to prevent flicker.
    getUserAvatarUrl: () => (auth.user?.profilePhoto?.public_id ? auth.user.profilePhoto.url : '/images/default-avatar.svg'),
  };
};

// Custom hook for user profile
export const useUserProfile = () => {
  const dispatch = useDispatch();
  const userProfile = useSelector(state => state.userProfile);

  return {
    // State
    preferences: userProfile.preferences,
    recentlyViewed: userProfile.recentlyViewed,
    addresses: userProfile.addresses,
    orders: userProfile.orders,
    loading: userProfile.loading,
    error: userProfile.error,

    // Actions (imported from userProfileSlice)
    addToRecentlyViewed: (product) => 
      dispatch({ type: 'userProfile/addToRecentlyViewed', payload: product }),
    clearRecentlyViewed: () => 
      dispatch({ type: 'userProfile/clearRecentlyViewed' }),
    addAddress: (address) => 
      dispatch({ type: 'userProfile/addAddress', payload: address }),
    updateAddress: (addressData) => 
      dispatch({ type: 'userProfile/updateAddress', payload: addressData }),
    deleteAddress: (addressId) => 
      dispatch({ type: 'userProfile/deleteAddress', payload: addressId }),
    setDefaultAddress: (addressId) => 
      dispatch({ type: 'userProfile/setDefaultAddress', payload: addressId }),
    clearError: () => 
      dispatch({ type: 'userProfile/clearError' }),
    resetUserProfile: () => 
      dispatch({ type: 'userProfile/resetUserProfile' }),
  };
};

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectUserPreferences = (state) => state.userProfile.preferences;
export const selectUserAddresses = (state) => state.userProfile.addresses;
export const selectRecentlyViewed = (state) => state.userProfile.recentlyViewed;