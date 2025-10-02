import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { 
  sendOTP, 
  verifyOTP, 
  getCurrentUser, 
  updateUserProfile, 
  logoutUser,
  setAuthType,
  setTempPhoneNumber,
  setIsAuthPanelOpen,
  setIsNewUser,
  clearError,
  updateUser,
  initializeAuth,
  authExpired
} from '../redux/authSlice';

// Custom hook for authentication - Compatible with existing modal interface
export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector(state => state.auth);

  // Send OTP function - matches existing modal interface
  const sendOTPAction = useCallback(async (phoneNumber, locationId) => {
    try {
      // Format phone number
      const formattedPhone = phoneNumber.startsWith('+91') ? phoneNumber : `+91${phoneNumber}`;
      
      // Store locationId if provided (for signup)
      if (locationId) {
        localStorage.setItem('temp_location_id', locationId);
      }
      
      const resultAction = await dispatch(sendOTP({ 
        phoneNumber: formattedPhone, 
        recaptchaContainerId: 'recaptcha-container' 
      }));
      
      return sendOTP.fulfilled.match(resultAction);
    } catch (error) {
      console.error('Error in sendOTP:', error);
      return false;
    }
  }, [dispatch]);

  // Verify OTP function - matches existing modal interface
  const verifyOTPAction = useCallback(async (otp) => {
    try {
      // Get saved locationId
      const locationId = localStorage.getItem('temp_location_id');
      
      const resultAction = await dispatch(verifyOTP({ 
        otp, 
        locationId 
      }));
      
      // Clean up temp locationId
      localStorage.removeItem('temp_location_id');
      
      return verifyOTP.fulfilled.match(resultAction);
    } catch (error) {
      console.error('Error in verifyOTP:', error);
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
    dispatch(setIsAuthPanelOpen(!auth.isAuthPanelOpen));
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
    // State - same interface as Context version
    user: auth.user,
    token: auth.token,
    isAuthenticated: auth.isAuthenticated,
    loading: auth.loading || auth.otpSending || auth.otpVerifying || auth.profileUpdating,
    authError: auth.error,
    authType: auth.authType,
    tempPhoneNumber: auth.tempPhoneNumber,
    isAuthPanelOpen: auth.isAuthPanelOpen,
    isNewUser: auth.isNewUser,

    // Actions - same interface as Context version
    sendOTP: sendOTPAction,
    verifyOTP: verifyOTPAction,
    updateProfile: updateProfileAction,
    updateUser: updateUserAction,
    logout: () => dispatch(logoutUser()),
    toggleAuthPanel,
    changeAuthType,
    clearError: () => dispatch(clearError()),
    
    // Additional Redux actions (for advanced usage)
    getCurrentUser: () => dispatch(getCurrentUser()),
    initializeAuth: () => dispatch(initializeAuth()),
    authExpired: () => dispatch(authExpired()),
    
    // Helper functions (for compatibility)
    isProfileIncomplete: () => auth.user && (!auth.user.name || !auth.user.dob || !auth.user.location),
    getUserDisplayName: () => auth.user?.name || auth.user?.phone || 'User',
    getUserAvatarUrl: () => auth.user?.profilePhoto?.url || '/images/default-avatar.svg',
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