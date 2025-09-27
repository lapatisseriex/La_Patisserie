// Cart API service functions
import api, { apiGet } from './apiService.js';

const cartService = {
  // Get user's cart
  getCart: async () => {
    try {
      const response = await apiGet('/cart');
      return response;
    } catch (error) {
      console.error('❌ Error getting cart in cartService:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  // Add item to cart
  addToCart: async (productId, quantity = 1, options = {}) => {
    try {
      const response = await api.post('/cart', {
        productId,
        quantity,
        options
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      throw error;
    }
  },

  // Update cart item quantity
  updateCartItem: async (itemId, quantity) => {
    try {
      console.log(`🔄 Updating cart item: PUT /cart/${itemId} with quantity:`, quantity);
      const response = await api.put(`/cart/${itemId}`, {
        quantity
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error updating cart item:', error);
      throw error;
    }
  },

  // Remove item from cart
  removeFromCart: async (itemId) => {
    try {
      console.log(`🗑️ Removing cart item: DELETE /cart/${itemId}`);
      const response = await api.delete(`/cart/${itemId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error removing from cart:', error);
      throw error;
    }
  },

  // Clear entire cart
  clearCart: async () => {
    try {
      const response = await api.post('/cart/clear');
      return response.data;
    } catch (error) {
      console.error('❌ Error clearing cart:', error);
      throw error;
    }
  },

  // Get cart count
  getCartCount: async () => {
    try {
      const response = await apiGet('/cart/count');
      return response.count || 0;
    } catch (error) {
      console.error('❌ Error getting cart count:', error);
      return 0;
    }
  }
};

export default cartService;