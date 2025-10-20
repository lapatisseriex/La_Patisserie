import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import cartService from '../services/cartService';
import { calculateCartTotals } from '../utils/pricingUtils';

// Async thunks for cart operations
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cartService.getCart();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ product, quantity = 1, variantIndex }, { rejectWithValue, getState }) => {
    try {
      // Optimistic update data
      const optimisticItem = {
        id: `temp_${Date.now()}`,
        productId: product._id,
        name: product.name,
        // Prefer variant price if provided
        price: (Number.isInteger(variantIndex) && product.variants?.[variantIndex]?.price)
          ? product.variants[variantIndex].price
          : product.price,
        image: product.images?.[0] || product.image,
        quantity,
        addedAt: new Date().toISOString(),
        productDetails: { ...product, variantIndex },
        isOptimistic: true
      };

      // Return optimistic data immediately
      const response = await cartService.addToCart(product._id, quantity, variantIndex);

      // Backend returns the full cart (items array), not a single item. Derive the added/updated item.
      const derivedItem = response?.item
        || response?.items?.find((i) => i.productId === product._id);

      // Return normalized payload that reducers can handle flexibly
      return {
        item: derivedItem,
        items: response.items,
        cartTotal: response.cartTotal,
        cartCount: response.cartCount,
        optimisticId: optimisticItem.id,
        productId: product._id
      };
    } catch (error) {
      return rejectWithValue({
        error: error.response?.data || error.message,
        productId: product._id
      });
    }
  }
);

export const updateCartQuantity = createAsyncThunk(
  'cart/updateQuantity',
  async ({ productId, quantity }, { rejectWithValue, getState }) => {
    try {
      // Allow latest intent to persist to backend; avoid suppressing updates

      if (quantity === 0) {
        const response = await cartService.removeFromCart(productId);
        return { productId, quantity: 0, isRemoved: true, ...response };
      } else {
        const response = await cartService.updateQuantity(productId, quantity);
        return { productId, quantity, ...response };
      }
    } catch (error) {
      // Handle item not found errors gracefully
      if (error.message?.includes('not found') || error.response?.status === 404) {
        return { productId, quantity: 0, isRemoved: true, cartTotal: 0, cartCount: 0 };
      }
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (productId, { rejectWithValue, getState }) => {
    try {
      const response = await cartService.removeFromCart(productId);
      return { productId, ...response };
    } catch (error) {
      // If item not found, it might already be removed - just sync the state
      if (error.message?.includes('not found') || error.response?.status === 404) {
        return { productId, cartTotal: 0, cartCount: 0, items: [] };
      }
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (options, { rejectWithValue }) => {
    try {
      const response = await cartService.clearCart(options);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const syncLocalCart = createAsyncThunk(
  'cart/syncLocalCart',
  async (localItems, { rejectWithValue }) => {
    try {
      const response = await cartService.mergeGuestCart(localItems);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// New: Merge guest cart with user cart
export const mergeGuestCart = createAsyncThunk(
  'cart/mergeGuestCart',
  async (guestCartItems, { rejectWithValue }) => {
    try {
      console.log('🔄 Redux: Merging guest cart items:', guestCartItems);
      const response = await cartService.mergeGuestCart(guestCartItems);
      return response;
    } catch (error) {
      console.error('❌ Redux: Error merging guest cart:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  items: [],
  cartTotal: 0,
  cartCount: 0,
  isLoading: false,
  isOptimisticLoading: false,
  dbCartLoaded: false,
  error: null,
  lastUpdated: null,
  pendingOperations: {}, // Track pending async operations
  cache: {
    data: null,
    timestamp: null,
    etag: null
  }
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Optimistic updates for immediate UI feedback
    addToCartOptimistic: (state, action) => {
      const { product, quantity = 1, variantIndex } = action.payload;
      const existingItemIndex = state.items.findIndex(item => item.productId === product._id);
      const optimisticPrice = (Number.isInteger(variantIndex) && product.variants?.[variantIndex]?.price)
        ? product.variants[variantIndex].price
        : product.price;
      
      if (existingItemIndex >= 0) {
        // Update existing item
        state.items[existingItemIndex].quantity += quantity;
        state.items[existingItemIndex].isOptimistic = true;
      } else {
        // Add new item
        const optimisticItem = {
          id: `temp_${Date.now()}`,
          productId: product._id,
          name: product.name,
          price: optimisticPrice,
          image: product.images?.[0] || product.image,
          quantity,
          addedAt: new Date().toISOString(),
          productDetails: { ...product, variantIndex },
          isOptimistic: true
        };
        state.items.push(optimisticItem);
      }
      
      // Recalculate totals using centralized utility for consistency
      const totals = calculateCartTotals(state.items);
      state.cartCount = totals.cartCount;
      state.cartTotal = totals.cartTotal;
      
      state.isOptimisticLoading = true;
    },

    updateQuantityOptimistic: (state, action) => {
      const { productId, quantity } = action.payload;
      const itemIndex = state.items.findIndex(item => item.productId === productId);
      
      if (itemIndex >= 0) {
        if (quantity === 0) {
          // Remove item
          state.items.splice(itemIndex, 1);
        } else {
          // Update quantity
          state.items[itemIndex].quantity = quantity;
          state.items[itemIndex].isOptimistic = true;
        }
        
        // Recalculate totals using centralized utility for consistency
        const totals = calculateCartTotals(state.items);
        state.cartCount = totals.cartCount;
        state.cartTotal = totals.cartTotal;
      }
      state.isOptimisticLoading = true;
    },

    removeFromCartOptimistic: (state, action) => {
      const productId = action.payload;
      const itemIndex = state.items.findIndex(item => item.productId === productId);
      
      if (itemIndex >= 0) {
        state.items.splice(itemIndex, 1);
        
        // Recalculate totals using centralized utility for consistency
        const totals = calculateCartTotals(state.items);
        state.cartCount = totals.cartCount;
        state.cartTotal = totals.cartTotal;
      }
      state.isOptimisticLoading = true;
    },

    clearError: (state) => {
      state.error = null;
    },

    // Cache management
    setCacheData: (state, action) => {
      state.cache = action.payload;
    },

    loadFromCache: (state, action) => {
      const { items, cartTotal, cartCount } = action.payload;
      state.items = items;
      state.cartTotal = cartTotal;
      state.cartCount = cartCount;
      state.dbCartLoaded = true;
    },

    // Local storage sync
    loadFromLocalStorage: (state, action) => {
      const localItems = action.payload;
      state.items = localItems;
      
      // Use centralized cart totals calculation for consistency
      const totals = calculateCartTotals(localItems);
      state.cartCount = totals.cartCount;
      state.cartTotal = totals.cartTotal;
    },

    clearLocalOptimisticUpdates: (state) => {
      state.isOptimisticLoading = false;
      // Remove optimistic flags from items
      state.items.forEach(item => {
        delete item.isOptimistic;
      });
    },

    // Error handling for optimistic updates
    revertOptimisticUpdate: (state, action) => {
      const { productId, originalState } = action.payload;
      
      if (originalState) {
        // Revert to previous state
        state.items = originalState.items;
        state.cartTotal = originalState.cartTotal;
        state.cartCount = originalState.cartCount;
      }
      
      state.isOptimisticLoading = false;
    },

    // 🛠️ FIX: Reset cart state when user logs out to prevent conflicts
    resetCartState: (state) => {
      state.items = [];
      state.cartTotal = 0;
      state.cartCount = 0;
      state.dbCartLoaded = false;
      state.isOptimisticLoading = false;
      state.error = null;
      state.pendingOperations = {};
      state.cache = {
        data: null,
        timestamp: null,
        etag: null
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Cart
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dbCartLoaded = true;
        state.error = null;
        state.lastUpdated = Date.now();
        
        const { items, cartTotal, cartCount } = action.payload;
        
        // Convert database format to Redux format
        state.items = items.map(item => ({
          id: item._id,
          productId: item.productId,
          name: item.productDetails.name,
          price: item.productDetails.price,
          image: item.productDetails.image,
          quantity: item.quantity,
          addedAt: item.addedAt,
          productDetails: item.productDetails
        }));
        
        state.cartTotal = cartTotal;
        state.cartCount = cartCount;
        
        // Cache the data
        const cacheData = {
          data: { items: state.items, cartTotal, cartCount },
          timestamp: Date.now(),
          etag: action.meta?.response?.headers?.etag
        };
        state.cache = cacheData;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Add to Cart
      .addCase(addToCart.pending, (state, action) => {
        const { product, quantity } = action.meta.arg;
        state.pendingOperations[product._id] = {
          type: 'adding',
          requestId: action.meta.requestId
        };
        
        // Apply optimistic update if not already applied
        if (!state.isOptimisticLoading) {
          cartSlice.caseReducers.addToCartOptimistic(state, { payload: { product, quantity } });
        }
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        const { item, items, cartTotal, cartCount, optimisticId, productId } = action.payload;
        const requestId = action.meta.requestId;

        const pid = item?.productId || productId;
        if (pid) {
          const pending = state.pendingOperations[pid];
          if (pending?.requestId && pending.requestId !== requestId) {
            return;
          }
          delete state.pendingOperations[pid];
        }

        // Remove optimistic placeholder if present
        if (optimisticId) {
          const optimisticIndex = state.items.findIndex(i => i.id === optimisticId);
          if (optimisticIndex >= 0) {
            state.items.splice(optimisticIndex, 1);
          }
        }

        // If server returned full cart but not a single item, replace state from server payload
        if (!item && Array.isArray(items)) {
          state.items = items.map(srvItem => ({
            id: srvItem._id,
            productId: srvItem.productId,
            name: srvItem.productDetails.name,
            price: srvItem.productDetails.price,
            image: srvItem.productDetails.image,
            quantity: srvItem.quantity,
            addedAt: srvItem.addedAt,
            productDetails: srvItem.productDetails
          }));
          state.cartTotal = cartTotal;
          state.cartCount = cartCount;
          state.isOptimisticLoading = false;
          state.lastUpdated = Date.now();
          return;
        }

        // Otherwise, merge/update the single returned item
        if (item) {
          const existingIndex = state.items.findIndex(i => i.productId === item.productId);
          const realItem = {
            id: item._id,
            productId: item.productId,
            name: item.productDetails.name,
            price: item.productDetails.price,
            image: item.productDetails.image,
            quantity: item.quantity,
            addedAt: item.addedAt,
            productDetails: item.productDetails
          };

          if (existingIndex >= 0) {
            state.items[existingIndex] = realItem;
          } else {
            state.items.push(realItem);
          }
        }

        // Update totals with server values
        state.cartTotal = isNaN(cartTotal) ? 0 : cartTotal;
        state.cartCount = isNaN(cartCount) ? 0 : cartCount;
        state.isOptimisticLoading = false;
        state.lastUpdated = Date.now();
      })
      .addCase(addToCart.rejected, (state, action) => {
        const productId = action.payload?.productId || action.meta.arg?.product?._id;
        if (productId) {
          const pending = state.pendingOperations[productId];
          if (pending?.requestId && pending.requestId !== action.meta.requestId) {
            return;
          }
          delete state.pendingOperations[productId];
        }

        state.isOptimisticLoading = false;
        state.error = action.payload?.error || action.error?.message;
        
        // Remove optimistic item if it exists
        const optimisticIndex = productId
          ? state.items.findIndex(i => i.productId === productId && i.isOptimistic)
          : -1;
        if (optimisticIndex >= 0) {
          const item = state.items[optimisticIndex];
          const itemPrice = parseFloat(item.productDetails?.price || item.price) || 0;
          state.cartTotal -= (itemPrice * item.quantity);
          state.cartCount -= item.quantity;
          state.items.splice(optimisticIndex, 1);
        }
      })

      // Update Quantity
      .addCase(updateCartQuantity.pending, (state, action) => {
        const { productId, quantity } = action.meta.arg;
        state.pendingOperations[productId] = {
          type: 'updating',
          requestId: action.meta.requestId,
          targetQuantity: quantity
        };
      })
      .addCase(updateCartQuantity.fulfilled, (state, action) => {
        const payloadProductId = action.payload?.productId;
        const targetProductId = payloadProductId ?? action.meta.arg.productId;
  const { quantity, cartTotal, cartCount, isRemoved } = action.payload ?? {};
        const requestId = action.meta.requestId;
        const pending = state.pendingOperations[targetProductId];
        if (pending?.requestId && pending.requestId !== requestId) {
          return;
        }
        
        delete state.pendingOperations[targetProductId];
        
        if (quantity === 0 || isRemoved) {
          // Remove item
          const itemIndex = state.items.findIndex(item => item.productId === targetProductId);
          if (itemIndex >= 0) {
            state.items.splice(itemIndex, 1);
          }
        } else {
          // Update quantity
          const itemIndex = state.items.findIndex(item => item.productId === targetProductId);
          if (itemIndex >= 0) {
            state.items[itemIndex].quantity = quantity;
            delete state.items[itemIndex].isOptimistic;
          }
        }
        
        state.cartTotal = isNaN(cartTotal) ? 0 : (cartTotal || 0);
        state.cartCount = isNaN(cartCount) ? 0 : (cartCount || 0);
        state.isOptimisticLoading = false;
        state.lastUpdated = Date.now();
      })
      .addCase(updateCartQuantity.rejected, (state, action) => {
        const payloadProductId = action.payload?.productId;
        const targetProductId = payloadProductId ?? action.meta.arg.productId;
        const pending = state.pendingOperations[targetProductId];
        if (pending?.requestId && pending.requestId !== action.meta.requestId) {
          return;
        }
        delete state.pendingOperations[targetProductId];
        // Suppress noisy duplicate-operation errors
        if (action.payload !== 'Operation already in progress') {
          state.error = action.payload;
        }
        state.isOptimisticLoading = false;
      })

      // Remove from Cart
      .addCase(removeFromCart.pending, (state, action) => {
        const productId = action.meta.arg;
        state.pendingOperations[productId] = {
          type: 'removing',
          requestId: action.meta.requestId
        };
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        const { productId, cartTotal, cartCount } = action.payload;
        const requestId = action.meta.requestId;
        const pending = state.pendingOperations[productId];
        if (pending?.requestId && pending.requestId !== requestId) {
          return;
        }
        
        delete state.pendingOperations[productId];
        
        const itemIndex = state.items.findIndex(item => item.productId === productId);
        if (itemIndex >= 0) {
          state.items.splice(itemIndex, 1);
        }
        
        state.cartTotal = isNaN(cartTotal) ? 0 : cartTotal;
        state.cartCount = isNaN(cartCount) ? 0 : cartCount;
        state.lastUpdated = Date.now();
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        const productId = action.meta.arg;
        const pending = state.pendingOperations[productId];
        if (pending?.requestId && pending.requestId !== action.meta.requestId) {
          return;
        }
        delete state.pendingOperations[productId];
        state.error = action.payload;
      })

      // Clear Cart
      .addCase(clearCart.fulfilled, (state) => {
        state.items = [];
        state.cartTotal = 0;
        state.cartCount = 0;
        state.lastUpdated = Date.now();
      })

      // Sync Local Cart
      .addCase(syncLocalCart.fulfilled, (state, action) => {
        const { items, cartTotal, cartCount } = action.payload;
        
        state.items = items.map(item => ({
          id: item._id,
          productId: item.productId,
          name: item.productDetails.name,
          price: item.productDetails.price,
          image: item.productDetails.image,
          quantity: item.quantity,
          addedAt: item.addedAt,
          productDetails: item.productDetails
        }));
        
        state.cartTotal = cartTotal;
        state.cartCount = cartCount;
        state.dbCartLoaded = true;
        state.lastUpdated = Date.now();
      });
  }
});

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => state.cart.cartTotal;
export const selectCartCount = (state) => state.cart.cartCount;
export const selectCartLoading = (state) => state.cart.isLoading;
export const selectCartError = (state) => state.cart.error;
export const selectIsOptimisticLoading = (state) => state.cart.isOptimisticLoading;
export const selectDbCartLoaded = (state) => state.cart.dbCartLoaded;
export const selectPendingOperations = (state) => state.cart.pendingOperations;

// Helper selectors
export const selectItemQuantity = (state, productId) => {
  const item = state.cart.items.find(item => item.productId === productId);
  return item ? item.quantity : 0;
};

export const selectIsItemInCart = (state, productId) => {
  return state.cart.items.some(item => item.productId === productId);
};

export const selectCartItemByProductId = (state, productId) => {
  return state.cart.items.find(item => item.productId === productId);
};

export const {
  addToCartOptimistic,
  updateQuantityOptimistic,
  removeFromCartOptimistic,
  clearError,
  setCacheData,
  loadFromCache,
  loadFromLocalStorage,
  clearLocalOptimisticUpdates,
  revertOptimisticUpdate,
  resetCartState
} = cartSlice.actions;

export default cartSlice.reducer;