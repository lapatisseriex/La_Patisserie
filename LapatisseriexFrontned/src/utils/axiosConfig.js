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

// Create extended timeout instance for long-running operations
const longTimeoutAxiosInstance = axios.create({
  timeout: 45000, // 45 seconds for operations like order cancellation
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for default instance
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

// Add response interceptor for long timeout instance
longTimeoutAxiosInstance.interceptors.response.use(
  response => response,
  error => {
    // Handle request timeout with better error message for long operations
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      console.error('Long operation timeout (45s exceeded):', error);
    }

    // Handle network errors
    if (error.message === 'Network Error') {
      console.error('Network error - check your connection:', error);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
export { longTimeoutAxiosInstance };