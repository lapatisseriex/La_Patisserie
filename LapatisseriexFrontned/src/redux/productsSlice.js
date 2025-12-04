import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import axiosInstance from '../utils/axiosConfig';
import { withRetry } from '../utils/retry';

const API_URL = import.meta.env.VITE_API_URL;

// Async thunk for fetching products
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params = {}) => {
    // Helper: try to get a Firebase ID token, waiting briefly for auth hydration if needed
    const tryGetIdToken = async () => {
      try {
        const { getAuth, onAuthStateChanged } = await import('firebase/auth');
        const auth = getAuth();
        const immediate = auth?.currentUser;
        console.log('🔭 [fetchProducts] auth.currentUser (immediate):', immediate);
        if (immediate) {
          return await immediate.getIdToken(true);
        }
        // Wait up to ~1.5s for first auth state
        const token = await new Promise((resolve) => {
          let settled = false;
          const unsub = onAuthStateChanged(auth, async (user) => {
            if (settled) return;
            settled = true;
            try {
              unsub && unsub();
            } catch {}
            if (user) {
              const t = await user.getIdToken(true);
              resolve(t);
            } else {
              resolve(undefined);
            }
          });
          setTimeout(() => {
            if (settled) return;
            settled = true;
            try { unsub && unsub(); } catch {}
            console.warn('⏳ [fetchProducts] Auth hydration timeout — proceeding without token');
            resolve(undefined);
          }, 1500);
        });
        return token;
      } catch (e) {
        console.warn('⚠️ [fetchProducts] Failed to get token:', e?.message || e);
        return undefined;
      }
    };

    const queryParams = new URLSearchParams();
    
    // Add all params to query string
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const url = `${API_URL}/products${queryString ? `?${queryString}` : ''}`;
    console.log('🧪 [fetchProducts] params:', params, '| url:', url);

    // Attempt to include auth token so backend can determine user role (admin/user)
    const idToken = await tryGetIdToken();
    const headers = idToken ? { Authorization: `Bearer ${idToken}` } : undefined;
    if (idToken) console.log('🔑 [fetchProducts] Attached Authorization header');

    const response = await withRetry(() => axiosInstance.get(url, { headers }), { retries: 2, delay: 250 });
    console.log('📦 [fetchProducts] Received products payload keys:', Object.keys(response?.data || {}));
    
    return response.data;
  }
);

// Async thunk for fetching a single product
export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (productId) => {
    console.log('🧪 [fetchProductById] productId:', productId);
    // Include token if available so admins can access admin-only products
    const tryGetIdToken = async () => {
      try {
        const { getAuth, onAuthStateChanged } = await import('firebase/auth');
        const auth = getAuth();
        const immediate = auth?.currentUser;
        console.log('� [fetchProductById] auth.currentUser (immediate):', !!immediate);
        if (immediate) return await immediate.getIdToken(true);
        const token = await new Promise((resolve) => {
          let settled = false;
          const unsub = onAuthStateChanged(auth, async (user) => {
            if (settled) return;
            settled = true;
            try { unsub && unsub(); } catch {}
            if (user) {
              const t = await user.getIdToken(true);
              resolve(t);
            } else {
              resolve(undefined);
            }
          });
          setTimeout(() => {
            if (settled) return;
            settled = true;
            try { unsub && unsub(); } catch {}
            console.warn('⏳ [fetchProductById] Auth hydration timeout — proceeding without token');
            resolve(undefined);
          }, 1500);
        });
        return token;
      } catch (e) {
        console.warn('⚠️ [fetchProductById] Failed to get token:', e?.message || e);
        return undefined;
      }
    };

    const idToken = await tryGetIdToken();
    const headers = idToken ? { Authorization: `Bearer ${idToken}` } : undefined;
    if (idToken) console.log('🔑 [fetchProductById] Attached Authorization header');
    const url = `${API_URL}/products/${productId}`;
    const response = await axiosInstance.get(url, { headers });
    console.log('📦 [fetchProductById] Response status:', response?.status, '| url:', url);
    return response.data;
  }
);

// Async thunk for fetching best sellers using the proper API endpoint
export const fetchBestSellers = createAsyncThunk(
  'products/fetchBestSellers',
  async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add all params to query string
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const url = `${API_URL}/products/bestsellers${queryString ? `?${queryString}` : ''}`;
    const response = await withRetry(() => axiosInstance.get(url), { retries: 2, delay: 250 });
    
    return response.data;
  }
);

const initialState = {
  products: [],
  productsByCategory: {},
  allProducts: [],
  selectedProduct: null,
  totalProducts: 0,
  pages: 1,
  loading: false,
  error: null,
  // Added: keyed lists & loading to avoid overwriting when multiple sections fetch concurrently
  listsByKey: {}, // key -> products[]
  loadingByKey: {}, // key -> boolean
  errorByKey: {}, // key -> string|null
  hasBestSellers: false, // Track if there are any best sellers
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setProducts: (state, action) => {
      state.products = action.payload;
    },
    setProductsByCategory: (state, action) => {
      state.productsByCategory = {
        ...state.productsByCategory,
        [action.payload.categoryId]: action.payload.products
      };
    },
    setAllProducts: (state, action) => {
      state.allProducts = action.payload;
    },
    removeProduct: (state, action) => {
      const productId = action.payload;
      
      // Remove from main products array
      state.products = state.products.filter(product => product._id !== productId);
      
      // Remove from all keyed lists
      Object.keys(state.listsByKey).forEach(key => {
        state.listsByKey[key] = state.listsByKey[key].filter(product => product._id !== productId);
      });
      
      // Remove from category-specific lists
      Object.keys(state.productsByCategory).forEach(categoryId => {
        state.productsByCategory[categoryId] = state.productsByCategory[categoryId].filter(
          product => product._id !== productId
        );
      });
      
      // Update counts
      if (state.totalProducts > 0) {
        state.totalProducts -= 1;
      }
    },
    clearProducts: (state) => {
      state.products = [];
      state.productsByCategory = {};
      state.allProducts = [];
      state.selectedProduct = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch products cases
      .addCase(fetchProducts.pending, (state, action) => {
        const key = action.meta?.arg?.key;
        if (key) {
          state.loadingByKey[key] = true;
          state.errorByKey[key] = null;
        } else {
          state.loading = true;
          state.error = null;
        }
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        const key = action.meta?.arg?.key;
        const list = action.payload?.products || [];
        if (key) {
          state.listsByKey[key] = list;
          state.loadingByKey[key] = false;
        } else {
          state.loading = false;
          state.products = list;
          state.totalProducts = action.payload.totalProducts || 0;
          state.pages = action.payload.pages || 1;
        }
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        const key = action.meta?.arg?.key;
        if (key) {
          state.loadingByKey[key] = false;
          state.errorByKey[key] = action.error.message;
        } else {
          state.loading = false;
          state.error = action.error.message;
        }
      })
      // Fetch best sellers cases
      .addCase(fetchBestSellers.pending, (state, action) => {
        state.loadingByKey['bestSellers'] = true;
        state.errorByKey['bestSellers'] = null;
      })
      .addCase(fetchBestSellers.fulfilled, (state, action) => {
        state.loadingByKey['bestSellers'] = false;
        const list = action.payload?.products || [];
        state.listsByKey['bestSellers'] = list;
        // Store the hasBestSellers flag for conditional rendering; fallback to list length
        const flagFromMeta = action.payload?.meta?.hasBestSellers;
        state.hasBestSellers = typeof flagFromMeta === 'boolean' ? flagFromMeta : list.length > 0;
      })
      .addCase(fetchBestSellers.rejected, (state, action) => {
        state.loadingByKey['bestSellers'] = false;
        state.errorByKey['bestSellers'] = action.error.message;
        state.hasBestSellers = false;
      })
      // Fetch single product cases
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export const { 
  setProducts, 
  setProductsByCategory, 
  setAllProducts, 
  removeProduct,
  clearProducts 
} = productsSlice.actions;

export default productsSlice.reducer;

// Memoized selectors
const selectProductsState = (state) => state.products;

export const makeSelectListByKey = (key) =>
  createSelector(
    [selectProductsState],
    (productsState) => productsState.listsByKey[key] || []
  );

export const makeSelectLoadingByKey = (key) =>
  createSelector(
    [selectProductsState],
    (productsState) => !!productsState.loadingByKey[key]
  );

export const selectProducts = createSelector(
  [selectProductsState],
  (productsState) => productsState.products
);

export const selectProductsLoading = createSelector(
  [selectProductsState],
  (productsState) => productsState.loading
);

export const selectHasBestSellers = createSelector(
  [selectProductsState],
  (productsState) => productsState.hasBestSellers
);

export const makeSelectTopRated = (limit = 3) =>
  createSelector([selectProducts], (list) => list
    .filter(p => p && typeof p.rating === 'number')
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, limit)
  );

export const makeSelectNewest = (limit = 3) =>
  createSelector([selectProducts], (list) => list
    .slice() // copy
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit)
  );