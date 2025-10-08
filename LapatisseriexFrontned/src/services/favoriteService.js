import api, { apiGet } from './apiService';

class FavoriteService {
  // Get all favorites
  async getFavorites() {
    try {
      // Check if token exists before making API call
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('No auth token found, cannot fetch favorites');
        throw new Error('Authentication required. Please log in to view your favorites.');
      }
      
  console.log('Fetching favorites from API with token...');
  // Use apiGet with de-duplication and short cache to avoid bursts
  const response = await apiGet('/users/favorites', { cache: true, cacheTTL: 5000, dedupe: true });
  console.log('Favorites API response:', response);
      
      // Return the data array directly
  const favoritesData = response?.data || response?.items || response || [];
      console.log('Processed favorites data:', favoritesData);
      
      return favoritesData;
    } catch (error) {
      console.error('Error fetching favorites:', error);
      
      // Provide more specific error messages
      if (error.response?.status === 401) {
        const code = error.response?.data?.code;
        if (code === 'NO_TOKEN') {
          throw new Error('Authentication required. Please log in to view your favorites.');
        }
        throw new Error('Please log in to view your favorites.');
      } else if (error.response?.status === 500) {
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
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required. Please log in to add favorites.');
      }
      
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
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required. Please log in to manage favorites.');
      }
      
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