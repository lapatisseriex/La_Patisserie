import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class NotificationService {
  // Get user notifications
  async getNotifications(page = 1, limit = 20, unreadOnly = false) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          page,
          limit,
          unreadOnly
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.patch(
        `${API_URL}/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.patch(
        `${API_URL}/notifications/mark-all-read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.delete(
        `${API_URL}/notifications/${notificationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
}

const notificationService = new NotificationService();
export default notificationService;