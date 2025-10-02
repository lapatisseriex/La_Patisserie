import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPhoneNumber, 
  RecaptchaVerifier,
  signOut
} from 'firebase/auth';
import axios from 'axios';
import api from '../services/apiService';

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

// Backend API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL;

// Store confirmation result temporarily (not in Redux state to avoid persistence issues)
let temporaryConfirmationResult = null;

// Helper function to check if confirmation result is available
export const hasConfirmationResult = () => !!temporaryConfirmationResult;

// Helper function to clear confirmation result (for cleanup)
export const clearConfirmationResult = () => {
  temporaryConfirmationResult = null;
};

// Async thunks for authentication actions
export const sendOTP = createAsyncThunk(
  'auth/sendOTP',
  async ({ phoneNumber, recaptchaContainerId }, { rejectWithValue }) => {
    try {
      // Clear any existing recaptcha
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }

      // Create new RecaptchaVerifier
      window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
        size: 'invisible',
        callback: () => {
          // Recaptcha resolved
        },
        'expired-callback': () => {
          // Recaptcha expired
        }
      });

      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
      
      // Store confirmation result temporarily outside Redux state
      temporaryConfirmationResult = confirmationResult;
      
      return {
        phoneNumber
      };
    } catch (error) {
      console.error('Error sending OTP:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async ({ otp, locationId }, { rejectWithValue }) => {
    try {
      // Use the temporarily stored confirmation result
      if (!temporaryConfirmationResult) {
        throw new Error('No confirmation result found. Please resend OTP.');
      }
      
      // Verify OTP with Firebase
      const result = await temporaryConfirmationResult.confirm(otp);
      const firebaseUser = result.user;

      // Clear the temporary confirmation result after use
      temporaryConfirmationResult = null;

      // Get ID token
      const idToken = await firebaseUser.getIdToken();
      
      // Store token in localStorage for API requests
      localStorage.setItem('authToken', idToken);
      
      // Verify with backend
      const response = await axios.post(`${API_URL}/auth/verify`, { 
        idToken,
        locationId 
      });
      
      // Get saved user data (if any) to restore fields like email and anniversary
      let savedUserData = {};
      try {
        const savedDataString = localStorage.getItem('savedUserData');
        if (savedDataString) {
          savedUserData = JSON.parse(savedDataString);
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
      };
      
      // Cache user data in localStorage
      localStorage.setItem('cachedUser', JSON.stringify(userData));
      
      return {
        user: userData,
        token: idToken,
        isNewUser: response.data.isNewUser || false
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users/me');
      
      if (response.data.success) {
        // Get saved user data (if any)
        let savedUserData = {};
        try {
          const savedDataString = localStorage.getItem('savedUserData');
          if (savedDataString) {
            savedUserData = JSON.parse(savedDataString);
          }
        } catch (error) {
          console.error('Error parsing saved user data:', error);
        }
        
        // Update user state with the fresh data, preserving saved fields
        const freshUserData = {
          ...response.data.user,
          // Restore saved fields if they don't exist in the response
          email: response.data.user.email || savedUserData.email || null,
          anniversary: response.data.user.anniversary || savedUserData.anniversary || null,
        };
        
        // Cache user data in localStorage
        localStorage.setItem('cachedUser', JSON.stringify(freshUserData));
        
        return freshUserData;
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (profileData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const userId = auth.user?.uid;
      
      if (!userId) {
        return rejectWithValue('User not authenticated');
      }
      
      const response = await api.put(`/users/${userId}`, profileData);
      
      if (response.data.success) {
        // Cache updated user data
        localStorage.setItem('cachedUser', JSON.stringify(response.data.user));
        
        return response.data.user;
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await signOut(auth);
      
      // Clear localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('cachedUser');
      
      // Clear recaptcha
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      
      return null;
    } catch (error) {
      console.error('Error logging out:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  authType: 'login', // login, signup, otp, profile
  tempPhoneNumber: '',
  isAuthPanelOpen: false,
  isNewUser: false,
  otpSending: false,
  otpVerifying: false,
  profileUpdating: false,
};

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthType: (state, action) => {
      state.authType = action.payload;
    },
    setTempPhoneNumber: (state, action) => {
      state.tempPhoneNumber = action.payload;
    },
    setIsAuthPanelOpen: (state, action) => {
      state.isAuthPanelOpen = action.payload;
    },
    setIsNewUser: (state, action) => {
      state.isNewUser = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action) => {
      // Update user data directly in state
      state.user = { ...state.user, ...action.payload };
      // Update localStorage cache
      localStorage.setItem('cachedUser', JSON.stringify(state.user));
    },
    initializeAuth: (state) => {
      // Initialize token from localStorage
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        state.token = storedToken;
      }
      
      // Initialize user from localStorage
      const cachedUser = localStorage.getItem('cachedUser');
      if (cachedUser) {
        try {
          const userData = JSON.parse(cachedUser);
          state.user = userData;
          state.isAuthenticated = true;
        } catch (error) {
          console.error("Error parsing cached user data:", error);
        }
      }
      
      state.loading = false;
    },
    authExpired: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.authType = 'login';
      state.isAuthPanelOpen = true;
      state.error = 'Your session has expired. Please log in again.';
    },
  },
  extraReducers: (builder) => {
    builder
      // Send OTP
      .addCase(sendOTP.pending, (state) => {
        state.otpSending = true;
        state.error = null;
      })
      .addCase(sendOTP.fulfilled, (state, action) => {
        state.otpSending = false;
        state.tempPhoneNumber = action.payload.phoneNumber;
        state.authType = 'otp';
      })
      .addCase(sendOTP.rejected, (state, action) => {
        state.otpSending = false;
        state.error = action.payload;
      })
      
      // Verify OTP
      .addCase(verifyOTP.pending, (state) => {
        state.otpVerifying = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.otpVerifying = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.isNewUser = action.payload.isNewUser;
        state.tempPhoneNumber = '';
        
        if (action.payload.isNewUser) {
          state.authType = 'profile';
        } else {
          state.isAuthPanelOpen = false;
        }
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.otpVerifying = false;
        state.error = action.payload;
      })
      
      // Get current user
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update user profile
      .addCase(updateUserProfile.pending, (state) => {
        state.profileUpdating = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.profileUpdating = false;
        state.user = action.payload;
        state.isNewUser = false;
        state.isAuthPanelOpen = false;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.profileUpdating = false;
        state.error = action.payload;
      })
      
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.authType = 'login';
        state.isNewUser = false;
        state.tempPhoneNumber = '';
        state.isAuthPanelOpen = false;
        state.error = null;
        
        // Clear temporary confirmation result on logout
        temporaryConfirmationResult = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const {
  setAuthType,
  setTempPhoneNumber,
  setIsAuthPanelOpen,
  setIsNewUser,
  clearError,
  updateUser,
  initializeAuth,
  authExpired,
} = authSlice.actions;

export default authSlice.reducer;