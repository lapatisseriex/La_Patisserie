import { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import axiosInstance from '../../utils/axiosConfig';
import { useAuth } from '../../hooks/useAuth';
import CacheManager from '../../utils/cacheManager';

const ProductContext = createContext();

const PRODUCT_CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export const useProduct = () => useContext(ProductContext);
export const useProducts = () => useContext(ProductContext); // Alias for backward compatibility

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  
  // Cache to prevent redundant API calls
  const requestCache = useRef(new Map());
  const requestInProgress = useRef(new Map());
  const productCache = useRef(new Map());
  const productRequestMap = useRef(new Map());
  
  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch all products with filtering options
  const fetchProducts = useCallback(async (filters = {}) => {
    // Build query parameters for filtering
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const queryString = queryParams.toString();

    // Generate a unique cache key based only on the actual query parameters
    const cacheKey = `products-${queryString}`;
    
    try {
      
      // Only bypass cache for admin views, keep cache for category pages
      const isAdminView = filters.isActive === 'all';
      const shouldBypassCache = isAdminView;
      
      // Improved caching: category pages now use cache for 5 minutes (300000ms)
      const CACHE_TIMEOUT = 300000; // 5 minutes
      
      // Check for valid cache entry
      const cachedResult = shouldBypassCache ? null : requestCache.current.get(cacheKey);
      const now = Date.now();
      
      if (!shouldBypassCache && cachedResult && (now - cachedResult.timestamp < CACHE_TIMEOUT)) {
        console.log(`Using cached product data for key: ${cacheKey} (age: ${(now - cachedResult.timestamp)/1000}s)`);
        setLoading(false); // Ensure loading state is correct even when using cache
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
      
      console.log(`📦 Fetching products: ${queryString ? queryString : 'all products'}`);
      const response = await axiosInstance.get(`${API_URL}/products?${queryString}`);
      
      // Success log
      console.log(`✅ Products loaded: ${response.data.products?.length || 0} items`);
      
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
      
      // Handle different types of errors
      let errorMessage = "Failed to load products";
      if (err.code === 'ECONNABORTED') {
        errorMessage = "Request timeout. Please check your internet connection.";
      } else if (err.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (err.response?.status === 404) {
        errorMessage = "Products not found.";
      } else if (!navigator.onLine) {
        errorMessage = "No internet connection. Please check your network.";
      }
      
      setError(errorMessage);
      setLoading(false);
      
      // Request is no longer in progress
      requestInProgress.current.delete(cacheKey);
      
      return { products: [] };
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
        return response.data;
      } catch (err) {
        console.error(`Error fetching product ${productId}:`, err);
        
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
      
      const response = await axios.post(
        `${API_URL}/products`, 
        sanitizedData,
        {
          headers: { 
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Clear cache after creating to ensure fresh data on next fetch
      // Find cache keys that start with 'products-' and clear them
      for (const key of requestCache.current.keys()) {
        if (key.startsWith('products-')) {
          requestCache.current.delete(key);
        }
      }
      
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
      
      // Clear cache after updating to ensure fresh data on next fetch
      // Find cache keys that start with 'products-' and clear them
      for (const key of requestCache.current.keys()) {
        if (key.startsWith('products-')) {
          requestCache.current.delete(key);
        }
      }
      
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
      
      // Get auth token
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);
      
      await axios.delete(
        `${API_URL}/products/${productId}`,
        {
          headers: { 
            Authorization: `Bearer ${idToken}`
          }
        }
      );
      
      // Clear cache to ensure fresh data on next fetch
      for (const key of requestCache.current.keys()) {
        if (key.startsWith('products-')) {
          requestCache.current.delete(key);
        }
      }
      
      // Update products list in state to remove the deleted product
      setProducts(prev => prev.filter(product => product._id !== productId));
      
      return true;
    } catch (err) {
      console.error(`Error deleting product ${productId}:`, err);
      setError(err.response?.data?.message || "Failed to delete product");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [API_URL]);
  
  // Context value
  const value = {
    products,
    loading,
    error,
    fetchProducts,
    getProduct,
    createProduct,
    updateProduct,
    updateProductDiscount,
    deleteProduct,
    clearProductCache,
    clearSpecificProductCache
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};

export default ProductContext;





