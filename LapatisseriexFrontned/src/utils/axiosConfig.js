import axios from 'axios';

// Set default timeout to 15 seconds (higher than default)
axios.defaults.timeout = 15000;

// Create an instance with custom config
const axiosInstance = axios.create({
  timeout: 15000, // 15 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    // Handle request timeout
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      console.error('Request timeout:', error);
    }

    // Handle network errors
    if (error.message === 'Network Error') {
      console.error('Network error - check your connection:', error);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;