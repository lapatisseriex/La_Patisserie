import { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext/AuthContext';

const CategoryContext = createContext();

export const useCategory = () => useContext(CategoryContext);

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [specialImagesVersion, setSpecialImagesVersion] = useState(0); // Force refresh trigger
  const { user } = useAuth();
  
  // Cache to prevent redundant API calls
  const requestCache = useRef(new Map());
  const requestInProgress = useRef(new Map());
  
  const API_URL = import.meta.env.VITE_API_URL;
  
  // Set a timeout for cache validity (30 seconds)
  const CACHE_TIMEOUT = 30000;

  // Fetch all categories with caching
  const fetchCategories = useCallback(async (includeInactive = false) => {
    try {
      // Add query params if we need to include inactive categories
      // Use the proper value for isActive parameter: 'all' to include inactive categories
      const queryParams = includeInactive ? '?isActive=all' : '';
      const cacheKey = `categories-${includeInactive ? 'all' : 'active'}`;
      
      // Check if we have a valid cached response
      const cachedResult = requestCache.current.get(cacheKey);
      const now = Date.now();
      
      if (cachedResult && (now - cachedResult.timestamp < 30000)) {
        console.log(`Using cached category data for key: ${cacheKey}`);
        return cachedResult.data;
      }
      
      // Mark this request as in progress
      requestInProgress.current.set(cacheKey, true);
      
      // Set loading state
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/categories${queryParams}`);
      
      // Debug the data received
      console.log(`Categories fetched (includeInactive=${includeInactive}):`, response.data.length);
      
      // Update state with the fetched categories
      setCategories(response.data);
      
      // Store the result in cache with current timestamp
      requestCache.current.set(cacheKey, {
        data: response.data,
        timestamp: now
      });
      
      // Request is no longer in progress
      requestInProgress.current.delete(cacheKey);
      
      setLoading(false);
      return response.data;
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to load categories");
      setLoading(false);
      return [];
    }
  }, [API_URL]);
  
  // Get a single category by ID
  const getCategory = async (categoryId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/categories/${categoryId}`);
      return response.data;
    } catch (err) {
      console.error(`Error fetching category ${categoryId}:`, err);
      setError("Failed to load category");
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Get products for a specific category
  const getCategoryProducts = async (categoryId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/categories/${categoryId}/products`);
      return response.data;
    } catch (err) {
      console.error(`Error fetching products for category ${categoryId}:`, err);
      setError("Failed to load products");
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  // Admin function: Create a new category
  const createCategory = useCallback(async (categoryData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get auth token
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);
      
      const response = await axios.post(
        `${API_URL}/categories`, 
        categoryData,
        {
          headers: { 
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Clear cache to ensure fresh data on next fetch
      for (const key of requestCache.current.keys()) {
        if (key.startsWith('categories-')) {
          requestCache.current.delete(key);
        }
      }
      
      // Update categories in state immediately without making another API call
      setCategories(prev => [...prev, response.data]);
      
      return response.data;
    } catch (err) {
      console.error("Error creating category:", err);
      setError(err.response?.data?.message || "Failed to create category");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [API_URL]);
  
  // Admin function: Update a category
  const updateCategory = useCallback(async (categoryId, categoryData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get auth token
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);
      
      const response = await axios.put(
        `${API_URL}/categories/${categoryId}`, 
        categoryData,
        {
          headers: { 
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Clear cache to ensure fresh data on next fetch
      for (const key of requestCache.current.keys()) {
        if (key.startsWith('categories-')) {
          requestCache.current.delete(key);
        }
      }
      
      // Update categories in state immediately without making another API call
      setCategories(prev => prev.map(cat => 
        cat._id === categoryId ? response.data : cat
      ));
      
      return response.data;
    } catch (err) {
      console.error(`Error updating category ${categoryId}:`, err);
      setError(err.response?.data?.message || "Failed to update category");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [API_URL]);
  
  // Admin function: Delete a category
  const deleteCategory = useCallback(async (categoryId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get auth token
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);
      
      await axios.delete(
        `${API_URL}/categories/${categoryId}`,
        {
          headers: { 
            Authorization: `Bearer ${idToken}`
          }
        }
      );
      
      // Clear cache to ensure fresh data on next fetch
      for (const key of requestCache.current.keys()) {
        if (key.startsWith('categories-')) {
          requestCache.current.delete(key);
        }
      }
      
      // Update categories in state immediately without making another API call
      setCategories(prev => prev.filter(cat => cat._id !== categoryId));
      
      return true;
    } catch (err) {
      console.error(`Error deleting category ${categoryId}:`, err);
      setError(err.response?.data?.message || "Failed to delete category");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [API_URL]);
  
  // Load categories when the context is first mounted to make sure they're available
  useEffect(() => {
    const loadInitialCategories = async () => {
      console.log("Loading initial categories");
      // Always fetch active categories on app load
      await fetchCategories(false);
      
      // If user is admin, also fetch all categories including inactive ones
      if (user?.role === 'admin') {
        console.log("User is admin, fetching all categories");
        await fetchCategories(true);
      }
    };
    
    loadInitialCategories();
  }, [fetchCategories, user?.role]);

  // Admin function: Reprocess category images
  const reprocessCategoryImages = useCallback(async (categoryId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get auth token
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);
      
      const response = await axios.post(
        `${API_URL}/categories/${categoryId}/reprocess-images`,
        {},
        {
          headers: { 
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Clear cache to ensure fresh data on next fetch
      for (const key of requestCache.current.keys()) {
        if (key.startsWith('categories-')) {
          requestCache.current.delete(key);
        }
      }
      
      // Update categories in state immediately without making another API call
      setCategories(prev => prev.map(cat => 
        cat._id === categoryId ? response.data.category : cat
      ));
      
      return response.data;
    } catch (err) {
      console.error(`Error reprocessing images for category ${categoryId}:`, err);
      setError(err.response?.data?.message || "Failed to reprocess category images");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Get special category images (Best Seller and Newly Launched)
  const getSpecialImages = useCallback(async () => {
    try {
      const cacheKey = 'special-images';
      
      // Check if we have a valid cached response
      const cachedResult = requestCache.current.get(cacheKey);
      const now = Date.now();
      
      if (cachedResult && (now - cachedResult.timestamp < CACHE_TIMEOUT)) {
        console.log('Using cached special images data');
        return cachedResult.data;
      }
      
      setError(null);
      
      const response = await axios.get(`${API_URL}/categories/special-images`);
      
      // Store the result in cache with current timestamp
      requestCache.current.set(cacheKey, {
        data: response.data,
        timestamp: now
      });
      
      return response.data;
    } catch (err) {
      console.error("Error fetching special images:", err);
      setError("Failed to load special images");
      return { bestSeller: null, newlyLaunched: null };
    }
  }, [API_URL]);

  // Admin function: Update special category image
  const updateSpecialImage = useCallback(async (type, imageUrl) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get auth token
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);
      
      const response = await axios.put(`${API_URL}/categories/special-image/${type}`, 
        { imageUrl },
        {
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Clear cache for special images to force refresh
      requestCache.current.delete('special-images');
      
      // Force components to refresh special images
      setSpecialImagesVersion(prev => prev + 1);
      
      return response.data;
    } catch (err) {
      console.error(`Error updating ${type} special image:`, err);
      setError(err.response?.data?.message || `Failed to update ${type} image`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Admin function: Delete special category image
  const deleteSpecialImage = useCallback(async (type) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get auth token
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);
      
      const response = await axios.delete(`${API_URL}/categories/special-image/${type}`, 
        {
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Clear cache for special images to force refresh
      requestCache.current.delete('special-images');
      
      // Force components to refresh special images
      setSpecialImagesVersion(prev => prev + 1);
      
      return response.data;
    } catch (err) {
      console.error(`Error deleting ${type} special image:`, err);
      setError(err.response?.data?.message || `Failed to delete ${type} image`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Force refresh special images
  const refreshSpecialImages = useCallback(() => {
    requestCache.current.delete('special-images');
    setSpecialImagesVersion(prev => prev + 1);
  }, []);

  // Context value
  const value = {
    categories,
    loading,
    error,
    specialImagesVersion,
    fetchCategories,
    getCategory,
    getCategoryProducts,
    createCategory,
    updateCategory,
    deleteCategory,
    reprocessCategoryImages,
    getSpecialImages,
    updateSpecialImage,
    deleteSpecialImage,
    refreshSpecialImages
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
};

export default CategoryContext;





