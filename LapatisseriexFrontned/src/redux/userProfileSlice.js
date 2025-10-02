import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/apiService';

// Async thunks for user profile actions
export const uploadProfilePhoto = createAsyncThunk(
  'userProfile/uploadProfilePhoto',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post('/upload/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        return response.data.profilePhoto;
      }
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteProfilePhoto = createAsyncThunk(
  'userProfile/deleteProfilePhoto',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const userId = auth.user?.uid;
      
      if (!userId) {
        return rejectWithValue('User not authenticated');
      }
      
      const response = await api.delete(`/upload/profile/${userId}`);
      
      if (response.data.success) {
        return null; // Profile photo deleted
      }
    } catch (error) {
      console.error('Error deleting profile photo:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateUserPreferences = createAsyncThunk(
  'userProfile/updatePreferences',
  async (preferences, { rejectWithValue }) => {
    try {
      // For now, we'll store preferences in localStorage
      // In the future, this can be extended to save to backend
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
      return preferences;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const loadUserPreferences = createAsyncThunk(
  'userProfile/loadPreferences',
  async (_, { rejectWithValue }) => {
    try {
      const stored = localStorage.getItem('userPreferences');
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (error) {
      console.error('Error loading user preferences:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Initial state
const initialState = {
  preferences: {
    theme: 'light',
    notifications: {
      email: true,
      push: true,
      sms: false,
      orderUpdates: true,
      promotions: true,
    },
    language: 'en',
    currency: 'INR',
  },
  recentlyViewed: [],
  addresses: [],
  orders: [],
  loading: {
    profilePhoto: false,
    preferences: false,
    addresses: false,
    orders: false,
  },
  error: null,
};

// User profile slice
const userProfileSlice = createSlice({
  name: 'userProfile',
  initialState,
  reducers: {
    addToRecentlyViewed: (state, action) => {
      const product = action.payload;
      // Remove if already exists
      state.recentlyViewed = state.recentlyViewed.filter(
        item => item.productId !== product.productId
      );
      // Add to beginning
      state.recentlyViewed.unshift({
        ...product,
        viewedAt: new Date().toISOString()
      });
      // Keep only last 20 items
      state.recentlyViewed = state.recentlyViewed.slice(0, 20);
    },
    
    clearRecentlyViewed: (state) => {
      state.recentlyViewed = [];
    },
    
    addAddress: (state, action) => {
      state.addresses.push({
        ...action.payload,
        id: Date.now(),
        createdAt: new Date().toISOString()
      });
    },
    
    updateAddress: (state, action) => {
      const { id, ...updates } = action.payload;
      const index = state.addresses.findIndex(addr => addr.id === id);
      if (index !== -1) {
        state.addresses[index] = { ...state.addresses[index], ...updates };
      }
    },
    
    deleteAddress: (state, action) => {
      state.addresses = state.addresses.filter(addr => addr.id !== action.payload);
    },
    
    setDefaultAddress: (state, action) => {
      const addressId = action.payload;
      state.addresses = state.addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId
      }));
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    resetUserProfile: (state) => {
      return {
        ...initialState,
        preferences: state.preferences, // Keep preferences
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload profile photo
      .addCase(uploadProfilePhoto.pending, (state) => {
        state.loading.profilePhoto = true;
        state.error = null;
      })
      .addCase(uploadProfilePhoto.fulfilled, (state, action) => {
        state.loading.profilePhoto = false;
        // Profile photo will be updated in auth slice
      })
      .addCase(uploadProfilePhoto.rejected, (state, action) => {
        state.loading.profilePhoto = false;
        state.error = action.payload;
      })
      
      // Delete profile photo
      .addCase(deleteProfilePhoto.pending, (state) => {
        state.loading.profilePhoto = true;
        state.error = null;
      })
      .addCase(deleteProfilePhoto.fulfilled, (state) => {
        state.loading.profilePhoto = false;
        // Profile photo will be updated in auth slice
      })
      .addCase(deleteProfilePhoto.rejected, (state, action) => {
        state.loading.profilePhoto = false;
        state.error = action.payload;
      })
      
      // Update preferences
      .addCase(updateUserPreferences.pending, (state) => {
        state.loading.preferences = true;
        state.error = null;
      })
      .addCase(updateUserPreferences.fulfilled, (state, action) => {
        state.loading.preferences = false;
        state.preferences = { ...state.preferences, ...action.payload };
      })
      .addCase(updateUserPreferences.rejected, (state, action) => {
        state.loading.preferences = false;
        state.error = action.payload;
      })
      
      // Load preferences
      .addCase(loadUserPreferences.fulfilled, (state, action) => {
        if (action.payload) {
          state.preferences = { ...state.preferences, ...action.payload };
        }
      });
  },
});

export const {
  addToRecentlyViewed,
  clearRecentlyViewed,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  clearError,
  resetUserProfile,
} = userProfileSlice.actions;

export default userProfileSlice.reducer;