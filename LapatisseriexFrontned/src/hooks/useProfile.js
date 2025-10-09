import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  updateUserProfile,
  getCurrentUser,
  updateUser,
  clearError,
} from '../redux/authSlice';

/**
 * Custom hook for profile management with Redux
 * Handles profile updates, image uploads, and form state
 */
export const useProfile = () => {
  const dispatch = useDispatch();
  
  // Get user and profile-related state from Redux - using canonical auth slice
  const {
    user,
    profileUpdating: profileUpdateLoading,
    error: profileUpdateError,
    loading,
  } = useSelector(state => state.auth);

  // Update profile data
  const updateProfile = useCallback(async (profileData) => {
    try {
      const resultAction = await dispatch(updateUserProfile(profileData));
      
      if (updateUserProfile.fulfilled.match(resultAction)) {
        return { success: true, data: resultAction.payload };
      } else {
        return { success: false, error: resultAction.payload };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [dispatch]);

  // Upload profile image
  const uploadAvatar = useCallback(async (file) => {
    try {
      const formData = new FormData();
      formData.append('profilePhoto', file);
      
      const resultAction = await dispatch(uploadProfileImage(formData));
      
      if (uploadProfileImage.fulfilled.match(resultAction)) {
        return { success: true, data: resultAction.payload };
      } else {
        return { success: false, error: resultAction.payload };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [dispatch]);

  // Delete profile image
  const deleteAvatar = useCallback(async () => {
    try {
      const resultAction = await dispatch(deleteProfileImage());
      
      if (deleteProfileImage.fulfilled.match(resultAction)) {
        return { success: true, data: resultAction.payload };
      } else {
        return { success: false, error: resultAction.payload };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [dispatch]);

  // Fetch fresh profile data
  const refreshProfile = useCallback(async () => {
    try {
      const resultAction = await dispatch(fetchUserProfile());
      
      if (fetchUserProfile.fulfilled.match(resultAction)) {
        return { success: true, data: resultAction.payload };
      } else {
        return { success: false, error: resultAction.payload };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [dispatch]);

  // Update specific user fields
  const updateUserData = useCallback((fields) => {
    dispatch(updateUserField(fields));
  }, [dispatch]);

  // Set profile error
  const setProfileError = useCallback((errorMessage) => {
    dispatch(setError(errorMessage));
  }, [dispatch]);

  // Clear profile errors
  const clearProfileError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Profile validation helpers
  const isProfileComplete = useCallback(() => {
    return user && user.name && user.dob && user.location;
  }, [user]);

  const getMissingFields = useCallback(() => {
    if (!user) return ['All fields required'];
    
    const missing = [];
    if (!user.name) missing.push('Name');
    if (!user.dob) missing.push('Date of Birth');
    if (!user.location) missing.push('Location');
    if (!user.gender) missing.push('Gender');
    if (!user.phone) missing.push('Phone Number');
    
    return missing;
  }, [user]);

  // Profile data formatting helpers
  const getFormattedUser = useCallback(() => {
    if (!user) return null;
    
    return {
      ...user,
      locationName: typeof user.location === 'object' ? user.location?.name : '',
      hostelName: typeof user.hostel === 'object' ? user.hostel?.name : '',
      profilePhotoUrl: user.profilePhoto?.url || '/images/default-avatar.svg',
    };
  }, [user]);

  // Profile form helpers
  const getProfileFormData = useCallback(() => {
    if (!user) return {};
    
    return {
      name: user.name || '',
      phone: user.phone || '',
      email: user.email || '',
      dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
      gender: user.gender || '',
      anniversary: user.anniversary ? new Date(user.anniversary).toISOString().split('T')[0] : '',
      country: user.country || 'India',
      location: typeof user.location === 'object' ? user.location?._id || '' : user.location || '',
      hostel: typeof user.hostel === 'object' ? user.hostel?._id || '' : user.hostel || '',
    };
  }, [user]);

  return {
    // State
    user,
    loading: profileUpdateLoading || loading,
    error: profileUpdateError || error,
    isLoading: profileUpdateLoading,
    
    // Actions
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    refreshProfile,
    updateUserData,
    setProfileError,
    clearProfileError,
    
    // Helpers
    isProfileComplete,
    getMissingFields,
    getFormattedUser,
    getProfileFormData,
    
    // Computed values
    profilePhotoUrl: user?.profilePhoto?.url || '/images/default-avatar.svg',
    displayName: user?.name || user?.phone || 'User',
    isProfileIncomplete: !isProfileComplete(),
  };
};

export default useProfile;