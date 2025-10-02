import api from './apiService';

class FavoriteService {
  // Get all favorites
  async getFavorites() {
    try {
      const response = await api.get('/users/favorites');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching favorites:', error);
      
      // Provide more specific error messages
      if (error.response?.status === 500) {
        throw new Error('Server error while fetching favorites. Please try again later.');
      } else if (error.response?.status === 401) {
        throw new Error('Please log in to view your favorites.');
      } else if (error.response?.status === 404) {
        throw new Error('Favorites endpoint not found.');
      } else if (!error.response) {
        throw new Error('Network error. Please check your connection.');
      } else {
        throw new Error(`Error ${error.response.status}: ${error.response.data?.message || 'Unknown error'}`);
      }
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