import axios from 'axios';
import { getAuth } from 'firebase/auth';

// Create an instance of axios with base URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Get Firebase auth instance
const auth = getAuth();

// Function to get a fresh token
const getFreshToken = async () => {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      // Force refresh the token
      const token = await currentUser.getIdToken(true);
      localStorage.setItem('authToken', token);
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
};

// Add a request interceptor to include auth token
api.interceptors.request.use(
  async (config) => {
    // Always try to get a fresh token before making API requests
    const token = await getFreshToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If error is due to token expiration and the request hasn't been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to get a fresh token
        const newToken = await getFreshToken();
        if (newToken) {
          // Update the header with the new token
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          // Retry the original request
          return axios(originalRequest);
        }
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        // If refreshing token fails, redirect to login or handle session expiration
        // For now, let the original error propagate
      }
    }
    
    return Promise.reject(error);
  }
);

// Email verification services
export const emailService = {
  // Send verification OTP to email
  sendVerificationEmail: async (email) => {
    try {
      const response = await api.post('/email/send-verification', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Verify email with OTP
  verifyEmail: async (otp) => {
    try {
      const response = await api.post('/email/verify', { otp });
      // Update localStorage to ensure verification persists after refresh
      const cachedUser = JSON.parse(localStorage.getItem('cachedUser') || '{}');
      cachedUser.isEmailVerified = true;
      cachedUser.email = response.data.email;
      localStorage.setItem('cachedUser', JSON.stringify(cachedUser));
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Resend verification OTP
  resendVerificationEmail: async () => {
    try {
      const response = await api.post('/email/resend-verification');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  // Check email verification status
  checkVerificationStatus: async () => {
    try {
      const response = await api.get('/email/verification-status');
      // Update localStorage with current verification status
      const cachedUser = JSON.parse(localStorage.getItem('cachedUser') || '{}');
      if (response.data.email) {
        cachedUser.email = response.data.email;
      }
      cachedUser.isEmailVerified = response.data.isEmailVerified;
      localStorage.setItem('cachedUser', JSON.stringify(cachedUser));
      return response.data;
    } catch (error) {
      console.error('Error checking verification status:', error);
      return { isEmailVerified: false };
    }
  },
  
  // Update verified email address
  updateEmail: async (email) => {
    try {
      const response = await api.post('/email/update', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Verify updated email with OTP
  verifyUpdatedEmail: async (otp) => {
    try {
      const response = await api.post('/email/verify-update', { otp });
      // Update localStorage to ensure verification persists after refresh
      const cachedUser = JSON.parse(localStorage.getItem('cachedUser') || '{}');
      cachedUser.isEmailVerified = true;
      cachedUser.email = response.data.email;
      localStorage.setItem('cachedUser', JSON.stringify(cachedUser));
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

// Export default api instance for other services
export default api;
