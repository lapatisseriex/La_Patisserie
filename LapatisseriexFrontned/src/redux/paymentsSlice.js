import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk for fetching user payments
export const fetchUserPayments = createAsyncThunk(
  'payments/fetchUserPayments',
  async ({ page = 1, limit = 20, status, method, startDate, endDate } = {}, { rejectWithValue }) => {
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('Authentication required');
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (status) params.append('status', status);
      if (method) params.append('method', method);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/payments/user/payments?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch payments');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for refreshing payments
export const refreshUserPayments = createAsyncThunk(
  'payments/refreshUserPayments',
  async (params, { dispatch }) => {
    return await dispatch(fetchUserPayments(params)).unwrap();
  }
);

const paymentsSlice = createSlice({
  name: 'payments',
  initialState: {
    payments: [],
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      pages: 0,
    },
    filters: {
      status: null,
      method: null,
      startDate: null,
      endDate: null,
    },
    lastFetch: null,
  },
  reducers: {
    clearPayments: (state) => {
      state.payments = [];
      state.error = null;
      state.pagination = {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0,
      };
    },
    clearPaymentsError: (state) => {
      state.error = null;
    },
    setPaymentsFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearPaymentsFilters: (state) => {
      state.filters = {
        status: null,
        method: null,
        startDate: null,
        endDate: null,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user payments
      .addCase(fetchUserPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.payments = action.payload.payments || [];
        state.pagination = action.payload.pagination || state.pagination;
        state.lastFetch = new Date().toISOString();
      })
      .addCase(fetchUserPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.payments = [];
      })
      // Refresh user payments
      .addCase(refreshUserPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(refreshUserPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.payments = action.payload.payments || [];
        state.pagination = action.payload.pagination || state.pagination;
        state.lastFetch = new Date().toISOString();
      })
      .addCase(refreshUserPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  clearPayments, 
  clearPaymentsError, 
  setPaymentsFilters, 
  clearPaymentsFilters 
} = paymentsSlice.actions;

// Selectors
export const selectPayments = (state) => state.payments.payments;
export const selectPaymentsLoading = (state) => state.payments.loading;
export const selectPaymentsError = (state) => state.payments.error;
export const selectPaymentsPagination = (state) => state.payments.pagination;
export const selectPaymentsFilters = (state) => state.payments.filters;
export const selectPaymentsLastFetch = (state) => state.payments.lastFetch;

export default paymentsSlice.reducer;