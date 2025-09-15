import { createContext, useState, useContext, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPhoneNumber, 
  RecaptchaVerifier,
  signOut
} from 'firebase/auth';
import axios from 'axios';

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
    
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get ID token
          const idToken = await firebaseUser.getIdToken();
          
          // Verify with backend
          const response = await axios.post(`${API_URL}/auth/verify`, { idToken });
          
          // Create the user object with data from backend
          const userData = {
            uid: firebaseUser.uid,
            phone: firebaseUser.phoneNumber,
            ...response.data.user
          };
          
          // Set user state
          setUser(userData);
          
          // Cache user data in localStorage
          localStorage.setItem('cachedUser', JSON.stringify(userData));
          
          setIsNewUser(response.data.isNewUser || false);
          
          // If new user, show profile completion form
          if (response.data.isNewUser) {
            setAuthType('profile');
          }
        } catch (error) {
          console.error("Error verifying user with backend:", error);
          setAuthError("Failed to verify authentication with server");
        }
      } else {
        setUser(null);
        // Clear cached user data when logged out
        localStorage.removeItem('cachedUser');
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
      
      // Confirm OTP
      const result = await confirmationResult.confirm(otp);
      
      // Get authenticated user
      const firebaseUser = result.user;
      
      // Get ID token to verify with backend
      const idToken = await firebaseUser.getIdToken();
      
      // Get location ID if stored (for signup)
      const locationId = localStorage.getItem('temp_location_id');
      
      // Verify with backend
      const response = await axios.post(`${API_URL}/auth/verify`, { 
        idToken,
        locationId // Include locationId if available
      });
      
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
      
      console.log("Sending profile update to backend:", profileData);
      
      // Send profile update to backend
      const response = await axios.put(
        `${API_URL}/users/${user.uid}`, 
        profileData,
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      
      console.log("Profile update response:", response.data);
      
      // Update local user data
      setUser(prevUser => {
        const updatedUser = {
          ...prevUser,
          ...response.data.user
        };
        console.log("Updated user in state:", updatedUser);
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
      await signOut(auth);
      setUser(null);
      // Clear cached user data on logout
      localStorage.removeItem('cachedUser');
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





