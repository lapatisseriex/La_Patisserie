import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import favoriteService from '../services/favoriteService';

// Initial state
const initialState = {
  favorites: [],
  favoriteIds: [],
  count: 0,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null
};

// Async thunks
export const fetchFavorites = createAsyncThunk(
  'favorites/fetchFavorites',
  async (_, { rejectWithValue }) => {
    try {
      // Double-check token availability at Redux level before API call
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('fetchFavorites: No auth token available, skipping API call');
        return rejectWithValue('No authentication token available. Please log in.');
      }
      
      const response = await favoriteService.getFavorites();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addToFavorites = createAsyncThunk(
  'favorites/addToFavorites',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await favoriteService.addToFavorites(productId);
      return { productId, response };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const removeFromFavorites = createAsyncThunk(
  'favorites/removeFromFavorites',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await favoriteService.removeFromFavorites(productId);
      return { productId, response };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    // For local storage manipulation (guest users)
    localAddToFavorites: (state, action) => {
      const productId = action.payload;
      if (!state.favoriteIds.includes(productId)) {
        state.favoriteIds.push(productId);
        state.count = state.favoriteIds.length;
        // Store in localStorage
        localStorage.setItem('lapatisserie_favorites', JSON.stringify(state.favoriteIds));
      }
    },
    localRemoveFromFavorites: (state, action) => {
      const productId = action.payload;
      state.favoriteIds = state.favoriteIds.filter(id => id !== productId);
      state.count = state.favoriteIds.length;
      // Store in localStorage
      localStorage.setItem('lapatisserie_favorites', JSON.stringify(state.favoriteIds));
    },
    loadLocalFavorites: (state) => {
      try {
        const localFavorites = localStorage.getItem('lapatisserie_favorites');
        if (localFavorites) {
          state.favoriteIds = JSON.parse(localFavorites);
          state.count = state.favoriteIds.length;
        }
      } catch (error) {
        console.error('Error loading local favorites:', error);
      }
    },
    clearFavorites: (state) => {
      state.favorites = [];
      state.favoriteIds = [];
      state.count = 0;
      localStorage.removeItem('lapatisserie_favorites');
    },
    // For setting product details for favorites (guest mode)
    setFavoriteDetails: (state, action) => {
      state.favorites = action.payload;
      state.status = 'succeeded';
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch favorites
      .addCase(fetchFavorites.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;
        
        console.log('fetchFavorites.fulfilled payload:', action.payload);
        
        // Handle different response structures - now backend returns array of products directly
        const responseData = action.payload;
        
        if (Array.isArray(responseData)) {
          // New format: array of products directly
          state.favorites = responseData;
          state.favoriteIds = responseData.map(product => product._id);
          state.count = responseData.length;
        } else if (responseData && responseData.items) {
          // Legacy format: wrapped in items
          state.favorites = responseData.items;
          state.favoriteIds = responseData.items.map(item => item._id || item.productId || item.id);
          state.count = responseData.count || responseData.items.length;
        } else {
          // Fallback for unexpected response structure
          console.warn('Unexpected favorites response structure:', responseData);
          state.favorites = [];
          state.favoriteIds = [];
          state.count = 0;
        }
        
        // Save to localStorage for persistence
        localStorage.setItem('lapatisserie_favorites', JSON.stringify(state.favoriteIds));
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch favorites';
        console.error('fetchFavorites rejected:', action.payload, action.error);
      })
      // Add to favorites
      .addCase(addToFavorites.pending, (state, action) => {
        // Optimistic: immediately reflect the new favorite in UI
        const productId = action.meta.arg;
        if (productId && !state.favoriteIds.includes(productId)) {
          state.favoriteIds.push(productId);
          state.count = state.favoriteIds.length;
        }
      })
      .addCase(addToFavorites.fulfilled, (state, action) => {
        const { productId, response } = action.payload;
        
        // Update favorites list with full data from the response
        if (response && response.data && Array.isArray(response.data.productIds)) {
          state.favoriteIds = response.data.productIds.map(id => id.toString());
          state.count = state.favoriteIds.length;
          
          // If we already had this product in our favorites list, make sure it's still there
          if (!state.favoriteIds.includes(productId)) {
            state.favoriteIds.push(productId);
          }
          
          // Force a refetch to get full product details
          state.status = 'idle'; // This will trigger a refetch in the useEffect
        } else {
          // Fallback if response doesn't contain expected data
          if (!state.favoriteIds.includes(productId)) {
            state.favoriteIds.push(productId);
            state.count = state.favoriteIds.length;
          }
        }
      })
      .addCase(addToFavorites.rejected, (state, action) => {
        // Rollback optimistic add
        const productId = action.meta?.arg;
        if (productId) {
          state.favoriteIds = state.favoriteIds.filter(id => id !== productId);
          state.count = state.favoriteIds.length;
        }
      })
      // Remove from favorites
      .addCase(removeFromFavorites.pending, (state, action) => {
        // Optimistic: immediately remove from UI
        const productId = action.meta.arg;
        if (productId) {
          state.favoriteIds = state.favoriteIds.filter(id => id !== productId);
          state.favorites = state.favorites.filter(item => (item._id || item.productId) !== productId);
          state.count = state.favoriteIds.length;
        }
      })
      .addCase(removeFromFavorites.fulfilled, (state, action) => {
        const { productId } = action.payload;
        // Already optimistically removed in pending; ensure consistency (idempotent)
        state.favoriteIds = state.favoriteIds.filter(id => id !== productId);
        state.favorites = state.favorites.filter(item => (item._id || item.productId) !== productId);
        state.count = state.favoriteIds.length;
      })
      .addCase(removeFromFavorites.rejected, (state, action) => {
        // Rollback optimistic remove: if productId is not present, re-add it
        const productId = action.meta?.arg;
        if (productId) {
          if (!state.favoriteIds.includes(productId)) {
            state.favoriteIds.push(productId);
            state.count = state.favoriteIds.length;
          }
        }
      });
  }
});

// Export actions and reducer
export const { 
  localAddToFavorites, 
  localRemoveFromFavorites, 
  loadLocalFavorites, 
  clearFavorites,
  setFavoriteDetails
} = favoritesSlice.actions;

export default favoritesSlice.reducer;