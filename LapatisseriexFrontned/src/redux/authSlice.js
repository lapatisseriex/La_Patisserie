import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged
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

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Add popup handling configuration
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Initialize auth listener
export const initializeAuthListener = createAsyncThunk(
  'auth/initializeAuthListener',
  async (_, { dispatch }) => {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            // Get ID token and verify with backend
            const idToken = await firebaseUser.getIdToken();
            
            // Store token in localStorage
            localStorage.setItem('authToken', idToken);
            
            // Create user data - this is just basic Firebase data
            // Full user data will be loaded via getCurrentUser or auth verification
            const userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName,
              profilePhoto: { url: firebaseUser.photoURL || '', public_id: '' },
              // Add default fields to avoid undefined errors
              phone: '',
              phoneVerified: false,
              city: '',
              pincode: '',
              country: 'India',
              gender: '',
              dob: null,
              anniversary: null,
            };
            
            dispatch({
              type: 'auth/setUser',
              payload: {
                user: userData,
                token: idToken,
                isAuthenticated: true
              }
            });
          } catch (error) {
            console.error('Error processing auth state change:', error);
          }
        } else {
          // User is signed out
          localStorage.removeItem('authToken');
          dispatch({ type: 'auth/clearUser' });
        }
      });
      
      resolve(unsubscribe);
    });
  }
);

// Async thunks for authentication actions

// Google Sign-In
export const signInWithGoogle = createAsyncThunk(
  'auth/signInWithGoogle',
  async ({ locationId = null }, { rejectWithValue }) => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Get ID token
      const idToken = await user.getIdToken();
      
      // Store token in localStorage for API requests
      localStorage.setItem('authToken', idToken);
      
      // Send to backend for verification and user creation/update
      const response = await axios.post(`${API_URL}/auth/verify`, {
        idToken,
        locationId,
        authMethod: 'google'
      });
      
      // Create the user object with data from backend (backend data takes precedence)
      const userData = {
        // Firebase user data as fallback
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        profilePhoto: { url: user.photoURL || '', public_id: '' },
        // Backend user data (overwrites Firebase data)
        ...response.data.user,
        // Ensure all required fields are present with defaults
        phone: response.data.user.phone || '',
        phoneVerified: response.data.user.phoneVerified || false,
        phoneVerifiedAt: response.data.user.phoneVerifiedAt || null,
        city: response.data.user.city || '',
        pincode: response.data.user.pincode || '',
        country: response.data.user.country || 'India',
        gender: response.data.user.gender || '',
        dob: response.data.user.dob || null,
        anniversary: response.data.user.anniversary || null,
      };
      
      // Note: User data now cached via redux-persist, not manual localStorage
      
      return {
        user: userData,
        token: idToken,
        isNewUser: response.data.isNewUser
      };
    } catch (error) {
      console.error('Error signing in with Google:', error);
      
      let errorMessage = 'Failed to sign in with Google';
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Sign-in cancelled by user';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup blocked. Please allow popups for this site.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

// Email Sign Up
export const signUpWithEmail = createAsyncThunk(
  'auth/signUpWithEmail',
  async ({ email, password, locationId = null }, { rejectWithValue }) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      // Send email verification
      await sendEmailVerification(user);
      
      // Get ID token
      const idToken = await user.getIdToken();
      
      // Store token in localStorage for API requests
      localStorage.setItem('authToken', idToken);
      
      // Send to backend for user creation
      const response = await axios.post(`${API_URL}/auth/verify`, {
        idToken,
        locationId,
        authMethod: 'email'
      });
      
      // Create the user object with data from backend
      const userData = {
        uid: user.uid,
        email: user.email,
        ...response.data.user,
        // Ensure all required fields are present with defaults
        phone: response.data.user.phone || '',
        phoneVerified: response.data.user.phoneVerified || false,
        phoneVerifiedAt: response.data.user.phoneVerifiedAt || null,
        city: response.data.user.city || '',
        pincode: response.data.user.pincode || '',
        country: response.data.user.country || 'India',
        gender: response.data.user.gender || '',
        dob: response.data.user.dob || null,
        anniversary: response.data.user.anniversary || null,
      };
      
      // Note: User data now cached via redux-persist, not manual localStorage
      
      return {
        user: userData,
        token: idToken,
        isNewUser: response.data.isNewUser
      };
    } catch (error) {
      console.error('Error signing up with email:', error);
      return rejectWithValue(error.message || 'Failed to sign up with email');
    }
  }
);

// Email Sign In
export const signInWithEmail = createAsyncThunk(
  'auth/signInWithEmail',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      // Get ID token
      const idToken = await user.getIdToken();
      
      // Store token in localStorage for API requests
      localStorage.setItem('authToken', idToken);
      
      // Send to backend for verification
      const response = await axios.post(`${API_URL}/auth/verify`, {
        idToken,
        authMethod: 'email'
      });
      
      // Create the user object with data from backend
      const userData = {
        uid: user.uid,
        email: user.email,
        ...response.data.user,
        // Ensure all required fields are present with defaults
        phone: response.data.user.phone || '',
        phoneVerified: response.data.user.phoneVerified || false,
        phoneVerifiedAt: response.data.user.phoneVerifiedAt || null,
        city: response.data.user.city || '',
        pincode: response.data.user.pincode || '',
        country: response.data.user.country || 'India',
        gender: response.data.user.gender || '',
        dob: response.data.user.dob || null,
        anniversary: response.data.user.anniversary || null,
      };
      
      // Note: User data now cached via redux-persist, not manual localStorage
      
      return {
        user: userData,
        token: idToken,
        isNewUser: response.data.isNewUser
      };
    } catch (error) {
      console.error('Error signing in with email:', error);
      return rejectWithValue(error.message || 'Failed to sign in with email');
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
          // Ensure phone verification fields are included
          phone: response.data.user.phone || '',
          phoneVerified: response.data.user.phoneVerified || false,
          phoneVerifiedAt: response.data.user.phoneVerifiedAt || null,
        };
        
        // Note: User data now cached via redux-persist, not manual localStorage
        
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
        // Note: User data now cached via redux-persist, not manual localStorage
        
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
  authType: 'login', // login, signup, profile
  isAuthPanelOpen: false,
  isNewUser: false,
  authenticating: false,
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
      // Note: localStorage now handled by redux-persist, not manual writes
    },
    setUser: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = action.payload.isAuthenticated;
      state.loading = false;
    },
    clearUser: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
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
      // Google Sign In
      .addCase(signInWithGoogle.pending, (state) => {
        state.authenticating = true;
        state.error = null;
      })
      .addCase(signInWithGoogle.fulfilled, (state, action) => {
        state.authenticating = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.isNewUser = action.payload.isNewUser;
        
        if (action.payload.isNewUser) {
          state.authType = 'profile';
        } else {
          state.isAuthPanelOpen = false;
        }
      })
      .addCase(signInWithGoogle.rejected, (state, action) => {
        state.authenticating = false;
        state.error = action.payload;
      })
      
      // Email Sign Up
      .addCase(signUpWithEmail.pending, (state) => {
        state.authenticating = true;
        state.error = null;
      })
      .addCase(signUpWithEmail.fulfilled, (state, action) => {
        state.authenticating = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.isNewUser = action.payload.isNewUser;
        
        if (action.payload.isNewUser) {
          state.authType = 'profile';
        } else {
          state.isAuthPanelOpen = false;
        }
      })
      .addCase(signUpWithEmail.rejected, (state, action) => {
        state.authenticating = false;
        state.error = action.payload;
      })
      
      // Email Sign In
      .addCase(signInWithEmail.pending, (state) => {
        state.authenticating = true;
        state.error = null;
      })
      .addCase(signInWithEmail.fulfilled, (state, action) => {
        state.authenticating = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.isNewUser = action.payload.isNewUser;
        
        if (action.payload.isNewUser) {
          state.authType = 'profile';
        } else {
          state.isAuthPanelOpen = false;
        }
      })
      .addCase(signInWithEmail.rejected, (state, action) => {
        state.authenticating = false;
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
        state.isAuthPanelOpen = false;
        state.error = null;
        

      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Initialize Auth Listener
      .addCase(initializeAuthListener.pending, (state) => {
        state.loading = true;
      })
      .addCase(initializeAuthListener.fulfilled, (state, action) => {
        state.loading = false;
        // Auth state will be handled by the listener itself through setUser/clearUser
      })
      .addCase(initializeAuthListener.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setAuthType,
  setIsAuthPanelOpen,
  setIsNewUser,
  clearError,
  updateUser,
  initializeAuth,
  authExpired,
  setUser,
  clearUser
} = authSlice.actions;

export default authSlice.reducer;