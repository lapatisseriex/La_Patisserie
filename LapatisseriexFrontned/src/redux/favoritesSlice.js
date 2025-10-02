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
        
        // Handle different response structures
        const responseData = action.payload;
        
        if (responseData && responseData.items) {
          state.favorites = responseData.items;
          state.favoriteIds = responseData.items.map(item => item._id || item.productId || item.id);
          state.count = responseData.count || responseData.items.length;
        } else if (Array.isArray(responseData)) {
          state.favorites = responseData;
          state.favoriteIds = responseData.map(item => item._id || item.productId || item.id);
          state.count = responseData.length;
        } else {
          // Fallback for unexpected response structure
          state.favorites = [];
          state.favoriteIds = [];
          state.count = 0;
        }
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Add to favorites
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
      // Remove from favorites
      .addCase(removeFromFavorites.fulfilled, (state, action) => {
        const { productId, response } = action.payload;
        
        // Remove from favorites arrays
        state.favoriteIds = state.favoriteIds.filter(id => id !== productId);
        state.favorites = state.favorites.filter(item => item.productId !== productId);
        state.count = state.favoriteIds.length;
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