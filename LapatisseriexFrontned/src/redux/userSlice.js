import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Initial state
const initialState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  isNewUser: false,
  authType: 'login', // login, signup, otp, profile
  tempPhoneNumber: '',
  confirmationResult: null,
  isAuthPanelOpen: false,
  profileUpdateLoading: false,
  profileUpdateError: null,
};

// Async thunks
export const verifyToken = createAsyncThunk(
  'user/verifyToken',
  async (idToken, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/verify`, { idToken });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Token verification failed');
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  'user/fetchUserProfile',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { user: { token } } = getState();
      const response = await axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user profile');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateUserProfile',
  async (profileData, { getState, rejectWithValue }) => {
    try {
      const { user: { user, token } } = getState();
      const response = await axios.put(
        `${API_URL}/users/${user.uid}`,
        profileData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const uploadProfileImage = createAsyncThunk(
  'user/uploadProfileImage',
  async (formData, { getState, rejectWithValue }) => {
    try {
      const { user: { token } } = getState();
      const response = await axios.post(
        `${API_URL}/upload/profile-photo`,
        formData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload profile image');
    }
  }
);

export const deleteProfileImage = createAsyncThunk(
  'user/deleteProfileImage',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { user: { token } } = getState();
      const response = await axios.delete(`${API_URL}/upload/profile-photo`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete profile image');
    }
  }
);

// User slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      // Update localStorage
      if (action.payload) {
        localStorage.setItem('cachedUser', JSON.stringify(action.payload));
      } else {
        localStorage.removeItem('cachedUser');
      }
    },
    setToken: (state, action) => {
      state.token = action.payload;
      // Update localStorage
      if (action.payload) {
        localStorage.setItem('authToken', action.payload);
      } else {
        localStorage.removeItem('authToken');
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setAuthType: (state, action) => {
      state.authType = action.payload;
    },
    setTempPhoneNumber: (state, action) => {
      state.tempPhoneNumber = action.payload;
    },
    setConfirmationResult: (state, action) => {
      state.confirmationResult = action.payload;
    },
    setIsAuthPanelOpen: (state, action) => {
      state.isAuthPanelOpen = action.payload;
    },
    setIsNewUser: (state, action) => {
      state.isNewUser = action.payload;
    },
    clearError: (state) => {
      state.error = null;
      state.profileUpdateError = null;
    },
    logout: (state) => {
      // Save important user data before logout
      const savedData = {};
      if (state.user) {
        savedData.email = state.user.email;
        savedData.name = state.user.name;
        savedData.anniversary = state.user.anniversary;
        savedData.location = typeof state.user.location === 'object' 
          ? state.user.location._id 
          : state.user.location;
        savedData.hostel = typeof state.user.hostel === 'object' 
          ? state.user.hostel._id 
          : state.user.hostel;
      }
      
      // Clear state
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.isNewUser = false;
      state.authType = 'login';
      state.tempPhoneNumber = '';
      state.confirmationResult = null;
      state.isAuthPanelOpen = false;
      state.profileUpdateLoading = false;
      state.profileUpdateError = null;
      
      // Clear localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('cachedUser');
      localStorage.removeItem('profileFormData');
      
      // Save important data for next login
      if (Object.keys(savedData).length > 0) {
        localStorage.setItem('savedUserData', JSON.stringify(savedData));
      }
    },
    updateUserField: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('cachedUser', JSON.stringify(state.user));
      }
    },
    initializeFromStorage: (state) => {
      // Initialize from localStorage
      const token = localStorage.getItem('authToken');
      const cachedUser = localStorage.getItem('cachedUser');
      
      if (token) {
        state.token = token;
      }
      
      if (cachedUser) {
        try {
          state.user = JSON.parse(cachedUser);
          state.isAuthenticated = true;
        } catch (error) {
          console.error('Error parsing cached user:', error);
          localStorage.removeItem('cachedUser');
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Verify token
      .addCase(verifyToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyToken.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.isNewUser = action.payload.isNewUser || false;
        
        // Update localStorage
        localStorage.setItem('cachedUser', JSON.stringify(action.payload.user));
      })
      .addCase(verifyToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      
      // Fetch user profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        
        // Update localStorage
        localStorage.setItem('cachedUser', JSON.stringify(action.payload));
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update user profile
      .addCase(updateUserProfile.pending, (state) => {
        state.profileUpdateLoading = true;
        state.profileUpdateError = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.profileUpdateLoading = false;
        
        // Check if this is an admin update
        if (!action.payload.isAdminUpdate) {
          state.user = { ...state.user, ...action.payload.user };
          localStorage.setItem('cachedUser', JSON.stringify(state.user));
        }
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.profileUpdateLoading = false;
        state.profileUpdateError = action.payload;
      })
      
      // Upload profile image
      .addCase(uploadProfileImage.pending, (state) => {
        state.profileUpdateLoading = true;
        state.profileUpdateError = null;
      })
      .addCase(uploadProfileImage.fulfilled, (state, action) => {
        state.profileUpdateLoading = false;
        if (state.user && action.payload.user) {
          state.user = { ...state.user, ...action.payload.user };
          localStorage.setItem('cachedUser', JSON.stringify(state.user));
        }
      })
      .addCase(uploadProfileImage.rejected, (state, action) => {
        state.profileUpdateLoading = false;
        state.profileUpdateError = action.payload;
      })
      
      // Delete profile image
      .addCase(deleteProfileImage.pending, (state) => {
        state.profileUpdateLoading = true;
        state.profileUpdateError = null;
      })
      .addCase(deleteProfileImage.fulfilled, (state, action) => {
        state.profileUpdateLoading = false;
        if (state.user && action.payload.user) {
          state.user = { ...state.user, ...action.payload.user };
          localStorage.setItem('cachedUser', JSON.stringify(state.user));
        }
      })
      .addCase(deleteProfileImage.rejected, (state, action) => {
        state.profileUpdateLoading = false;
        state.profileUpdateError = action.payload;
      });
  },
});

export const {
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
} = userSlice.actions;

export default userSlice.reducer;