/**
 * Enhanced API Service with Network Error Handling
 * Extends the existing apiService with offline support and retry logic
 */

import { 
  showNetworkErrorToast, 
  getNetworkErrorType, 
  NetworkErrorTypes,
  retryWithBackoff,
  offlineRequestQueue 
} from '../utils/networkErrorHandler';
import { toast } from 'react-toastify';

// Import your existing API service
let apiService;
try {
  apiService = await import('./apiService.js');
} catch (error) {
  console.error('Failed to import apiService:', error);
}

/**
 * Network-aware API wrapper
 * Adds retry logic, offline queueing, and user-friendly error messages
 */
class NetworkAwareApiService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.setupNetworkListeners();
  }

  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleConnectionRestored();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleConnectionLost();
    });
  }

  handleConnectionRestored() {
    toast.success('Connection restored! Processing queued requests...', {
      position: "top-center",
      autoClose: 3000});
    
    // Process any queued offline requests
    offlineRequestQueue.processQueue();
  }

  handleConnectionLost() {
    toast.error('Internet connection lost. Some features may be limited.', {
      position: "top-center",
      autoClose: false,
      toastId: 'connection-lost'});
  }

  /**
   * Enhanced API call with network error handling
   */
  async makeRequest(method, url, data = null, options = {}) {
    const {
      showErrors = true,
      retries = 3,
      cache = false,
      queueIfOffline = false,
      customErrorMessage = null
    } = options;

    // Check if offline and should queue
    if (!this.isOnline && queueIfOffline) {
      const requestData = {
        method,
        url,
        data,
        options: {
          method,
          headers: options.headers || {},
          body: data ? JSON.stringify(data) : undefined}
      };
      
      offlineRequestQueue.addRequest(requestData);
      
      toast.info('Request queued. Will be sent when connection is restored.', {
        position: "bottom-right",
        autoClose: 3000});
      
      throw new Error('Offline - request queued');
    }

    // Check if completely offline
    if (!this.isOnline) {
      const error = new Error('No internet connection');
      if (showErrors) {
        showNetworkErrorToast(error, customErrorMessage);
      }
      throw error;
    }

    try {
      // Use retry logic for the request
      const result = await retryWithBackoff(async () => {
        if (!apiService) {
          throw new Error('API service not available');
        }

        // Use appropriate method from apiService
        switch (method.toUpperCase()) {
          case 'GET':
            return await apiService.get(url, options);
          case 'POST':
            return await apiService.post(url, data, options);
          case 'PUT':
            return await apiService.put(url, data, options);
          case 'DELETE':
            return await apiService.delete(url, options);
          case 'PATCH':
            return await apiService.patch(url, data, options);
          default:
            throw new Error(`Unsupported method: ${method}`);
        }
      }, retries);

      return result;
      
    } catch (error) {
      if (showErrors) {
        showNetworkErrorToast(error, customErrorMessage);
      }
      throw error;
    }
  }

  // Convenience methods
  async get(url, options = {}) {
    return this.makeRequest('GET', url, null, options);
  }

  async post(url, data, options = {}) {
    return this.makeRequest('POST', url, data, { ...options, queueIfOffline: true });
  }

  async put(url, data, options = {}) {
    return this.makeRequest('PUT', url, data, { ...options, queueIfOffline: true });
  }

  async patch(url, data, options = {}) {
    return this.makeRequest('PATCH', url, data, { ...options, queueIfOffline: true });
  }

  async delete(url, options = {}) {
    return this.makeRequest('DELETE', url, null, { ...options, queueIfOffline: true });
  }

  // Health check method
  async checkApiHealth() {
    try {
      await this.get('/health', { 
        showErrors: false, 
        retries: 1,
        timeout: 5000 
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isOnline: this.isOnline,
      queuedRequests: offlineRequestQueue.getQueueStatus()
    };
  }
}

// Create singleton instance
export const networkAwareApi = new NetworkAwareApiService();

// Export for backward compatibility and direct use
export default networkAwareApi;

// Also export the queue for direct access if needed
export { offlineRequestQueue };