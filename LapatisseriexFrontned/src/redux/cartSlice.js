import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import cartService from '../services/cartService';

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
      // Check if operation is already pending
      const state = getState();
      if (state.cart.pendingOperations[productId]) {
        return rejectWithValue('Operation already in progress');
      }

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
      // Check if operation is already pending to prevent duplicates
      const state = getState();
      if (state.cart.pendingOperations[productId] === 'removing') {
        return rejectWithValue('Remove operation already in progress');
      }

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
  async (_, { rejectWithValue }) => {
    try {
      const response = await cartService.clearCart();
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
      const response = await cartService.mergeLocalCartWithDatabase?.(localItems) 
        || await cartService.getCart();
      return response;
    } catch (error) {
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
        // Update totals using the existing item's price
        state.cartCount += quantity;
        state.cartTotal += (state.items[existingItemIndex].price * quantity);
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
        // Update totals for new item
        state.cartCount += quantity;
        state.cartTotal += (optimisticPrice * quantity);
      }
      
      state.isOptimisticLoading = true;
    },

    updateQuantityOptimistic: (state, action) => {
      const { productId, quantity } = action.payload;
      const itemIndex = state.items.findIndex(item => item.productId === productId);
      
      if (itemIndex >= 0) {
        const oldQuantity = state.items[itemIndex].quantity;
        const priceDiff = (quantity - oldQuantity) * state.items[itemIndex].price;
        
        if (quantity === 0) {
          // Remove item
          state.cartTotal -= (state.items[itemIndex].price * oldQuantity);
          state.cartCount -= oldQuantity;
          state.items.splice(itemIndex, 1);
        } else {
          // Update quantity
          state.items[itemIndex].quantity = quantity;
          state.items[itemIndex].isOptimistic = true;
          state.cartTotal += priceDiff;
          state.cartCount += (quantity - oldQuantity);
        }
      }
      state.isOptimisticLoading = true;
    },

    removeFromCartOptimistic: (state, action) => {
      const productId = action.payload;
      const itemIndex = state.items.findIndex(item => item.productId === productId);
      
      if (itemIndex >= 0) {
        const item = state.items[itemIndex];
        state.cartTotal -= (item.price * item.quantity);
        state.cartCount -= item.quantity;
        state.items.splice(itemIndex, 1);
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
      state.cartCount = localItems.reduce((total, item) => total + item.quantity, 0);
      state.cartTotal = localItems.reduce((total, item) => total + (item.price * item.quantity), 0);
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
        // Set pending operation
        state.pendingOperations[product._id] = 'adding';
        
        // Apply optimistic update if not already applied
        if (!state.isOptimisticLoading) {
          cartSlice.caseReducers.addToCartOptimistic(state, { payload: { product, quantity } });
        }
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        const { item, items, cartTotal, cartCount, optimisticId, productId } = action.payload;

        // Remove pending operation (prefer item.productId if available, else fallback to provided productId)
        const pid = item?.productId || productId;
        if (pid) {
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
        state.cartTotal = cartTotal;
        state.cartCount = cartCount;
        state.isOptimisticLoading = false;
        state.lastUpdated = Date.now();
      })
      .addCase(addToCart.rejected, (state, action) => {
        const { productId } = action.payload;
        
        // Remove pending operation
        delete state.pendingOperations[productId];
        
        // Revert optimistic update
        state.isOptimisticLoading = false;
        state.error = action.payload.error;
        
        // Remove optimistic item if it exists
        const optimisticIndex = state.items.findIndex(i => i.productId === productId && i.isOptimistic);
        if (optimisticIndex >= 0) {
          const item = state.items[optimisticIndex];
          state.cartTotal -= (item.price * item.quantity);
          state.cartCount -= item.quantity;
          state.items.splice(optimisticIndex, 1);
        }
      })

      // Update Quantity
      .addCase(updateCartQuantity.pending, (state, action) => {
        const { productId } = action.meta.arg;
        state.pendingOperations[productId] = 'updating';
      })
      .addCase(updateCartQuantity.fulfilled, (state, action) => {
        const { productId, quantity, cartTotal, cartCount, isRemoved } = action.payload;
        
        delete state.pendingOperations[productId];
        
        if (quantity === 0 || isRemoved) {
          // Remove item
          const itemIndex = state.items.findIndex(item => item.productId === productId);
          if (itemIndex >= 0) {
            state.items.splice(itemIndex, 1);
          }
        } else {
          // Update quantity
          const itemIndex = state.items.findIndex(item => item.productId === productId);
          if (itemIndex >= 0) {
            state.items[itemIndex].quantity = quantity;
            delete state.items[itemIndex].isOptimistic;
          }
        }
        
        state.cartTotal = cartTotal || 0;
        state.cartCount = cartCount || 0;
        state.isOptimisticLoading = false;
        state.lastUpdated = Date.now();
      })
      .addCase(updateCartQuantity.rejected, (state, action) => {
        const { productId } = action.meta.arg;
        delete state.pendingOperations[productId];
        state.error = action.payload;
        state.isOptimisticLoading = false;
      })

      // Remove from Cart
      .addCase(removeFromCart.pending, (state, action) => {
        const productId = action.meta.arg;
        state.pendingOperations[productId] = 'removing';
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        const { productId, cartTotal, cartCount } = action.payload;
        
        delete state.pendingOperations[productId];
        
        const itemIndex = state.items.findIndex(item => item.productId === productId);
        if (itemIndex >= 0) {
          state.items.splice(itemIndex, 1);
        }
        
        state.cartTotal = cartTotal;
        state.cartCount = cartCount;
        state.lastUpdated = Date.now();
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        const productId = action.meta.arg;
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
  revertOptimisticUpdate
} = cartSlice.actions;

export default cartSlice.reducer;