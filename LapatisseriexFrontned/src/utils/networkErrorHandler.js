/**
 * Network-aware API error handler
 * Provides better error messages and retry logic for network issues
 */

import { toast } from 'react-toastify';

// Network error types
export const NetworkErrorTypes = {
  OFFLINE: 'OFFLINE',
  TIMEOUT: 'TIMEOUT',
  SERVER_ERROR: 'SERVER_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  UNKNOWN: 'UNKNOWN'
};

// Determine error type based on error object
export const getNetworkErrorType = (error) => {
  if (!navigator.onLine) {
    return NetworkErrorTypes.OFFLINE;
  }
  
  if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
    return NetworkErrorTypes.CONNECTION_ERROR;
  }
  
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return NetworkErrorTypes.TIMEOUT;
  }
  
  if (error?.response?.status >= 500) {
    return NetworkErrorTypes.SERVER_ERROR;
  }
  
  return NetworkErrorTypes.UNKNOWN;
};

// Get user-friendly error message
export const getNetworkErrorMessage = (errorType, customMessage = null) => {
  const messages = {
    [NetworkErrorTypes.OFFLINE]: {
      title: 'No Internet Connection',
      message: 'Please check your internet connection and try again.',
      action: 'Check Connection'
    },
    [NetworkErrorTypes.CONNECTION_ERROR]: {
      title: 'Connection Problem',
      message: 'Unable to connect to our servers. Please try again.',
      action: 'Retry'
    },
    [NetworkErrorTypes.TIMEOUT]: {
      title: 'Request Timeout',
      message: 'The request took too long. Please try again.',
      action: 'Retry'
    },
    [NetworkErrorTypes.SERVER_ERROR]: {
      title: 'Server Error',
      message: 'Something went wrong on our end. We\'re working to fix it.',
      action: 'Try Again Later'
    },
    [NetworkErrorTypes.UNKNOWN]: {
      title: 'Something went wrong',
      message: customMessage || 'An unexpected error occurred. Please try again.',
      action: 'Retry'
    }
  };
  
  return messages[errorType];
};

// Show network error toast
export const showNetworkErrorToast = (error, customMessage = null) => {
  const errorType = getNetworkErrorType(error);
  const { title, message } = getNetworkErrorMessage(errorType, customMessage);
  
  const toastOptions = {
    position: "top-center",
    autoClose: errorType === NetworkErrorTypes.OFFLINE ? false : 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true};

  switch (errorType) {
    case NetworkErrorTypes.OFFLINE:
      toast.error(`${title}: ${message}`, {
        ...toastOptions,
        toastId: 'offline-error', // Prevent duplicate offline toasts
      });
      break;
      
    case NetworkErrorTypes.CONNECTION_ERROR:
    case NetworkErrorTypes.TIMEOUT:
      toast.warning(`${title}: ${message}`, toastOptions);
      break;
      
    case NetworkErrorTypes.SERVER_ERROR:
      toast.error(`${title}: ${message}`, toastOptions);
      break;
      
    default:
      toast.error(`${title}: ${message}`, toastOptions);
  }
};

// Retry mechanism with exponential backoff
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if offline
      if (!navigator.onLine) {
        throw error;
      }
      
      // Don't retry on client errors (4xx)
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

// Enhanced fetch wrapper with network error handling
export const networkAwareFetch = async (url, options = {}) => {
  // Check if online before making request
  if (!navigator.onLine) {
    throw new Error('No internet connection');
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal});
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    
    throw error;
  }
};

// Queue for offline requests (to be sent when online)
class OfflineRequestQueue {
  constructor() {
    this.queue = JSON.parse(localStorage.getItem('offline_request_queue') || '[]');
    this.isProcessing = false;
    
    // Listen for online events to process queue
    window.addEventListener('online', () => {
      this.processQueue();
    });
  }
  
  // Add request to queue
  addRequest(request) {
    this.queue.push({
      ...request,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9)
    });
    
    this.saveQueue();
  }
  
  // Process queued requests when online
  async processQueue() {
    if (this.isProcessing || !navigator.onLine || this.queue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      const results = [];
      
      for (const request of this.queue) {
        try {
          const response = await fetch(request.url, request.options);
          results.push({ id: request.id, success: true, response });
        } catch (error) {
          results.push({ id: request.id, success: false, error });
        }
      }
      
      // Remove successfully processed requests
      this.queue = this.queue.filter(request => {
        const result = results.find(r => r.id === request.id);
        return result && !result.success;
      });
      
      this.saveQueue();
      
      // Show success toast if any requests were processed
      const successCount = results.filter(r => r.success).length;
      if (successCount > 0) {
        toast.success(`${successCount} queued request(s) processed successfully!`);
      }
      
    } finally {
      this.isProcessing = false;
    }
  }
  
  // Save queue to localStorage
  saveQueue() {
    localStorage.setItem('offline_request_queue', JSON.stringify(this.queue));
  }
  
  // Get queue status
  getQueueStatus() {
    return {
      count: this.queue.length,
      isProcessing: this.isProcessing
    };
  }
  
  // Clear queue
  clearQueue() {
    this.queue = [];
    this.saveQueue();
  }
}

// Export singleton instance
export const offlineRequestQueue = new OfflineRequestQueue();