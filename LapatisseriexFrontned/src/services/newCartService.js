import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

class NewCartService {
  // Get user's cart from database
  async getCart() {
    try {
      // Add ETag support for caching
      const eTag = localStorage.getItem('lapatisserie_cart_etag');
      
      const headers = {};
      if (eTag) {
        headers['If-None-Match'] = eTag;
      }
      
      const response = await api.get('/newcart', { headers });
      
      // Store the ETag for future requests
      const newETag = response.headers?.etag;
      if (newETag) {
        localStorage.setItem('lapatisserie_cart_etag', newETag);
      }
      
      console.log('📋 Cart fetched from server:', response.data);
      return response.data;
    } catch (error) {
      // If status is 304 Not Modified, return the cached response
      if (error.response?.status === 304) {
        console.log('⚡ Cart not modified, using cached version');
        const cachedCart = localStorage.getItem('lapatisserie_cart_cache');
        if (cachedCart) {
          return JSON.parse(cachedCart);
        }
      }
      
      console.error('❌ Error fetching cart:', error);
      if (error.response?.status === 401) {
        throw new Error('Please login to access your cart');
      }
      throw new Error(error.response?.data?.error || 'Failed to fetch cart');
    }
  }

  // Add item to cart
  async addToCart(productId, quantity = 1) {
    try {
      console.log(`🛒 Adding to cart: ${productId} x${quantity}`);
      const response = await api.post('/newcart', {
        productId,
        quantity
      });
      console.log('✅ Item added to cart:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      if (error.response?.status === 401) {
        throw new Error('Please login to add items to cart');
      }
      throw new Error(error.response?.data?.error || 'Failed to add item to cart');
    }
  }

  // Update cart item quantity
  async updateQuantity(productId, quantity) {
    try {
      console.log(`🔄 Updating quantity: ${productId} -> ${quantity}`);
      const response = await api.put(`/newcart/${productId}`, {
        quantity
      });
      console.log('✅ Quantity updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating quantity:', error);
      if (error.response?.status === 401) {
        throw new Error('Please login to update cart');
      }
      throw new Error(error.response?.data?.error || 'Failed to update quantity');
    }
  }

  // Remove item from cart
  async removeFromCart(productId) {
    try {
      console.log(`🗑️ Removing from cart: ${productId}`);
      const response = await api.delete(`/newcart/${productId}`);
      console.log('✅ Item removed from cart:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error removing from cart:', error);
      if (error.response?.status === 401) {
        throw new Error('Please login to remove items from cart');
      }
      throw new Error(error.response?.data?.error || 'Failed to remove item from cart');
    }
  }

  // Clear entire cart
  async clearCart() {
    try {
      console.log('🧹 Clearing cart');
      const response = await api.delete('/newcart');
      console.log('✅ Cart cleared:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error clearing cart:', error);
      if (error.response?.status === 401) {
        throw new Error('Please login to clear cart');
      }
      throw new Error(error.response?.data?.error || 'Failed to clear cart');
    }
  }

  // Get cart count
  async getCartCount() {
    try {
      const response = await api.get('/newcart/count');
      return response.data.count;
    } catch (error) {
      console.error('❌ Error getting cart count:', error);
      return 0;
    }
  }
}

const newCartService = new NewCartService();
export default newCartService;