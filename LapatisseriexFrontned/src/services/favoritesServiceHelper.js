import api from './apiService';

class FavoritesServiceHelper {
  /**
   * Get full product details for a list of product IDs
   * Used to get complete product info for favorites in local storage
   */
  async getProductDetailsForFavorites(productIds) {
    if (!productIds || productIds.length === 0) {
      return [];
    }

    try {
      // Convert array to comma-separated string
      const idsString = productIds.join(',');
      const response = await api.get(`/products?ids=${idsString}`);
      return response.data.products || [];
    } catch (error) {
      console.error('Error fetching product details for favorites:', error);
      return [];
    }
  }
}

const favoritesServiceHelper = new FavoritesServiceHelper();
export default favoritesServiceHelper;