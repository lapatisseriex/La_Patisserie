import { useSelector, useDispatch } from 'react-redux';
import { useCallback, useEffect } from 'react';
import {
  setAuthType,
  setIsAuthPanelOpen,
  setIsNewUser,
  clearError,
  updateUser,
  initializeAuth,
  setUser,
  clearUser,
  getCurrentUser,
  updateUserProfile,
  logoutUser,
} from '../redux/authSlice';

/**
 * Custom hook to manage user state with Redux
 * This replaces the AuthContext functionality
 */
export const useUserRedux = () => {
  const dispatch = useDispatch();
  
  // Get state from Redux store - using canonical auth slice
  const {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isNewUser,
    authType,
    isAuthPanelOpen,
    profileUpdating: profileUpdateLoading,
  } = useSelector(state => state.auth);

  // Initialize auth on mount
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // Actions
  const updateUserData = useCallback((userData) => {
    dispatch(updateUser(userData));
  }, [dispatch]);

  const changeAuthType = useCallback((type) => {
    dispatch(setAuthType(type));
  }, [dispatch]);



  const setConfirmResult = useCallback((result) => {
    dispatch(setConfirmationResult(result));
  }, [dispatch]);

  const toggleAuthPanel = useCallback((isOpen) => {
    dispatch(setIsAuthPanelOpen(isOpen));
  }, [dispatch]);

  const setNewUserStatus = useCallback((isNew) => {
    dispatch(setIsNewUser(isNew));
  }, [dispatch]);

  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const logoutUser = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  const updateUserFields = useCallback((fields) => {
    dispatch(updateUserField(fields));
  }, [dispatch]);

  // Async actions
  const verifyUserToken = useCallback((idToken) => {
    return dispatch(verifyToken(idToken));
  }, [dispatch]);

  const fetchUser = useCallback(() => {
    return dispatch(fetchUserProfile());
  }, [dispatch]);

  const updateProfile = useCallback((profileData) => {
    return dispatch(updateUserProfile(profileData));
  }, [dispatch]);

  const uploadAvatar = useCallback((formData) => {
    return dispatch(uploadProfileImage(formData));
  }, [dispatch]);

  const deleteAvatar = useCallback(() => {
    return dispatch(deleteProfileImage());
  }, [dispatch]);

  // Helper functions
  const isProfileIncomplete = useCallback(() => {
    return user && (!user.name || !user.dob || !user.location);
  }, [user]);

  const getUserDisplayName = useCallback(() => {
    return user?.name || user?.phone || 'User';
  }, [user]);

  const getUserAvatarUrl = useCallback(() => {
    return user?.profilePhoto?.url || '/images/default-avatar.svg';
  }, [user]);

  return {
    // State from auth slice
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isNewUser,
    authType,
    isAuthPanelOpen,
    profileUpdateLoading,
    
    // Actions
    updateUser: updateUserData,
    changeAuthType,
    toggleAuthPanel,
    clearAuthError: clearError,
    logout: logoutUser,
    
    // Async actions
    fetchUser: getCurrentUser,
    updateProfile: updateUserProfile,
    
    // Helper functions
    isProfileIncomplete: () => user && (!user.name || !user.dob || !user.location),
    getUserDisplayName: () => user?.name || user?.phone || 'User',
    getUserAvatarUrl: () => user?.profilePhoto?.url || '/images/default-avatar.svg',
    
    // Legacy compatibility
    authError: error,
  };
};

export default useUserRedux;