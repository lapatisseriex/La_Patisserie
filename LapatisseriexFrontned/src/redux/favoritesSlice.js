import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import favoriteService from '../services/favoriteService';

// Initial state
const initialState = {
  favorites: [],
  favoriteIds: [],
  count: 0,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  needsIntegrityCheck: false
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
      state.needsIntegrityCheck = false;
    },
    clearIntegrityFlag: (state) => {
      state.needsIntegrityCheck = false;
    }
  },
  extraReducers: (builder) => {
    // Utility inside builder scope
    const dedupeIds = (ids) => Array.from(new Set(ids.filter(Boolean)));
    const normalizeFavoritesArray = (favorites, favoriteIds) => {
      if (!Array.isArray(favorites) || favorites.length === 0) return favorites;
      const idSet = new Set(favoriteIds);
      return favorites.filter(item => idSet.has(item._id) || idSet.has(item.productId));
    };
    builder
      // Fetch favorites
      .addCase(fetchFavorites.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;

        const payload = action.payload;
        let list = [];
        // Accept several shapes: array, {data: []}, {items: []}
        if (Array.isArray(payload)) {
          list = payload;
        } else if (payload && Array.isArray(payload.data)) {
          list = payload.data;
        } else if (payload && Array.isArray(payload.items)) {
          list = payload.items;
        } else if (payload && typeof payload === 'object') {
          // Some services may return { success, data: [], count }
          if (Array.isArray(payload.results)) list = payload.results; // fallback alias
        }

        if (!Array.isArray(list)) list = [];

        state.favorites = list;
        state.favoriteIds = dedupeIds(list.map(p => p && (p._id || p.id || p.productId)).filter(Boolean));
        state.count = state.favoriteIds.length;

        localStorage.setItem('lapatisserie_favorites', JSON.stringify(state.favoriteIds));
        state.needsIntegrityCheck = false;
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
        state.favoriteIds = dedupeIds(state.favoriteIds);
      })
      .addCase(addToFavorites.fulfilled, (state, action) => {
        const { productId, response } = action.payload;
        
        // Backend now returns populated products in response.data (not productIds)
        if (response && response.data && Array.isArray(response.data)) {
          // Authoritative response: replace entire state with server data
          state.favorites = response.data;
          state.favoriteIds = dedupeIds(response.data.map(p => p._id || p.id || p.productId).filter(Boolean));
          state.count = response.count || state.favoriteIds.length;
          
          // Store in localStorage for consistency
          localStorage.setItem('lapatisserie_favorites', JSON.stringify(state.favoriteIds));
          state.needsIntegrityCheck = false; // We have fresh populated data
        } else {
          // Fallback: ensure productId is in our local state
          if (!state.favoriteIds.includes(productId)) {
            state.favoriteIds.push(productId);
            state.count = state.favoriteIds.length;
            state.favoriteIds = dedupeIds(state.favoriteIds);
            localStorage.setItem('lapatisserie_favorites', JSON.stringify(state.favoriteIds));
          }
          // No authoritative data; request integrity check
          state.needsIntegrityCheck = true;
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
        // Don't set loading status during optimistic updates to prevent UI flicker
        // state.status remains as is to maintain smooth UX
        const productId = action.meta.arg;
        if (productId) {
          state.favoriteIds = state.favoriteIds.filter(id => id !== productId);
          state.favorites = state.favorites.filter(item => (item._id || item.productId) !== productId);
          state.count = state.favoriteIds.length;
          // Update localStorage immediately for consistency
          localStorage.setItem('lapatisserie_favorites', JSON.stringify(state.favoriteIds));
        }
      })
      .addCase(removeFromFavorites.fulfilled, (state, action) => {
        const { productId, response } = action.payload;
        
        // Ensure we maintain 'succeeded' status after successful removal
        state.status = 'succeeded';
        state.error = null;
        
        // Backend now returns populated products in response.data (not productIds)
        if (response && response.data && Array.isArray(response.data)) {
          // Authoritative response: replace entire state with server data
          state.favorites = response.data;
          state.favoriteIds = dedupeIds(response.data.map(p => p._id || p.id || p.productId).filter(Boolean));
          state.count = response.count !== undefined ? response.count : state.favoriteIds.length;
          
          // Store in localStorage for consistency
          localStorage.setItem('lapatisserie_favorites', JSON.stringify(state.favoriteIds));
          state.needsIntegrityCheck = false; // We have fresh populated data
        } else {
          // Fallback: ensure productId is removed from local state
          state.favoriteIds = state.favoriteIds.filter(id => id !== productId);
          state.favorites = state.favorites.filter(item => (item._id || item.productId) !== productId);
          state.count = state.favoriteIds.length;
          localStorage.setItem('lapatisserie_favorites', JSON.stringify(state.favoriteIds));
        }
        
        // Ensure consistency when count reaches 0
        if (state.count === 0) {
          state.favorites = [];
          state.favoriteIds = [];
          state.needsIntegrityCheck = false;
        }
      })
      .addCase(removeFromFavorites.rejected, (state, action) => {
        // Handle error and rollback optimistic remove
        state.status = 'failed';
        state.error = action.payload || 'Failed to remove from favorites';
        
        const productId = action.meta?.arg;
        if (productId) {
          if (!state.favoriteIds.includes(productId)) {
            state.favoriteIds.push(productId);
            state.count = state.favoriteIds.length;
            // Update localStorage to reflect rollback
            localStorage.setItem('lapatisserie_favorites', JSON.stringify(state.favoriteIds));
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
  setFavoriteDetails,
  clearIntegrityFlag
} = favoritesSlice.actions;

export default favoritesSlice.reducer;