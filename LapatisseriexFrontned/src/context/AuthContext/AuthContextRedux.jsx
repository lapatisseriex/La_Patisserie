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

  // Phone normalization removed - no longer needed

  // Legacy function - deprecated
  const sendOTP = useCallback(async (rawPhoneNumber) => {
    // Throttle duplicate rapid requests (5s window)
    const now = Date.now();
    if (window.__lastOtpRequestTime && (now - window.__lastOtpRequestTime) < 5000) {
      dispatch(setError('Please wait a moment before requesting another OTP.'));
      return false;
    }
    window.__lastOtpRequestTime = now;

    try {
      dispatch(setError(null));
      dispatch(setLoading(true));

      const phoneNumber = normalizePhoneNumber(rawPhoneNumber);
      if (!phoneNumber) {
        dispatch(setError('Invalid phone number format. Use e.g. +911234567890'));
        return false;
      }

      // Clean up any existing reCAPTCHA instance & DOM
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch (_) {}
        window.recaptchaVerifier = null;
      }
      const recaptchaContainer = document.getElementById('recaptcha-container');
      if (recaptchaContainer) {
        recaptchaContainer.innerHTML = '';
      }

      // Create a fresh invisible reCAPTCHA verifier
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => console.log('reCAPTCHA solved'),
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
          dispatch(setError('reCAPTCHA expired. Please try again.'));
        }
      });

      let confirmation;
      try {
        confirmation = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
      } catch (recaptchaErr) {
        // If reCAPTCHA double-render issue occurs, attempt a one-time rebuild
        if (/already been rendered/i.test(recaptchaErr.message)) {
          try {
            window.recaptchaVerifier.clear();
          } catch (_) {}
          window.recaptchaVerifier = null;
          if (recaptchaContainer) recaptchaContainer.innerHTML = '';
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
          confirmation = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
        } else {
          throw recaptchaErr;
        }
      }

      dispatch(setConfirmationResult(confirmation));
      dispatch(setTempPhoneNumber(phoneNumber));
      dispatch(setAuthType('otp'));
      return true;
    } catch (error) {
      console.error('Error sending OTP:', error);
      // Provide cleaner messages for common Firebase errors
      let msg = error.message || 'Failed to send OTP';
      if (/invalid-phone-number/i.test(msg)) {
        msg = 'Invalid phone number. Include country code, e.g. +911234567890';
      } else if (/too-many-requests/i.test(msg)) {
        msg = 'Too many OTP attempts. Please wait and try again later.';
      }
      dispatch(setError(msg));
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
      
      // Close the auth panel after successful verification
      setTimeout(() => {
        dispatch(setIsAuthPanelOpen(false));
      }, 1000); // Small delay to show success before closing
      
      // The onAuthStateChanged listener will handle the rest
      return true;
    } catch (error) {
      console.error("Error verifying OTP:", error);
      dispatch(setError(error.message || "Invalid verification code"));
      return false;
    } finally {
      dispatch(setLoading(false));
    }
  }, [confirmationResult, dispatch]);  // Update profile function
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