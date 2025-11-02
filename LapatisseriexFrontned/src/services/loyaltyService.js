import api from './apiService';

/**
 * Get loyalty program status for current user
 * @returns {Promise<Object>} Loyalty status data
 */
export const getLoyaltyStatus = async () => {
  try {
    const response = await api.get('/loyalty/status');
    return response.data;
  } catch (error) {
    console.error('Error fetching loyalty status:', error);
    throw error;
  }
};

/**
 * Get available products for free selection
 * @returns {Promise<Object>} Available products data
 */
export const getAvailableFreeProducts = async () => {
  try {
    const response = await api.get('/loyalty/free-products');
    return response.data;
  } catch (error) {
    console.error('Error fetching free products:', error);
    throw error;
  }
};

/**
 * Validate free product selection
 * @param {string} productId - Product ID to validate
 * @param {number} variantIndex - Variant index (optional)
 * @returns {Promise<Object>} Validation result
 */
export const validateFreeProduct = async (productId, variantIndex = 0) => {
  try {
    const response = await api.post('/loyalty/validate-free-product', {
      productId,
      variantIndex
    });
    return response.data;
  } catch (error) {
    console.error('Error validating free product:', error);
    throw error;
  }
};

/**
 * Get loyalty history
 * @returns {Promise<Object>} Loyalty history data
 */
export const getLoyaltyHistory = async () => {
  try {
    const response = await api.get('/loyalty/history');
    return response.data;
  } catch (error) {
    console.error('Error fetching loyalty history:', error);
    throw error;
  }
};

/**
 * Add free product to cart
 * @param {string} productId - Product ID
 * @param {number} variantIndex - Variant index (optional)
 * @returns {Promise<Object>} Updated cart data
 */
export const addFreeProductToCart = async (productId, variantIndex = 0) => {
  try {
    const response = await api.post('/newcart/free-product', {
      productId,
      variantIndex
    });
    return response.data;
  } catch (error) {
    console.error('Error adding free product to cart:', error);
    throw error;
  }
};

/**
 * Remove free product from cart
 * @returns {Promise<Object>} Updated cart data
 */
export const removeFreeProductFromCart = async () => {
  try {
    const response = await api.delete('/newcart/free-product');
    return response.data;
  } catch (error) {
    console.error('Error removing free product from cart:', error);
    throw error;
  }
};
