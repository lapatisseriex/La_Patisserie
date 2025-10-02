import React, { createContext, useState, useContext, useCallback, useRef } from 'react';
import axios from 'axios';
import axiosInstance from '../../utils/axiosConfig';
import { useAuth } from '../AuthContext/AuthContextRedux';

const RecentlyViewedContext = createContext();

export const useRecentlyViewed = () => useContext(RecentlyViewedContext);

export const RecentlyViewedProvider = ({ children }) => {
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  
  const API_URL = import.meta.env.VITE_API_URL;

  // Validate MongoDB ObjectId format
  const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

  // Cache management for recently viewed products
  const recentlyViewedCacheKey = useCallback(() => {
    return user ? `recently_viewed_${user.uid}` : null;
  }, [user]);
  
  const getFromCache = useCallback(() => {
    if (!user) return null;
    try {
      const cached = localStorage.getItem(recentlyViewedCacheKey());
      if (cached) {
        const parsed = JSON.parse(cached);
        // Check if cache is still valid (5 minutes)
        if (parsed.timestamp && Date.now() - parsed.timestamp < 5 * 60 * 1000) {
          return parsed.data;
        }
      }
    } catch (err) {
      console.error('Error reading from cache:', err);
    }
    return null;
  }, [user, recentlyViewedCacheKey]);
  
  const saveToCache = useCallback((data) => {
    if (!user) return;
    try {
      localStorage.setItem(recentlyViewedCacheKey(), JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.error('Error writing to cache:', err);
    }
  }, [user, recentlyViewedCacheKey]);

  // Throttling mechanism
  const lastTrackedRef = useRef({});
  const fetchPromiseRef = useRef(null);

  // Variables to hold functions that will be defined later
  const fetchRecentlyViewedRef = useRef(null);
  
  // Add a product to recently viewed (for authenticated users)
  const addToRecentlyViewed = useCallback(async (productId, productObj = null) => {
    // Only track for authenticated users
    if (!user) {
      return;
    }

    // Validate product ID format
    if (!productId || !isValidObjectId(productId)) {
      console.error('Invalid product ID format for recently viewed:', productId);
      return;
    }
    
    // Throttle API calls - only track each product once every 5 minutes
    const now = Date.now();
    const lastTracked = lastTrackedRef.current[productId] || 0;
    if (now - lastTracked < 5 * 60 * 1000) {
      console.log('Skipping recently viewed tracking (throttled):', productId);
      return;
    }
    
    // Update tracking timestamp
    lastTrackedRef.current[productId] = now;
    try {
      // Get auth token
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      
      // Check if user is still authenticated
      if (!auth.currentUser) {
        console.warn('User is not authenticated, cannot add to recently viewed');
        return;
      }
      
      const idToken = await auth.currentUser.getIdToken(true);

      if (productObj) {
        const entry = {
          productId: productObj,
          viewedAt: new Date().toISOString()
        };

        let updatedList = null;
        setRecentlyViewed(prev => {
          const filtered = prev.filter(item =>
            item.productId && item.productId._id !== productId
          );

          const next = [entry, ...filtered].slice(0, 3);
          updatedList = next;
          return next;
        });

        if (updatedList) {
          saveToCache(updatedList);
        }
      }

      // Send API request in the background
      // Use non-blocking call to prevent this from affecting the main UI
      axiosInstance.post(
        `${API_URL}/users/recently-viewed/${productId}`,
        {},
        {
          headers: { 
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000 // Short timeout for background operation
        }
      ).catch(err => {
        // Silently handle error - this is a non-critical operation
        console.error('Background operation failed (recently viewed):', err.message);
      });
      
    } catch (err) {
      console.error('Error adding to recently viewed:', err);
      // Don't set error state for authentication issues, just log them
      if (err.message && !err.message.includes('auth')) {
        setError(err.response?.data?.message || 'Failed to add to recently viewed');
      }
    }
  }, [API_URL, user, saveToCache, setError]);


  
  // Fetch user's recently viewed products with caching
  const fetchRecentlyViewed = useCallback(async (forceFresh = false) => {
    if (!user) {
      setRecentlyViewed([]);
      return [];
    }

    if (!forceFresh) {
      const cached = getFromCache();
      if (cached) {
        setRecentlyViewed(cached);
        return cached;
      }

      if (fetchPromiseRef.current) {
        return fetchPromiseRef.current;
      }
    }

    const requestPromise = (async () => {
      try {
        setLoading(true);
        setError(null);

        let idToken;
        try {
          const { getAuth } = await import('firebase/auth');
          const auth = getAuth();
  
          if (!auth.currentUser) {
            console.warn('User is not authenticated, cannot fetch recently viewed');
            setRecentlyViewed([]);
            return [];
          }
  
          idToken = await Promise.race([
            auth.currentUser.getIdToken(true),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Auth token request timeout')), 5000))
          ]);
        } catch (authError) {
          console.error('Authentication error (non-critical):', authError.message);
          // Fallback to cached data if available
          const cached = getFromCache();
          if (cached) {
            setRecentlyViewed(cached);
            return cached;
          }
          setRecentlyViewed([]);
          return [];
        }

        const response = await axiosInstance.get(
          `${API_URL}/users/recently-viewed`,
          {
            headers: {
              Authorization: `Bearer ${idToken}`
            },
            validateStatus: status => (status >= 200 && status < 300) || status === 304,
            timeout: 5000 // Short timeout for background operation
          }
        );

        const viewedProducts = response.status === 304
          ? getFromCache() || []
          : response.data.recentlyViewed || [];
        setRecentlyViewed(viewedProducts);
        saveToCache(viewedProducts);
        return viewedProducts;
      } catch (err) {
        console.error('Error fetching recently viewed:', err);
        if (err.message && !err.message.includes('auth')) {
          setError(err.response?.data?.message || 'Failed to load recently viewed');
        }

        const cached = getFromCache();
        if (cached) {
          setRecentlyViewed(cached);
          return cached;
        }

        setRecentlyViewed([]);
        return [];
      } finally {
        if (fetchPromiseRef.current === requestPromise) {
          fetchPromiseRef.current = null;
        }
        setLoading(false);
      }
    })();

    fetchPromiseRef.current = requestPromise;
    return requestPromise;
  }, [API_URL, user, getFromCache, saveToCache, setRecentlyViewed, setLoading, setError]);

  // Store the fetchRecentlyViewed function in the ref so it can be called from addToRecentlyViewed
  React.useEffect(() => {
    fetchRecentlyViewedRef.current = fetchRecentlyViewed;
  }, [fetchRecentlyViewed]);

  // Get recently viewed products from same category as given product
  const getRecentlyViewedByCategory = useCallback(async (categoryId) => {
    // Use the function from the ref to avoid circular dependency
    const allRecentlyViewed = fetchRecentlyViewedRef.current ? 
      await fetchRecentlyViewedRef.current() : [];
    
    // Filter by category and exclude the current product
    return allRecentlyViewed.filter(item => 
      item.productId && 
      item.productId.category && 
      item.productId.category._id === categoryId
    );
  }, []);

  // Track product view - this is the main function to call when a product is viewed
  const trackProductView = useCallback(async (productId, productObj = null) => {
    if (!productId) return;
    
    // Add to recently viewed with immediate state update
    await addToRecentlyViewed(productId, productObj);
  }, [addToRecentlyViewed]);

  // Context value
  const value = {
    recentlyViewed,
    loading,
    error,
    fetchRecentlyViewed,
    addToRecentlyViewed,
    getRecentlyViewedByCategory,
    trackProductView
  };

  return (
    <RecentlyViewedContext.Provider value={value}>
      {children}
    </RecentlyViewedContext.Provider>
  );
};

export default RecentlyViewedContext;
