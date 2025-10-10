import axios from 'axios';
import { getAuth } from 'firebase/auth';

// Resolve API base URL for all environments
// Priority:
// 1) Explicit VITE_API_URL
// 2) If running on localhost -> http://localhost:3000/api
// 3) Otherwise use relative '/api' (works when frontend and backend share the same origin in production)
const resolveApiBaseUrl = () => {
  const fromEnv = import.meta.env?.VITE_API_URL;
  if (fromEnv && typeof fromEnv === 'string' && fromEnv.trim().length > 0) {
    return fromEnv.trim().replace(/\/$/, '');
  }
  const isLocalhost = typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
  if (isLocalhost) {
    return 'http://localhost:3000/api';
  }
  return '/api';
};

const API_URL = resolveApiBaseUrl();

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds timeout
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

// Token refresh throttling
let lastTokenRefresh = 0;
const TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes (reduced from 10)

// Function to check if token is close to expiring
const isTokenExpiring = (token) => {
  try {
    if (!token) return true;
    
    // Decode JWT without verification to check expiry
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    
    // Check if token expires within next 5 minutes
    return (expirationTime - currentTime) < (5 * 60 * 1000);
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

// Function to get a fresh token
const getFreshToken = async (forceRefresh = false) => {
  try {
    const currentUser = getAuthSafe()?.currentUser;
    const cachedToken = localStorage.getItem('authToken');

    // If we have a Firebase user, try to get/refresh the ID token
    if (currentUser) {
      const now = Date.now();
      const currentToken = cachedToken;

      // Force refresh if explicitly requested, token is expiring, or it's been too long
      const shouldForceRefresh = forceRefresh ||
        isTokenExpiring(currentToken) ||
        (now - lastTokenRefresh > TOKEN_REFRESH_INTERVAL);

      // Get token with appropriate refresh strategy
      const token = await currentUser.getIdToken(shouldForceRefresh);

      if (shouldForceRefresh) {
        // Update last refresh timestamp
        lastTokenRefresh = now;
        console.log('Token refreshed proactively');
      }

      localStorage.setItem('authToken', token);
      return token;
    }

    // No current user yet (e.g., during initial app bootstrap), but we might
    // already have a valid token in localStorage from a previous session.
    // Fall back to returning the cached token to avoid unauthenticated calls.
    if (cachedToken) {
      return cachedToken;
    }

    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);

    // If there's an auth error, we should clear the token
    if (error.code && String(error.code).includes('auth/')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('cachedUser');

      // Dispatch an auth expired event
      const authExpiredEvent = new CustomEvent('auth:expired', {
        detail: { error: error }
      });
      window.dispatchEvent(authExpiredEvent);
    }

    return null;
  }
};

// Add a request interceptor to include auth token
api.interceptors.request.use(
  async (config) => {
    // Get token - this will refresh if needed, otherwise returns cached token
    let token = await getFreshToken();

    // As an extra safety, fall back to localStorage token if not returned
    if (!token) {
      token = localStorage.getItem('authToken');
    }

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Set up automatic token refresh interval
let tokenRefreshInterval;

const startTokenRefreshInterval = () => {
  // Clear existing interval if any
  if (tokenRefreshInterval) {
    clearInterval(tokenRefreshInterval);
  }
  
  // Refresh token every 30 minutes proactively
  tokenRefreshInterval = setInterval(async () => {
    const currentUser = getAuthSafe()?.currentUser;
    if (currentUser) {
      try {
        await getFreshToken(true); // Force refresh
      } catch (error) {
        console.error('Background token refresh failed:', error);
      }
    } else {
      // No user, clear interval
      clearInterval(tokenRefreshInterval);
      tokenRefreshInterval = null;
    }
  }, 30 * 60 * 1000); // 30 minutes
};

// Start token refresh when user is authenticated
const auth = getAuthSafe();
if (auth) {
  auth.onAuthStateChanged((user) => {
    if (user) {
      startTokenRefreshInterval();
    } else {
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
        tokenRefreshInterval = null;
      }
    }
  });
}

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
      
      const errorData = error.response?.data;
      const errorCode = errorData?.code;
      
      // Handle different types of auth errors
      if (errorCode === 'USER_NOT_FOUND') {
        console.log('User not found in database, need to re-register');
        localStorage.removeItem('authToken');
        localStorage.removeItem('cachedUser');
        
        const authExpiredEvent = new CustomEvent('auth:expired', {
          detail: { error: new Error('User account not found. Please register again.') }
        });
        window.dispatchEvent(authExpiredEvent);
        return Promise.reject(error);
      }
      
      try {
        // Get the current user from Firebase
        const currentUser = getAuthSafe()?.currentUser;
        
        if (currentUser) {
          console.log('Token expired, forcing refresh...');
          // Force a token refresh
          const newToken = await currentUser.getIdToken(true);
          
          if (newToken) {
            console.log('Got new token, updating localStorage and retrying request');
            // Store the new token
            localStorage.setItem('authToken', newToken);
            
            // Update the header with the new token
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            
            // Reset retry flag for the retry
            originalRequest._retry = false;
            
            // Retry the original request
            return api(originalRequest);
          }
        } else {
          console.log('No current user found, authentication required');
          // User is not logged in or session expired completely
          
          // Clear any outdated auth data
          localStorage.removeItem('authToken');
          localStorage.removeItem('cachedUser');
          
          // Dispatch a custom event that AuthContext can listen for
          const authExpiredEvent = new CustomEvent('auth:expired');
          window.dispatchEvent(authExpiredEvent);
        }
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        
        // Clear invalid tokens
        localStorage.removeItem('authToken');
        localStorage.removeItem('cachedUser');
        
        // Dispatch auth expired event
        const authExpiredEvent = new CustomEvent('auth:expired', { 
          detail: { error: refreshError } 
        });
        window.dispatchEvent(authExpiredEvent);
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
  sendOtp: async (email) => {
    if (!email) throw new Error('Email is required');
    return api.post('/email/send-otp', { email }).then(r => r.data);
  },
  verifyOtp: async (email, otp) => {
    if (!email || !otp) throw new Error('Email and OTP are required');
    return api.post('/email/verify-otp', { email, otp }).then(r => r.data);
  }
};

// Export default api instance for other services
export default api;
