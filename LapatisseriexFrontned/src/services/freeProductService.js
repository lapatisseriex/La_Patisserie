import api from './apiService';

/**
 * Check user's eligibility for free product
 */
export const checkFreeProductEligibility = async () => {
  try {
    const response = await api.get('/free-product/check-eligibility');
    return response.data;
  } catch (error) {
    console.error('Error checking free product eligibility:', error);
    throw error;
  }
};

/**
 * Get progress towards free product eligibility
 */
export const getFreeProductProgress = async () => {
  try {
    const response = await api.get('/free-product/progress');
    return response.data;
  } catch (error) {
    console.error('Error getting free product progress:', error);
    throw error;
  }
};

/**
 * Select a free product
 */
export const selectFreeProduct = async (productId) => {
  try {
    const response = await api.post('/free-product/select', { productId });
    return response.data;
  } catch (error) {
    console.error('Error selecting free product:', error);
    throw error;
  }
};

/**
 * Add free product to cart
 */
export const addFreeProductToCart = async (productId, variantIndex = 0) => {
  try {
    const response = await api.post('/free-product/add-to-cart', { 
      productId, 
      variantIndex 
    });
    console.log('🎁 addFreeProductToCart response:', response.data);
    console.log('🎁 Cart items returned:', response.data?.data?.cart?.items);
    return response.data;
  } catch (error) {
    console.error('Error adding free product to cart:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error message:', error.response?.data?.message);
    throw error;
  }
};

/**
 * Remove free product from cart
 */
export const removeFreeProductFromCart = async () => {
  try {
    const response = await api.delete('/free-product/remove-from-cart');
    return response.data;
  } catch (error) {
    console.error('Error removing free product from cart:', error);
    throw error;
  }
};

export default {
  checkFreeProductEligibility,
  getFreeProductProgress,
  selectFreeProduct,
  addFreeProductToCart,
  removeFreeProductFromCart
};
