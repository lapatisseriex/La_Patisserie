import api from './apiService';

class FavoriteService {
  // Get all favorites
  async getFavorites() {
    try {
      const response = await api.get('/users/favorites');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching favorites:', error);
      throw error;
    }
  }

  // Add product to favorites
  async addToFavorites(productId) {
    try {
      const response = await api.post(`/users/favorites/${productId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  }

  // Remove product from favorites
  async removeFromFavorites(productId) {
    try {
      const response = await api.delete(`/users/favorites/${productId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  }

  // Check if product is in favorites
  async checkFavoriteStatus(productId) {
    try {
      const response = await api.get(`/users/favorites/${productId}`);
      return response.data.data.isInFavorites;
    } catch (error) {
      console.error('Error checking favorite status:', error);
      throw error;
    }
  }
}

const favoriteService = new FavoriteService();
export default favoriteService;