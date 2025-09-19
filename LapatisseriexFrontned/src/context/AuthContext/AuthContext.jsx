import { createContext, useState, useContext, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPhoneNumber, 
  RecaptchaVerifier,
  signOut
} from 'firebase/auth';
import axios from 'axios';
import api from '../../services/apiService';

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

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authType, setAuthType] = useState('login'); // login, signup, otp, profile
  const [tempPhoneNumber, setTempPhoneNumber] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [isAuthPanelOpen, setIsAuthPanelOpen] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const isAuthenticated = !!user;


  // Backend API URL from environment variable
  const API_URL = import.meta.env.VITE_API_URL;

  // Handle authentication expiration events
  useEffect(() => {
    const handleAuthExpired = (event) => {
      console.log('Auth expired event received');
      // Clear user data
      setUser(null);
      // Show login modal
      setAuthType('login');
      setIsAuthPanelOpen(true);
      
      // Show error if available
      if (event.detail?.error) {
        setAuthError('Your session has expired. Please log in again.');
      }
    };
    
    // Listen for auth expired events from apiService
    window.addEventListener('auth:expired', handleAuthExpired);
    
    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, []);

  // Load cached user data from localStorage first
  useEffect(() => {
    // Check for cached user data first
    const cachedUser = localStorage.getItem('cachedUser');
    if (cachedUser) {
      try {
        const userData = JSON.parse(cachedUser);
        setUser(userData);
        setLoading(false);
      } catch (error) {
        console.error("Error parsing cached user data:", error);
      }
    }
    
    // Clear any potentially corrupted profile form data
    localStorage.removeItem('profileFormData');
    
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get ID token (avoid forced refresh to reduce quota usage)
          const idToken = await firebaseUser.getIdToken();
          
          // Store token in localStorage for API requests
          localStorage.setItem('authToken', idToken);
          
          // Verify with backend
          const response = await axios.post(`${API_URL}/auth/verify`, { idToken });
          
          // Get saved user data (if any) to restore fields like email and anniversary
          let savedUserData = {};
          try {
            const savedDataString = localStorage.getItem('savedUserData');
            if (savedDataString) {
              savedUserData = JSON.parse(savedDataString);
              console.log('Found saved user data to restore:', savedUserData);
            }
          } catch (error) {
            console.error('Error parsing saved user data:', error);
          }
          
          // Create the user object with data from backend, preserving saved fields
          const userData = {
            uid: firebaseUser.uid,
            phone: firebaseUser.phoneNumber,
            ...response.data.user,
            // Restore saved fields if they don't exist in the response
            email: response.data.user.email || savedUserData.email || null,
            anniversary: response.data.user.anniversary || savedUserData.anniversary || null,
            isEmailVerified: response.data.user.isEmailVerified || savedUserData.isEmailVerified || false
          };
          
          console.log('Restored user data with saved fields:', userData);
          
          // Set user state
          setUser(userData);
          
          // Cache user data in localStorage
          localStorage.setItem('cachedUser', JSON.stringify(userData));
          
          // Clear any potentially corrupted profile form data
          localStorage.removeItem('profileFormData');
          
          setIsNewUser(response.data.isNewUser || false);
          
          // If new user, show profile completion form
          if (response.data.isNewUser) {
            setAuthType('profile');
          }
          
          // Get fresh user data from /api/users/me to ensure we have the latest
          try {
            // Use shared api instance so the interceptor attaches token and handles 401 refresh
            const meResponse = await api.get(`/users/me`);
            
            if (meResponse.data.success) {
              // Get saved user data (if any)
              let savedUserData = {};
              try {
                const savedDataString = localStorage.getItem('savedUserData');
                if (savedDataString) {
                  savedUserData = JSON.parse(savedDataString);
                  console.log('Found saved user data to restore for me endpoint:', savedUserData);
                }
              } catch (error) {
                console.error('Error parsing saved user data:', error);
              }
              
              // Update user state with the fresh data, preserving saved fields
              const freshUserData = {
                uid: firebaseUser.uid,
                phone: firebaseUser.phoneNumber,
                ...meResponse.data.user,
                // Restore saved fields if they don't exist in the response
                email: meResponse.data.user.email || savedUserData.email || null,
                anniversary: meResponse.data.user.anniversary || savedUserData.anniversary || null,
                isEmailVerified: meResponse.data.user.isEmailVerified || savedUserData.isEmailVerified || false
              };
              
              setUser(freshUserData);
              localStorage.setItem('cachedUser', JSON.stringify(freshUserData));
            }
          } catch (meError) {
            console.error("Error fetching fresh user data:", meError);
          }
        } catch (error) {
          console.error("Error verifying user with backend:", error);
          // If we hit quota or network issues, keep cached user so app remains usable
          if (!user) {
            const cached = localStorage.getItem('cachedUser');
            if (cached) {
              try { setUser(JSON.parse(cached)); } catch {}
            }
          }
          setAuthError("Failed to verify authentication with server");
        }
      } else {
        setUser(null);
        // Clear cached user data when logged out but keep savedUserData
        localStorage.removeItem('cachedUser');
        localStorage.removeItem('profileFormData');
        // Note: We're not removing 'savedUserData' so it can be restored on next login
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Reset reCAPTCHA when needed
  const resetRecaptcha = () => {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
  };

  // Initialize reCAPTCHA verification
  const initRecaptcha = (elementId) => {
    resetRecaptcha();
    
    window.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
      'size': 'invisible',
      'callback': () => {
        // reCAPTCHA solved, allow signInWithPhoneNumber
      },
      'expired-callback': () => {
        resetRecaptcha();
        setAuthError('reCAPTCHA expired. Please try again.');
      }
    });
    
    return window.recaptchaVerifier;
  };

  // Send OTP via Firebase
  const sendOTP = async (phoneNumber, locationId = null) => {
    try {
      setAuthError(null);
      setLoading(true);
      
      // Format phone number with country code if not already included
      const formattedPhoneNumber = phoneNumber.startsWith('+91') 
        ? phoneNumber 
        : `+91${phoneNumber}`;
      
      // Initialize reCAPTCHA
      const recaptchaVerifier = initRecaptcha('recaptcha-container');
      
      // Send OTP
      const result = await signInWithPhoneNumber(
        auth, 
        formattedPhoneNumber, 
        recaptchaVerifier
      );
      
      // Store confirmation result and phone number
      setConfirmationResult(result);
      setTempPhoneNumber(formattedPhoneNumber);
      setAuthType('otp');
      
      // Store locationId if provided (for signup)
      if (locationId) {
        localStorage.setItem('temp_location_id', locationId);
      }
      
      return true;
    } catch (error) {
      console.error("Error sending OTP:", error);
      setAuthError(error.message || "Failed to send verification code");
      resetRecaptcha();
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP code
  const verifyOTP = async (otp) => {
    if (!confirmationResult) {
      setAuthError("Verification session expired. Please request a new code.");
      return false;
    }

    try {
      setAuthError(null);
      setLoading(true);
      
      // Clear any potentially corrupted profile form data
      localStorage.removeItem('profileFormData');
      
      // Track verification start time to measure performance
      const verifyStartTime = Date.now();
      console.log('OTP verification started');
      
      // Confirm OTP
      const result = await confirmationResult.confirm(otp);
      console.log(`OTP confirmed in ${Date.now() - verifyStartTime}ms`);
      
      // Get authenticated user
      const firebaseUser = result.user;
      
      // Get ID token to verify with backend (force refresh)
      console.log('Getting ID token');
      const tokenStartTime = Date.now();
      const idToken = await firebaseUser.getIdToken(true);
      console.log(`ID token obtained in ${Date.now() - tokenStartTime}ms`);
      
      // Store token in localStorage for API requests
      localStorage.setItem('authToken', idToken);
      
      // Get location ID if stored (for signup)
      const locationId = localStorage.getItem('temp_location_id');
      
      // Verify with backend
      console.log('Verifying with backend');
      const backendStartTime = Date.now();
      const response = await axios.post(`${API_URL}/auth/verify`, { 
        idToken,
        locationId, // Include locationId if available
        phone: firebaseUser.phoneNumber // Explicitly send phone number
      });
      console.log(`Backend verification completed in ${Date.now() - backendStartTime}ms`);
      
      // Clear stored location ID
      localStorage.removeItem('temp_location_id');
      
      // Set user data from backend, ensuring date format is correct
      const userData = response.data.user;
      setUser({
        uid: firebaseUser.uid,
        phone: firebaseUser.phoneNumber,
        ...userData,
        // Format date if needed
        dob: userData.dob ? userData.dob : null,
      });
      
      // Get fresh user data from /api/users/me to ensure we have the latest
      try {
        const meResponse = await axios.get(`${API_URL}/users/me`, { 
          headers: { Authorization: `Bearer ${idToken}` } 
        });
        
        if (meResponse.data.success) {
          // Update user state with the fresh data
          const freshUserData = {
            uid: firebaseUser.uid,
            phone: firebaseUser.phoneNumber,
            ...meResponse.data.user
          };
          
          setUser(freshUserData);
          localStorage.setItem('cachedUser', JSON.stringify(freshUserData));
        }
      } catch (meError) {
        console.error("Error fetching fresh user data:", meError);
      }
      
      setIsNewUser(response.data.isNewUser || false);
      
      // If new user or user with missing profile info, show profile completion form
      if (response.data.isNewUser || !response.data.user.name || !response.data.user.dob) {
        setAuthType('profile');
        setIsAuthPanelOpen(true); // Keep auth panel open for profile completion
      } else {
        setIsAuthPanelOpen(false); // Close auth panel for existing users with complete profiles
      }
      
      return true;
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setAuthError(error.message || "Invalid verification code");
      return false;
    } finally {
      setLoading(false);
      // Clear confirmation result
      setConfirmationResult(null);
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    if (!user) {
      setAuthError("You must be logged in to update profile");
      return false;
    }

    try {
      setAuthError(null);
      setLoading(true);
      
      // Get fresh ID token
      const idToken = await auth.currentUser.getIdToken(true);
      
      // Store token in localStorage for API requests
      localStorage.setItem('authToken', idToken);
      
      console.log("Sending profile update to backend:", profileData);
      
      // Send profile update to backend
      const response = await axios.put(
        `${API_URL}/users/${user.uid}`, 
        profileData,
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      
      console.log("Profile update response:", response.data);
      console.log("Response user object:", JSON.stringify(response.data.user, null, 2));
      
      // Check if this is an admin update on another user's account
      // If it is, don't update the current user's data in localStorage
      if (response.data.isAdminUpdate) {
        console.log("Admin update detected - not updating local user data");
        return true;
      }
      
      // Update local user data
      setUser(prevUser => {
        const updatedUser = {
          ...prevUser,
          ...response.data.user
        };
        console.log("Updated user in state:", updatedUser);
        
        // Update cached user data in localStorage
        localStorage.setItem('cachedUser', JSON.stringify(updatedUser));
        
        return updatedUser;
      });
      
      // Check if we're in the auth panel or on the profile page
      const isInProfilePage = window.location.pathname === "/profile";
      
      // Only close auth panel if we're not on the profile page
      if (!isInProfilePage) {
        setIsAuthPanelOpen(false);
      }
      
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      setAuthError(error.message || "Failed to update profile");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Save user email, name, anniversary date, and other important fields before logout for persistence
      let savedUserData = {};
      if (user) {
        // Extract only what we need to preserve
        const { email, name, anniversary, isEmailVerified, gender, dob, country, location, hostel } = user;
        savedUserData = { 
          email, 
          name,
          anniversary, 
          isEmailVerified,
          gender,
          dob,
          country,
          location,
          hostel
        };
        
        // Make sure email and verification status are preserved
        if (!savedUserData.email && user.email) {
          savedUserData.email = user.email;
        }
        
        if (savedUserData.isEmailVerified === undefined && user.isEmailVerified !== undefined) {
          savedUserData.isEmailVerified = user.isEmailVerified;
        }
        
        localStorage.setItem('savedUserData', JSON.stringify(savedUserData));
        console.log('Saving user data before logout:', savedUserData);
      }
      
      await signOut(auth);
      setUser(null);
      
      // Clear cached data on logout, but keep savedUserData
      localStorage.removeItem('cachedUser');
      localStorage.removeItem('authToken');
      localStorage.removeItem('profileFormData');
      
      return true;
    } catch (error) {
      console.error("Error logging out:", error);
      setAuthError(error.message || "Failed to log out");
      return false;
    }
  };

  // Toggle auth panel with smooth transition
  const toggleAuthPanel = () => {
    if (isAuthPanelOpen) {
      // If closing, add a small delay to ensure the animation plays smoothly
      document.body.classList.add('auth-panel-closing');
      setTimeout(() => {
        setIsAuthPanelOpen(false);
        document.body.classList.remove('auth-panel-closing');
      }, 50);
    } else {
      // Opening panel
      setIsAuthPanelOpen(true);
      setAuthType('login');
      setAuthError(null);
    }
  };

  // Update specific user fields (for profile photo, etc.)
  const updateUser = (userData) => {
    if (!user) {
      setAuthError("You must be logged in to update user data");
      return false;
    }

    console.log('Updating user with data:', userData);
    
    // Make sure we're creating a new object reference to trigger re-renders
    setUser(prevUser => {
      const updatedUser = {
        ...prevUser,
        ...userData
      };
      console.log('Updated user object:', updatedUser);
      return updatedUser;
    });

    // Update the cached user data
    const cachedUser = JSON.parse(localStorage.getItem('cachedUser') || '{}');
    const updatedCache = {
      ...cachedUser,
      ...userData
    };
    console.log('Updating cached user data:', updatedCache);
    localStorage.setItem('cachedUser', JSON.stringify(updatedCache));
  };
  
  // Email verification functions
  const updateEmailVerificationState = (email, isVerified = true) => {
    if (!user) return;
    
    const userData = {
      email,
      isEmailVerified: isVerified
    };
    
    // Update user in state
    updateUser(userData);
    
    // Update the cached user data
    const cachedUser = JSON.parse(localStorage.getItem('cachedUser') || '{}');
    cachedUser.email = email;
    cachedUser.isEmailVerified = isVerified;
    localStorage.setItem('cachedUser', JSON.stringify(cachedUser));
    
    // ALSO update the savedUserData for persistence across sessions
    const savedUserData = JSON.parse(localStorage.getItem('savedUserData') || '{}');
    savedUserData.email = email;
    savedUserData.isEmailVerified = isVerified;
    localStorage.setItem('savedUserData', JSON.stringify(savedUserData));
    
    console.log('Email verification state updated:', { email, isVerified });
  };

  // Change auth type (login, signup, otp, profile)
  const changeAuthType = (type) => {
    setAuthType(type);
    setAuthError(null);
  };

  const value = {
    user,
    isAuthenticated,
    setUser, 
    loading,
    authError,
    authType,
    isAuthPanelOpen,
    isNewUser,
    sendOTP,
    verifyOTP,
    updateProfile,
    updateUser,
    updateEmailVerificationState,
    logout,
    toggleAuthPanel,
    changeAuthType,
    tempPhoneNumber
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;





