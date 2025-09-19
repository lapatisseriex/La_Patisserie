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

// Lazy Firebase auth accessor to avoid failures before app initialization
let _auth;
const getAuthSafe = () => {
  if (_auth) return _auth;
  try {
    _auth = getAuth();
  } catch (e) {
    // Firebase app not initialized yet; return undefined and try again later
    _auth = undefined;
  }
  return _auth;
};

// In-memory caches for GET requests and in-flight de-duplication
const requestCache = new Map(); // key -> { data, expiry }
const inFlight = new Map(); // key -> Promise

const buildKey = (method, url, paramsOrData) => {
  try {
    return `${method.toUpperCase()} ${url} :: ${JSON.stringify(paramsOrData || {})}`;
  } catch {
    return `${method.toUpperCase()} ${url}`;
  }
};

// Function to get a fresh token
const getFreshToken = async () => {
  try {
    const currentUser = getAuthSafe()?.currentUser;
    if (currentUser) {
      // Do NOT force refresh every time; let backend 401 trigger refresh path
      const token = await currentUser.getIdToken();
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
    // Try to get a valid token (no forced refresh). If absent, request proceeds unauthenticated.
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
        const newToken = await (async () => {
          const currentUser = getAuthSafe()?.currentUser;
          return currentUser ? currentUser.getIdToken(true) : null;
        })();
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

// Helper for GET with de-duplication and optional caching
// usage: apiGet('/users/favorites', { params: {}, cache: true, cacheTTL: 30000, dedupe: true })
export const apiGet = async (url, options = {}) => {
  const { params, cache = false, cacheTTL = 30000, dedupe = true, headers } = options;
  const key = buildKey('GET', url, params);

  // Return cached if valid
  if (cache && requestCache.has(key)) {
    const { data, expiry } = requestCache.get(key);
    if (!expiry || expiry > Date.now()) {
      return data;
    }
    // Expired
    requestCache.delete(key);
  }

  // De-duplicate in-flight
  if (dedupe && inFlight.has(key)) {
    return inFlight.get(key);
  }

  const reqPromise = api
    .get(url, { params, headers })
    .then((resp) => {
      if (cache) {
        requestCache.set(key, { data: resp.data, expiry: cacheTTL ? Date.now() + cacheTTL : undefined });
      }
      return resp.data;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  if (dedupe) inFlight.set(key, reqPromise);
  return reqPromise;
};

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
