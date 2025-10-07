import { useSelector, useDispatch } from 'react-redux';
import { useCallback, useEffect } from 'react';
import {
  setUser,
  setToken,
  setLoading,
  setError,
  setAuthType,

  setConfirmationResult,
  setIsAuthPanelOpen,
  setIsNewUser,
  clearError,
  logout,
  updateUserField,
  initializeFromStorage,
  verifyToken,
  fetchUserProfile,
  updateUserProfile,
  uploadProfileImage,
  deleteProfileImage,
} from '../redux/userSlice';

/**
 * Custom hook to manage user state with Redux
 * This replaces the AuthContext functionality
 */
export const useUserRedux = () => {
  const dispatch = useDispatch();
  
  // Get state from Redux store
  const {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isNewUser,
    authType,
    tempPhoneNumber,
    confirmationResult,
    isAuthPanelOpen,
    profileUpdateLoading,
    profileUpdateError,
  } = useSelector(state => state.user);

  // Initialize from localStorage on mount
  useEffect(() => {
    dispatch(initializeFromStorage());
  }, [dispatch]);

  // Actions
  const updateUser = useCallback((userData) => {
    dispatch(setUser(userData));
  }, [dispatch]);

  const updateToken = useCallback((newToken) => {
    dispatch(setToken(newToken));
  }, [dispatch]);

  const setLoadingState = useCallback((isLoading) => {
    dispatch(setLoading(isLoading));
  }, [dispatch]);

  const setErrorState = useCallback((errorMessage) => {
    dispatch(setError(errorMessage));
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
    // State
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isNewUser,
    authType,
    tempPhoneNumber,
    confirmationResult,
    isAuthPanelOpen,
    profileUpdateLoading,
    profileUpdateError,
    
    // Actions
    updateUser,
    updateToken,
    setLoadingState,
    setErrorState,
    changeAuthType,
    setTempPhone,
    setConfirmResult,
    toggleAuthPanel,
    setNewUserStatus,
    clearAuthError,
    logoutUser,
    updateUserFields,
    
    // Async actions
    verifyUserToken,
    fetchUser,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    
    // Helper functions
    isProfileIncomplete,
    getUserDisplayName,
    getUserAvatarUrl,
    
    // Legacy compatibility (for existing components)
    authError: error,
    logout: logoutUser,
    updateUser: updateUserFields,
  };
};

export default useUserRedux;