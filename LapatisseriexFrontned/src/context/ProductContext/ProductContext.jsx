import { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import axiosInstance from '../../utils/axiosConfig';
import { useAuth } from '../../hooks/useAuth';
import { useDispatch } from 'react-redux';
import { removeProduct } from '../../redux/productsSlice';
import CacheManager from '../../utils/cacheManager';

const ProductContext = createContext();

const PRODUCT_CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export const useProduct = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProduct must be used within a ProductProvider. Make sure your component is wrapped with ProductProvider.');
  }
  return context;
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider. Make sure your component is wrapped with ProductProvider.');
  }
  return context;
};

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const dispatch = useDispatch();

  // Circuit breaker state for API resilience
  const circuitBreakerRef = useRef({
    failureCount: 0,
    lastFailureTime: null,
    state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
    halfOpenCalls: 0
  });

  // Circuit breaker configuration
  const FAILURE_THRESHOLD = 5;
  const RECOVERY_TIMEOUT = 60000; // 1 minute
  const HALF_OPEN_MAX_CALLS = 3;

  
  // Cache to prevent redundant API calls
  const requestCache = useRef(new Map());
  const requestInProgress = useRef(new Map());
  const productCache = useRef(new Map());
  const productRequestMap = useRef(new Map());
  
  const API_URL = import.meta.env.VITE_API_URL;

  // Circuit breaker helper functions
  const isCircuitBreakerOpen = useCallback(() => {
    const { state, lastFailureTime } = circuitBreakerRef.current;
    
    if (state === 'OPEN') {
      const timeSinceFailure = Date.now() - lastFailureTime;
      if (timeSinceFailure > RECOVERY_TIMEOUT) {
        circuitBreakerRef.current.state = 'HALF_OPEN';
        circuitBreakerRef.current.halfOpenCalls = 0;
        console.log('🔄 Circuit breaker moving to HALF_OPEN state');
        return false;
      }
      return true;
    }
    
    return false;
  }, []);

  const recordSuccess = useCallback(() => {
    const breaker = circuitBreakerRef.current;
    if (breaker.state === 'HALF_OPEN') {
      breaker.halfOpenCalls++;
      if (breaker.halfOpenCalls >= HALF_OPEN_MAX_CALLS) {
        breaker.state = 'CLOSED';
        breaker.failureCount = 0;
        breaker.lastFailureTime = null;
        console.log('✅ Circuit breaker CLOSED - service recovered');
      }
    } else if (breaker.state === 'CLOSED') {
      breaker.failureCount = 0;
    }
  }, []);

  const recordFailure = useCallback((error) => {
    const breaker = circuitBreakerRef.current;
    breaker.failureCount++;
    breaker.lastFailureTime = Date.now();

    if (breaker.failureCount >= FAILURE_THRESHOLD && breaker.state === 'CLOSED') {
      breaker.state = 'OPEN';
      console.error(`🚨 Circuit breaker OPEN - too many failures (${breaker.failureCount})`);
    } else if (breaker.state === 'HALF_OPEN') {
      breaker.state = 'OPEN';
      console.error('🚨 Circuit breaker back to OPEN - failure during recovery');
    }
  }, []);

  // Fetch all products with filtering options
  const fetchProducts = useCallback(async (filters = {}) => {
    // Extract forceRefresh flag and remove it from filters before building query
    const { forceRefresh = false, ...actualFilters } = filters;
    
    // Build query parameters for filtering
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(actualFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const baseQueryString = queryParams.toString();

    // Generate a unique cache key based only on the actual query parameters
    const cacheKey = `products-${baseQueryString}`;
    
    try {
      // Circuit breaker check
      if (isCircuitBreakerOpen()) {
        console.warn('🚨 Circuit breaker is OPEN - returning cached data if available');
        const cachedResult = requestCache.current.get(cacheKey);
        if (cachedResult) {
          setError("Service temporarily unavailable. Showing cached data.");
          return cachedResult.data;
        } else {
          setError("Service temporarily unavailable. Please try again later.");
          return { products: [] };
        }
      }
      
      // Only bypass cache for admin views or when forceRefresh is true
      const isAdminView = actualFilters.isActive === 'all';
      const shouldBypassCache = isAdminView || forceRefresh;
      
      // Improved caching: category pages now use cache for 5 minutes (300000ms)
      const CACHE_TIMEOUT = 300000; // 5 minutes
      
      // Check for valid cache entry
      const cachedResult = shouldBypassCache ? null : requestCache.current.get(cacheKey);
      const now = Date.now();
      let requestQueryString = baseQueryString;

      if (shouldBypassCache) {
        const freshParams = new URLSearchParams(queryParams);
        freshParams.set('_ts', now.toString());
        requestQueryString = freshParams.toString();
      }
      
      if (!shouldBypassCache && cachedResult && (now - cachedResult.timestamp < CACHE_TIMEOUT)) {
        console.log(`Using cached product data for key: ${cacheKey} (age: ${(now - cachedResult.timestamp)/1000}s)`);
        setLoading(false); // Ensure loading state is correct even when using cache
        
        // If it's an error cache, set the error state but still return the cached data
        if (cachedResult.isError) {
          setError("Service temporarily unavailable. Please try again later.");
        }
        
        return cachedResult.data;
      }
      
      // Prevent duplicate in-flight requests for the same data
      if (requestInProgress.current.get(cacheKey)) {
        console.log(`Request already in progress for: ${cacheKey}, waiting...`);
        // Wait for the existing request to complete instead of making a duplicate
        // Poll every 100ms to see if the request completes
        let attempts = 0;
        while (requestInProgress.current.get(cacheKey) && attempts < 100) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        // Check if data is in cache after waiting
        const resultAfterWait = requestCache.current.get(cacheKey);
        if (resultAfterWait) {
          return resultAfterWait.data;
        }
      }
      
      // Mark this request as in progress
      requestInProgress.current.set(cacheKey, true);
      
      // Set loading state
      setLoading(true);
      setError(null);
      
      console.log(`📦 Fetching products: ${requestQueryString ? requestQueryString : 'all products'}`);
      const response = await axiosInstance.get(
        `${API_URL}/products${requestQueryString ? `?${requestQueryString}` : ''}`
      );
      
      // Success log
      console.log(`✅ Products loaded: ${response.data.products?.length || 0} items`);
      
      // Record successful API call for circuit breaker
      recordSuccess();
      
      let productsData = [];
      let responseData = response.data;
      
      if (response.data && response.data.products) {
        productsData = response.data.products;
        // Update the state
        setProducts(productsData);
      } else if (Array.isArray(response.data)) {
        // Handle case where API returns array directly
        productsData = response.data;
        responseData = { products: productsData };
        setProducts(productsData);
      } else {
        console.error('Invalid product data format:', response.data);
        productsData = [];
        responseData = { products: [] };
        setProducts([]);
      }
      
      // Store the result in cache with normalized structure
      requestCache.current.set(cacheKey, {
        data: responseData,
        timestamp: now
      });
      
      // Request is no longer in progress
      requestInProgress.current.delete(cacheKey);
      
      // Clean up old cache entries if cache gets too large (more than 20 entries)
      if (requestCache.current.size > 20) {
        // Get all cache keys sorted by timestamp (oldest first)
        const sortedCacheKeys = [...requestCache.current.entries()]
          .sort((a, b) => a[1].timestamp - b[1].timestamp)
          .map(entry => entry[0]);
          
        // Remove the 5 oldest entries
        for (let i = 0; i < 5 && i < sortedCacheKeys.length; i++) {
          requestCache.current.delete(sortedCacheKeys[i]);
        }
      }
      
      setLoading(false);
      return responseData;
    } catch (err) {
      console.error("Error fetching products:", err);
      
      // Record failure for circuit breaker
      recordFailure(err);
      
      // Handle different types of errors
      let errorMessage = "Failed to load products";
      if (err.code === 'ECONNABORTED') {
        errorMessage = "Request timeout. Please check your internet connection.";
      } else if (err.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (err.response?.status === 503) {
        errorMessage = "Service temporarily unavailable. Please try again later.";
      } else if (err.response?.status === 404) {
        errorMessage = "Products not found.";
      } else if (!navigator.onLine) {
        errorMessage = "No internet connection. Please check your network.";
      }
      
      setError(errorMessage);
      setLoading(false);
      
      // Request is no longer in progress
      requestInProgress.current.delete(cacheKey);
      
      // Return empty data instead of retrying to prevent infinite loops
      const emptyResponse = { products: [] };
      
      // Cache the error response for a short time to prevent immediate retries
      requestCache.current.set(cacheKey, {
        data: emptyResponse,
        timestamp: Date.now(),
        isError: true
      });
      
      return emptyResponse;
    }
  }, [API_URL]);
  
  // Get a single product by ID with improved error handling
  const getProduct = useCallback(async (productId, options = {}) => {
    if (!productId) {
      return null;
    }

    const { forceRefresh = false } = options;
    const now = Date.now();
    const cached = productCache.current.get(productId);

    // Check cache validity - reduced timeout for better freshness
    const CACHE_TIMEOUT = 2 * 60 * 1000; // 2 minutes instead of 5
    if (!forceRefresh && cached && (now - cached.timestamp < CACHE_TIMEOUT)) {
      console.log(`Using cached product data for ${productId}`);
      return cached.data;
    }

    if (!forceRefresh) {
      const pending = productRequestMap.current.get(productId);
      if (pending) {
        console.log(`Waiting for existing request for product ${productId}`);
        return pending;
      }
    }

    const requestPromise = (async () => {
      const hasUsableCache = !forceRefresh && Boolean(cached) && (now - cached.timestamp < CACHE_TIMEOUT);

      try {
        // Circuit breaker check for individual product requests
        if (isCircuitBreakerOpen()) {
          console.warn(`🚨 Circuit breaker is OPEN - returning cached data for product ${productId}`);
          if (cached) {
            return cached.data;
          } else {
            throw new Error('Service temporarily unavailable and no cached data available');
          }
        }

        if (!hasUsableCache) {
          setLoading(true);
        }
        setError(null);

        console.log(`Fetching product ${productId} from API...`);
        const response = await axiosInstance.get(`${API_URL}/products/${productId}`, {
          timeout: 8000 // Reduced timeout for faster failure detection
        });
        
        if (!response.data) {
          throw new Error('Product not found');
        }
        
        // Validate product data before caching
        if (!CacheManager.isValidProductData(response.data)) {
          throw new Error('Invalid product data received from server');
        }
        
        productCache.current.set(productId, {
          data: response.data,
          timestamp: Date.now()
        });

        console.log(`Successfully loaded product: ${response.data.name}`);
        
        // Record successful API call for circuit breaker
        recordSuccess();
        
        return response.data;
      } catch (err) {
        console.error(`Error fetching product ${productId}:`, err);
        
        // Record failure for circuit breaker
        recordFailure(err);
        
        // Use cache manager for better error messages
        const errorMessage = CacheManager.handleNetworkError(err);
        
        // Return cached data if available on error (better UX)
        if (cached) {
          console.log(`Returning stale cached data for product ${productId} due to error`);
          return cached.data;
        }
        
        setError(errorMessage);
        throw err;
      } finally {
        productRequestMap.current.delete(productId);
        if (!hasUsableCache) {
          setLoading(false);
        }
      }
    })();

    productRequestMap.current.set(productId, requestPromise);

    try {
      return await requestPromise;
    } catch (error) {
      // Final fallback to cache if available
      const fallback = productCache.current.get(productId);
      if (fallback) {
        console.log(`Using fallback cached data for product ${productId}`);
        return fallback.data;
      }
      return null;
    }
  }, [API_URL]);
  
  // Clear product cache function for troubleshooting
  const clearProductCache = useCallback(() => {
    productCache.current.clear();
    requestCache.current.clear();
    productRequestMap.current.clear();
    requestInProgress.current.clear();
    CacheManager.clearProductCache();
    console.log('🧹 All product caches cleared');
  }, []);

  // Get circuit breaker status
  const getCircuitBreakerStatus = useCallback(() => {
    const breaker = circuitBreakerRef.current;
    return {
      state: breaker.state,
      failureCount: breaker.failureCount,
      lastFailureTime: breaker.lastFailureTime,
      timeUntilRetry: breaker.state === 'OPEN' && breaker.lastFailureTime 
        ? Math.max(0, RECOVERY_TIMEOUT - (Date.now() - breaker.lastFailureTime))
        : 0
    };
  }, []);

  // Reset circuit breaker (for admin/debugging)
  const resetCircuitBreaker = useCallback(() => {
    circuitBreakerRef.current = {
      failureCount: 0,
      lastFailureTime: null,
      state: 'CLOSED',
      halfOpenCalls: 0
    };
    console.log('🔄 Circuit breaker manually reset');
  }, []);
  
  // Clear specific product from cache
  const clearSpecificProductCache = useCallback((productId) => {
    if (productId) {
      productCache.current.delete(productId);
      productRequestMap.current.delete(productId);
      requestInProgress.current.delete(productId);
      CacheManager.clearSpecificProduct(productId);
      console.log(`🧹 Cache cleared for product: ${productId}`);
    }
  }, []);
  
  // Admin function: Create a new product
  const createProduct = useCallback(async (productData) => {
    try {
      setLoading(true);
      setError(null);

      // Get auth token
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);

      // Ensure price is a number
      const sanitizedData = {
        ...productData,
        price: typeof productData.price === 'number' ? productData.price : Number(productData.price)
      };

      // Use VITE_VERCEL_API_URL for createProduct to ensure it goes to production backend
      const createProductUrl = import.meta.env.VITE_VERCEL_API_URL || API_URL;

      const response = await axios.post(
        `${createProductUrl}/products`,
        sanitizedData,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Product created successfully:', response.data);
      
      // Clear ALL caches to ensure fresh data
      requestCache.current.clear();
      productCache.current.clear();
      requestInProgress.current.clear();
      productRequestMap.current.clear();
      CacheManager.clearProductCache();
      
      // Immediately update products state with the new product
      const newProduct = response.data;
      setProducts(prev => {
        // Check if product already exists to avoid duplicates
        const exists = prev.some(p => p._id === newProduct._id);
        if (exists) {
          console.log('Product already exists in state, updating...');
          return prev.map(p => p._id === newProduct._id ? newProduct : p);
        } else {
          console.log('Adding new product to state...');
          return [...prev, newProduct];
        }
      });
      
      // Also cache the new product individually for immediate access
      if (newProduct._id) {
        productCache.current.set(newProduct._id, {
          data: newProduct,
          timestamp: Date.now()
        });
      }
      
      console.log('✅ Product state updated and cached');
      
      return response.data;
    } catch (err) {
      console.error("Error creating product:", err);
      setError(err.response?.data?.message || "Failed to create product");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [API_URL]);
  
  // Admin function: Update a product
  const updateProduct = useCallback(async (productId, productData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get auth token
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);
      
      // Ensure price is a number
      const sanitizedData = {
        ...productData,
        price: typeof productData.price === 'number' ? productData.price : Number(productData.price)
      };
      
      const response = await axios.put(
        `${API_URL}/products/${productId}`, 
        sanitizedData,
        {
          headers: { 
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Product updated successfully:', response.data);
      
      // Clear ALL caches to ensure fresh data
      requestCache.current.clear();
      productCache.current.clear();
      requestInProgress.current.clear();
      productRequestMap.current.clear();
      CacheManager.clearProductCache();
      
      // Update product in state immediately
      const updatedProduct = response.data;
      setProducts(prev => prev.map(p => p._id === productId ? updatedProduct : p));
      
      // Also update the individual product cache
      if (updatedProduct._id) {
        productCache.current.set(updatedProduct._id, {
          data: updatedProduct,
          timestamp: Date.now()
        });
      }
      
      console.log('✅ Product state updated and cached');
      
      return response.data;
    } catch (err) {
      console.error(`Error updating product ${productId}:`, err);
      setError(err.response?.data?.message || "Failed to update product");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [API_URL]);
  
  // Admin function: Update product discount
  const updateProductDiscount = async (productId, discountData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get auth token
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);
      
      const response = await axios.put(
        `${API_URL}/products/${productId}/discount`, 
        discountData,
        {
          headers: { 
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Clear cache after updating discount to ensure fresh data on next fetch
      for (const key of requestCache.current.keys()) {
        if (key.startsWith('products-')) {
          requestCache.current.delete(key);
        }
      }
      
      // Also clear localStorage/sessionStorage product caches
      CacheManager.clearProductCache();
      
      // Update product in state immediately without making another API call
      setProducts(prev => prev.map(p => p._id === productId ? response.data : p));
      
      return response.data;
    } catch (err) {
      console.error(`Error updating product discount ${productId}:`, err);
      setError(err.response?.data?.message || "Failed to update product discount");
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Admin function: Delete a product
  const deleteProduct = useCallback(async (productId) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Attempting to delete product: ${productId}`);
      
      // Get auth token
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);
      
      const response = await axios.delete(
        `${API_URL}/products/${productId}`,
        {
          headers: { 
            Authorization: `Bearer ${idToken}`
          }
        }
      );
      
      console.log(`Product deletion response:`, response.data);
      
      // Clear ALL cache to ensure fresh data
      requestCache.current.clear();
      
      // Update products list in state to remove the deleted product
      setProducts(prev => prev.filter(product => product._id !== productId));
      
      // Also update Redux store to keep everything in sync
      dispatch(removeProduct(productId));
      
      // Force refresh products from server to ensure consistency
      await fetchProducts({ isActive: 'all', clearCache: true });
      
      console.log(`Product ${productId} deleted successfully and data refreshed`);
      
      setLoading(false);
      return true;
    } catch (err) {
      console.error(`Error deleting product ${productId}:`, err);
      
      // Provide more specific error messages
      let errorMessage = "Failed to delete product";
      
      if (err.response?.status === 404) {
        errorMessage = "Product not found";
      } else if (err.response?.status === 401) {
        errorMessage = "You are not authorized to delete this product";
      } else if (err.response?.status === 403) {
        errorMessage = "Access denied. Admin privileges required";
      } else if (err.response?.status === 500) {
        errorMessage = "Server error occurred while deleting product. Please try again.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [API_URL, dispatch]);
  
  // Force refresh products from server (useful after mutations)
  const refreshProducts = useCallback(async (filters = {}) => {
    // Clear all caches to ensure fresh data
    requestCache.current.clear();
    productCache.current.clear();
    requestInProgress.current.clear();
    productRequestMap.current.clear();
    CacheManager.clearProductCache();
    
    console.log('🔄 Force refreshing products from server...');
    
    // Fetch fresh data from server
    return await fetchProducts({ ...filters, forceRefresh: true });
  }, [fetchProducts]);

  // Context value
  const value = {
    products,
    loading,
    error,
    fetchProducts,
    refreshProducts,
    getProduct,
    createProduct,
    updateProduct,
    updateProductDiscount,
    deleteProduct,
    clearProductCache,
    clearSpecificProductCache,
    getCircuitBreakerStatus,
    resetCircuitBreaker
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};

export default ProductContext;
