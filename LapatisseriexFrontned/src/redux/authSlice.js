import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  // getAuth removed; we use shared auth instance
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
import { auth } from '../config/firebase';

// Use shared Firebase Auth instance from config to avoid duplicate initialization

// Backend API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL;
const VERCEL_URL = import.meta.env.VITE_VERCEL_API_URL;

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
            
            // Verify token with backend to get full user (including role, location)
            try {
              const verifyResp = await axios.post(`${API_URL}/auth/verify`, {
                idToken,
                authMethod: 'session'
              });
              const backendUser = {
                // Firebase fallback
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName,
                profilePhoto: { url: firebaseUser.photoURL || '', public_id: '' },
                // Backend authoritative data
                ...verifyResp.data.user};
              // Persist rich user immediately to minimize UI flicker
              localStorage.setItem('cachedUser', JSON.stringify(backendUser));

              dispatch({
                type: 'auth/setUser',
                payload: {
                  user: backendUser,
                  token: idToken,
                  isAuthenticated: true
                }
              });
            } catch (verifyErr) {
              console.warn('Auth verify during listener failed, falling back to Firebase data:', verifyErr?.response?.data || verifyErr?.message);
              // Create minimal user as fallback
              const userData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName,
                profilePhoto: { url: firebaseUser.photoURL || '', public_id: '' }};
              dispatch({
                type: 'auth/setUser',
                payload: {
                  user: userData,
                  token: idToken,
                  isAuthenticated: true
                }
              });
              // Attempt a non-blocking refresh for complete data
              dispatch(getCurrentUser());
            }
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
  async ({ locationId = null }, { rejectWithValue, dispatch }) => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const isNewFirebaseUser = !!(result && result.additionalUserInfo && result.additionalUserInfo.isNewUser);

      // Optimistically close modal immediately for returning users to feel snappier
      if (!isNewFirebaseUser) {
        dispatch({ type: 'auth/setIsAuthPanelOpen', payload: false });
      } else {
        // For brand new users, switch modal view to profile while backend prepares the user
        dispatch({ type: 'auth/setAuthType', payload: 'profile' });
      }
      
      // Get ID token
      const idToken = await user.getIdToken();
      
      // Store token in localStorage for API requests
      localStorage.setItem('authToken', idToken);
      
      // Optimistically set user immediately so UI switches from "Login" to "Profile" without delay
      // This uses Firebase data first; it will be enriched by backend response below.
      dispatch({
        type: 'auth/setUser',
        payload: {
          user: {
            uid: user.uid,
            email: user.email,
            name: user.displayName,
            profilePhoto: { url: user.photoURL || '', public_id: '' }},
          token: idToken,
          isAuthenticated: true
        }
      });
      
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
        anniversary: response.data.user.anniversary || null};
      
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

// Send OTP for email signup
export const sendSignupOTP = createAsyncThunk(
  'auth/sendSignupOTP',
  async ({ email }, { rejectWithValue }) => {
    try {
      console.log('🔄 Sending signup OTP to:', email);
      
      const response = await axios.post(`${VERCEL_URL}/auth/signup/send-otp`, { email });
      
      console.log('✅ Signup OTP sent successfully');
      
      return {
        email: response.data.email,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ Error sending signup OTP:', error);
      
      let errorMessage = 'Failed to send verification code';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

// Verify OTP and create account
export const verifySignupOTP = createAsyncThunk(
  'auth/verifySignupOTP',
  async ({ email, otp, password, name, locationId = null }, { rejectWithValue }) => {
    try {
      console.log('🔄 Verifying signup OTP and creating account for:', email);
      
      // Verify OTP and create user account
      const response = await axios.post(`${VERCEL_URL}/auth/signup/verify-otp`, {
        email,
        otp,
        password,
        name,
        locationId
      });
      
      console.log('✅ Account created successfully');
      
      // Sign in to Firebase with the custom token
      const { signInWithCustomToken } = await import('firebase/auth');
      const userCredential = await signInWithCustomToken(auth, response.data.customToken);
      const firebaseUser = userCredential.user;
      
      // Get ID token
      const idToken = await firebaseUser.getIdToken(true);
      
      // Store token in localStorage
      localStorage.setItem('authToken', idToken);
      
      // Create user object from backend response
      const userData = {
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
        anniversary: response.data.user.anniversary || null};
      
      return {
        user: userData,
        token: idToken,
        isNewUser: response.data.isNewUser
      };
    } catch (error) {
      console.error('❌ Error verifying signup OTP:', error);
      
      let errorMessage = 'Failed to verify code and create account';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

// Email Sign Up (Legacy - kept for backward compatibility)
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
        anniversary: response.data.user.anniversary || null};
      
      // Note: User data now cached via redux-persist, not manual localStorage
      
      return {
        user: userData,
        token: idToken,
        isNewUser: response.data.isNewUser
      };
    } catch (error) {
      console.error('Error signing up with email:', error);
      
      // Provide user-friendly error messages for common Firebase errors
      let errorMessage = 'Failed to sign up with email';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists. Please try signing in instead or use a different email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password with at least 6 characters.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address. Please enter a valid email.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/password accounts are not enabled. Please contact support.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many unsuccessful sign-up attempts. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

// Email Sign In
export const signInWithEmail = createAsyncThunk(
  'auth/signInWithEmail',
  async ({ email, password }, { rejectWithValue, dispatch }) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      // Get ID token
      const idToken = await user.getIdToken();
      
      // Store token in localStorage for API requests
      localStorage.setItem('authToken', idToken);
      
      // Optimistically set user immediately so UI switches from "Login" to "Profile" without delay
      // This uses Firebase user data; backend verification below will enrich it.
      dispatch({
        type: 'auth/setUser',
        payload: {
          user: {
            uid: user.uid,
            email: user.email,
            name: user.displayName,
            profilePhoto: { url: user.photoURL || '', public_id: '' }},
          token: idToken,
          isAuthenticated: true
        }
      });
      
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
        anniversary: response.data.user.anniversary || null};
      
      // Note: User data now cached via redux-persist, not manual localStorage
      
      return {
        user: userData,
        token: idToken,
        isNewUser: response.data.isNewUser
      };
    } catch (error) {
      console.error('Error signing in with email:', error);
      
      // Provide user-friendly error messages for common Firebase errors
      let errorMessage = 'Failed to sign in with email';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Email not found! This email address is not registered. Please sign up to create a new account.';
        // Store the email to pre-fill signup form
        localStorage.setItem('pendingSignupEmail', email);
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please enter the correct password or reset your password if you forgot it.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address. Please enter a valid email.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact support.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many unsuccessful sign-in attempts. Please try again later or reset your password.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return rejectWithValue(errorMessage);
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
          phoneVerifiedAt: response.data.user.phoneVerifiedAt || null};
        
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

// Password Reset Functions
export const sendPasswordResetOTP = createAsyncThunk(
  'auth/sendPasswordResetOTP',
  async ({ email }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${VERCEL_URL}/auth/forgot-password`, {
        email: email.toLowerCase().trim()
      });
      
      return {
        message: response.data.message,
        email: email.toLowerCase().trim(),
        expiresIn: response.data.expiresIn
      };
    } catch (error) {
      console.error('Error sending password reset OTP:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to send password reset OTP');
    }
  }
);

export const verifyPasswordResetOTP = createAsyncThunk(
  'auth/verifyPasswordResetOTP',
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${VERCEL_URL}/auth/verify-reset-otp`, {
        email: email.toLowerCase().trim(),
        otp: otp.trim()
      });
      
      return {
        message: response.data.message,
        email: email.toLowerCase().trim()
      };
    } catch (error) {
      console.error('Error verifying password reset OTP:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to verify OTP');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ email, newPassword }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${VERCEL_URL}/auth/reset-password`, {
        email: email.toLowerCase().trim(),
        newPassword
      });
      
      return {
        message: response.data.message
      };
    } catch (error) {
      console.error('Error resetting password:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to reset password');
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
  authType: 'login', // login, signup, profile, forgot-password, verify-otp, reset-password
  isAuthPanelOpen: false,
  isNewUser: false,
  authenticating: false,
  profileUpdating: false,
  hydrated: false, // becomes true after initializing from storage / backend
  // Password reset state
  passwordReset: {
    step: 'email', // 'email', 'otp', 'password'
    email: '',
    loading: false,
    error: null,
    message: '',
    otpVerified: false
  },
  // Signup OTP state
  signupOtp: {
    email: '',
    otpSent: false,
    loading: false,
    error: null,
    message: ''
  },
  // Temporary storage for login form email
  loginFormEmail: ''
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
      // Merge to avoid wiping fields like role when Firebase sends partial user
      state.user = { ...(state.user || {}), ...(action.payload.user || {}) };
      if (action.payload.token !== undefined) state.token = action.payload.token;
      if (action.payload.isAuthenticated !== undefined) state.isAuthenticated = action.payload.isAuthenticated;
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
      state.hydrated = true;
    },
    authExpired: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.authType = 'login';
      state.isAuthPanelOpen = true;
      state.error = 'Your session has expired. Please log in again.';
    },
    // Password reset actions
    resetPasswordState: (state) => {
      state.passwordReset = {
        step: 'email',
        email: '',
        loading: false,
        error: null,
        message: '',
        otpVerified: false
      };
    },
    setPasswordResetStep: (state, action) => {
      state.passwordReset.step = action.payload;
    },
    setPasswordResetEmail: (state, action) => {
      state.passwordReset.email = action.payload;
    },
    setLoginFormEmail: (state, action) => {
      state.loginFormEmail = action.payload;
    },
    // Signup OTP actions
    resetSignupOtpState: (state) => {
      state.signupOtp = {
        email: '',
        otpSent: false,
        loading: false,
        error: null,
        message: ''
      };
    }},
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
      })
      
      // Password Reset OTP Send
      .addCase(sendPasswordResetOTP.pending, (state) => {
        state.passwordReset.loading = true;
        state.passwordReset.error = null;
        state.passwordReset.message = '';
      })
      .addCase(sendPasswordResetOTP.fulfilled, (state, action) => {
        state.passwordReset.loading = false;
        state.passwordReset.email = action.payload.email;
        state.passwordReset.message = action.payload.message;
        state.passwordReset.step = 'otp';
      })
      .addCase(sendPasswordResetOTP.rejected, (state, action) => {
        state.passwordReset.loading = false;
        state.passwordReset.error = action.payload;
      })
      
      // Password Reset OTP Verify
      .addCase(verifyPasswordResetOTP.pending, (state) => {
        state.passwordReset.loading = true;
        state.passwordReset.error = null;
      })
      .addCase(verifyPasswordResetOTP.fulfilled, (state, action) => {
        state.passwordReset.loading = false;
        state.passwordReset.message = action.payload.message;
        state.passwordReset.otpVerified = true;
        state.passwordReset.step = 'password';
      })
      .addCase(verifyPasswordResetOTP.rejected, (state, action) => {
        state.passwordReset.loading = false;
        state.passwordReset.error = action.payload;
      })
      
      // Password Reset Final
      .addCase(resetPassword.pending, (state) => {
        state.passwordReset.loading = true;
        state.passwordReset.error = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.passwordReset.loading = false;
        state.passwordReset.message = action.payload.message;
        // Reset password reset state after successful reset
        state.passwordReset = {
          step: 'email',
          email: '',
          loading: false,
          error: null,
          message: '',
          otpVerified: false
        };
        // Switch back to login
        state.authType = 'login';
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.passwordReset.loading = false;
        state.passwordReset.error = action.payload;
      })
      
      // Signup OTP Send
      .addCase(sendSignupOTP.pending, (state) => {
        state.signupOtp.loading = true;
        state.signupOtp.error = null;
        state.signupOtp.message = '';
      })
      .addCase(sendSignupOTP.fulfilled, (state, action) => {
        state.signupOtp.loading = false;
        state.signupOtp.email = action.payload.email;
        state.signupOtp.message = action.payload.message;
        state.signupOtp.otpSent = true;
      })
      .addCase(sendSignupOTP.rejected, (state, action) => {
        state.signupOtp.loading = false;
        state.signupOtp.error = action.payload;
        state.signupOtp.otpSent = false;
      })
      
      // Signup OTP Verify
      .addCase(verifySignupOTP.pending, (state) => {
        state.signupOtp.loading = true;
        state.signupOtp.error = null;
      })
      .addCase(verifySignupOTP.fulfilled, (state, action) => {
        state.signupOtp.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.isNewUser = action.payload.isNewUser;
        
        // Reset signup OTP state
        state.signupOtp = {
          email: '',
          otpSent: false,
          loading: false,
          error: null,
          message: ''
        };
        
        if (action.payload.isNewUser) {
          state.authType = 'profile';
        } else {
          state.isAuthPanelOpen = false;
        }
      })
      .addCase(verifySignupOTP.rejected, (state, action) => {
        state.signupOtp.loading = false;
        state.signupOtp.error = action.payload;
      });
  }});

export const {
  setAuthType,
  setIsAuthPanelOpen,
  setIsNewUser,
  clearError,
  updateUser,
  initializeAuth,
  authExpired,
  setUser,
  clearUser,
  resetPasswordState,
  setPasswordResetStep,
  setPasswordResetEmail,
  setLoginFormEmail,
  resetSignupOtpState
} = authSlice.actions;

export default authSlice.reducer;