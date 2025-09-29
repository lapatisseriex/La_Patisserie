// Cache management utilities for better product loading performance
export const CacheManager = {
  // Clear all product-related cache
  clearProductCache: () => {
    if (typeof window !== 'undefined') {
      // Clear localStorage cache if any
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('product_') || key.startsWith('products_')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear sessionStorage cache if any
      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach(key => {
        if (key.startsWith('product_') || key.startsWith('products_')) {
          sessionStorage.removeItem(key);
        }
      });
      
      console.log('🧹 Product cache cleared');
    }
  },

  // Clear specific product from cache
  clearSpecificProduct: (productId) => {
    if (typeof window !== 'undefined' && productId) {
      localStorage.removeItem(`product_${productId}`);
      sessionStorage.removeItem(`product_${productId}`);
      console.log(`🧹 Cleared cache for product: ${productId}`);
    }
  },

  // Check if we have network connectivity
  isOnline: () => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  },

  // Get cache timestamp for debugging
  getCacheAge: (cacheData) => {
    if (!cacheData || !cacheData.timestamp) return 'Unknown';
    const now = Date.now();
    const age = Math.floor((now - cacheData.timestamp) / 1000);
    
    if (age < 60) return `${age}s ago`;
    if (age < 3600) return `${Math.floor(age / 60)}m ago`;
    return `${Math.floor(age / 3600)}h ago`;
  },

  // Validate product data structure
  isValidProductData: (product) => {
    if (!product || typeof product !== 'object') {
      console.warn('Invalid product data: not an object');
      return false;
    }
    
    if (!product._id) {
      console.warn('Invalid product data: missing _id');
      return false;
    }
    
    if (!product.name) {
      console.warn('Invalid product data: missing name');
      return false;
    }
    
    if (!product.variants || !Array.isArray(product.variants) || product.variants.length === 0) {
      console.warn('Invalid product data: missing or invalid variants');
      return false;
    }
    
    return true;
  },

  // Generate cache key for consistency
  generateCacheKey: (prefix, ...args) => {
    return `${prefix}_${args.filter(arg => arg !== undefined && arg !== null).join('_')}`;
  },

  // Handle network errors gracefully
  handleNetworkError: (error) => {
    if (!navigator.onLine) {
      return 'No internet connection. Please check your network and try again.';
    }
    
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return 'Request timed out. The server might be busy. Please try again.';
    }
    
    if (error.response?.status === 404) {
      return 'Product not found.';
    }
    
    if (error.response?.status === 500) {
      return 'Server error. Please try again later.';
    }
    
    if (error.response?.status >= 400 && error.response?.status < 500) {
      return 'Bad request. Please refresh the page and try again.';
    }
    
    return 'Network error. Please check your connection and try again.';
  }
};

export default CacheManager;