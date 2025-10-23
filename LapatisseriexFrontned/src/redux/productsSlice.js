import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import axiosInstance from '../utils/axiosConfig';
import { withRetry } from '../utils/retry';

const API_URL = import.meta.env.VITE_API_URL;

// Async thunk for fetching products
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add all params to query string
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const url = `${API_URL}/products${queryString ? `?${queryString}` : ''}`;
    const response = await withRetry(() => axiosInstance.get(url), { retries: 2, delay: 250 });
    
    return response.data;
  }
);

// Async thunk for fetching a single product
export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (productId) => {
    const response = await axiosInstance.get(`${API_URL}/products/${productId}`);
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
        state.listsByKey['bestSellers'] = action.payload?.products || [];
        // Store the hasBestSellers flag for conditional rendering
        state.hasBestSellers = action.payload?.meta?.hasBestSellers || false;
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