import { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext/AuthContext';

const ProductContext = createContext();

export const useProduct = () => useContext(ProductContext);

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  
  // Cache to prevent redundant API calls
  const requestCache = useRef(new Map());
  const requestInProgress = useRef(new Map());
  
  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch all products with filtering options
  const fetchProducts = useCallback(async (filters = {}) => {
    try {
      // Build query parameters for filtering
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      const queryString = queryParams.toString();
      
      // Generate a unique cache key that includes a timestamp to avoid stale data
      // For admin views (checking for isActive=all), we'll always bypass cache
      const isAdminView = filters.isActive === 'all';
      const cacheKey = `products-${queryString}-${isAdminView ? Date.now() : ''}`;
      
      // For admin view, always get fresh data
      const cachedResult = isAdminView ? null : requestCache.current.get(cacheKey);
      const now = Date.now();
      
      if (!isAdminView && cachedResult && (now - cachedResult.timestamp < 15000)) {
        console.log(`Using cached product data for key: ${cacheKey}`);
        return cachedResult.data;
      }
      
      // Mark this request as in progress
      requestInProgress.current.set(cacheKey, true);
      
      // Set loading state
      setLoading(true);
      setError(null);
      
      console.log(`Fetching products from API: ${API_URL}/products?${queryString}`);
      const response = await axios.get(`${API_URL}/products?${queryString}`);
      
      // Debug the response
      console.log(`Products API response status: ${response.status}`);
      console.log(`Products fetched: ${response.data.products?.length || 0}`);
      
      if (response.data && response.data.products) {
        // Update the state
        setProducts(response.data.products);
      } else {
        console.error('Invalid product data format:', response.data);
      }
      
      // Store the result in cache
      requestCache.current.set(cacheKey, {
        data: response.data,
        timestamp: now
      });
      
      // Request is no longer in progress
      requestInProgress.current.delete(cacheKey);
      
      setLoading(false);
      return response.data;
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products");
      setLoading(false);
      return { products: [] };
    }
  }, [API_URL]);
  
  // Get a single product by ID
  const getProduct = async (productId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/products/${productId}`);
      return response.data;
    } catch (err) {
      console.error(`Error fetching product ${productId}:`, err);
      setError("Failed to load product");
      return null;
    } finally {
      setLoading(false);
    }
  };
  
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
    deleteProduct
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};

export default ProductContext;
