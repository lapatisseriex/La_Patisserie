import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPhoneNumber, 
  RecaptchaVerifier,
  signOut
} from 'firebase/auth';
import axios from 'axios';
import {
  setUser,
  setToken,
  setLoading,
  setError,
  setAuthType,
  setTempPhoneNumber,
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
} from '../../redux/userSlice';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Create Auth Context
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  
  // Get state from Redux store
  const {
    user,
    token,
    loading,
    error: authError,
    isAuthenticated,
    isNewUser,
    authType,
    tempPhoneNumber,
    confirmationResult,
    isAuthPanelOpen,
    profileUpdateLoading,
    profileUpdateError,
  } = useSelector(state => state.user);

  const API_URL = import.meta.env.VITE_API_URL;

  // Initialize from localStorage on mount
  useEffect(() => {
    dispatch(initializeFromStorage());
  }, [dispatch]);

  // Handle authentication expiration events
  useEffect(() => {
    const handleAuthExpiration = () => {
      console.warn('Authentication expired, logging out...');
      dispatch(logout());
    };

    window.addEventListener('auth:expired', handleAuthExpiration);
    return () => window.removeEventListener('auth:expired', handleAuthExpiration);
  }, [dispatch]);

  // Firebase auth state listener
  useEffect(() => {
    let mounted = true;
    
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!mounted) return;
      
      if (firebaseUser) {
        try {
          dispatch(setLoading(true));
          
          // Get ID token
          const idToken = await firebaseUser.getIdToken();
          dispatch(setToken(idToken));
          
          // Verify with backend
          const resultAction = await dispatch(verifyToken(idToken));
          
          if (verifyToken.fulfilled.match(resultAction)) {
            // Get fresh user data
            await dispatch(fetchUserProfile());
          }
        } catch (error) {
          console.error("Error in auth state change:", error);
          dispatch(setError(error.message));
        } finally {
          dispatch(setLoading(false));
        }
      } else {
        dispatch(logout());
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [dispatch]);

  // Send OTP function
  const sendOTP = useCallback(async (phoneNumber) => {
    try {
      dispatch(setError(null));
      dispatch(setLoading(true));

      // Clean up any existing reCAPTCHA
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }

      // Create reCAPTCHA verifier
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => console.log('reCAPTCHA solved'),
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
          dispatch(setError("reCAPTCHA expired. Please try again."));
        }
      });

      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
      
      dispatch(setConfirmationResult(confirmation));
      dispatch(setTempPhoneNumber(phoneNumber));
      dispatch(setAuthType('otp'));
      
      return true;
    } catch (error) {
      console.error("Error sending OTP:", error);
      dispatch(setError(error.message || "Failed to send OTP"));
      return false;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  // Verify OTP function
  const verifyOTP = useCallback(async (otp) => {
    if (!confirmationResult) {
      dispatch(setError("No confirmation result found"));
      return false;
    }

    try {
      dispatch(setError(null));
      dispatch(setLoading(true));

      await confirmationResult.confirm(otp);
      
      // The onAuthStateChanged listener will handle the rest
      return true;
    } catch (error) {
      console.error("Error verifying OTP:", error);
      dispatch(setError(error.message || "Invalid verification code"));
      return false;
    } finally {
      dispatch(setLoading(false));
      dispatch(setConfirmationResult(null));
    }
  }, [confirmationResult, dispatch]);

  // Update profile function
  const updateProfile = useCallback(async (profileData) => {
    if (!user) {
      dispatch(setError("You must be logged in to update profile"));
      return false;
    }

    try {
      dispatch(clearError());
      
      // Get fresh ID token
      const idToken = await auth.currentUser.getIdToken(true);
      dispatch(setToken(idToken));
      
      const resultAction = await dispatch(updateUserProfile(profileData));
      
      if (updateUserProfile.fulfilled.match(resultAction)) {
        // Check if we're in the auth panel or on the profile page
        const isInProfilePage = window.location.pathname === "/profile";
        
        // Only close auth panel if we're not on the profile page
        if (!isInProfilePage) {
          dispatch(setIsAuthPanelOpen(false));
        }
        
        return true;
      } else {
        dispatch(setError(resultAction.payload));
        return false;
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      dispatch(setError(error.message || "Failed to update profile"));
      return false;
    }
  }, [user, dispatch]);

  // Update user function (for compatibility)
  const updateUser = useCallback((userData) => {
    dispatch(updateUserField(userData));
  }, [dispatch]);

  // Logout function
  const logoutUser = useCallback(async () => {
    try {
      await signOut(auth);
      dispatch(logout());
    } catch (error) {
      console.error("Error during logout:", error);
      dispatch(logout()); // Force logout even if Firebase signOut fails
    }
  }, [dispatch]);

  // Toggle auth panel
  const toggleAuthPanel = useCallback(() => {
    dispatch(setIsAuthPanelOpen(!isAuthPanelOpen));
  }, [dispatch, isAuthPanelOpen]);

  // Change auth type
  const changeAuthType = useCallback((type) => {
    dispatch(setAuthType(type));
  }, [dispatch]);

  // Context value
  const value = {
    // State
    user,
    token,
    loading,
    authError,
    isAuthenticated,
    isNewUser,
    authType,
    tempPhoneNumber,
    confirmationResult,
    isAuthPanelOpen,
    profileUpdateLoading,
    profileUpdateError,
    
    // Actions
    sendOTP,
    verifyOTP,
    updateProfile,
    updateUser,
    logout: logoutUser,
    toggleAuthPanel,
    changeAuthType,
    
    // Helper functions
    isProfileIncomplete: () => user && (!user.name || !user.dob || !user.location),
    getUserDisplayName: () => user?.name || user?.phone || 'User',
    getUserAvatarUrl: () => user?.profilePhoto?.url || '/images/default-avatar.svg',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <div id="recaptcha-container"></div>
    </AuthContext.Provider>
  );
};

export default AuthContext;