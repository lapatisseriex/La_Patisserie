import { createContext, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext/AuthContext';

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

  // Add a product to recently viewed (for authenticated users)
  const addToRecentlyViewed = useCallback(async (productId) => {
    // Only track for authenticated users
    if (!user) {
      return;
    }

    // Validate product ID format
    if (!productId || !isValidObjectId(productId)) {
      console.error('Invalid product ID format for recently viewed:', productId);
      return;
    }

    try {
      // Get auth token
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);

      await axios.post(
        `${API_URL}/users/recently-viewed/${productId}`,
        {},
        {
          headers: { 
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Optionally refresh the recently viewed list
      await fetchRecentlyViewed();
      
    } catch (err) {
      console.error('Error adding to recently viewed:', err);
      setError(err.response?.data?.message || 'Failed to add to recently viewed');
    }
  }, [API_URL, user]);

  // Fetch user's recently viewed products
  const fetchRecentlyViewed = useCallback(async () => {
    // Only fetch for authenticated users
    if (!user) {
      setRecentlyViewed([]);
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      // Get auth token
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);

      const response = await axios.get(
        `${API_URL}/users/recently-viewed`,
        {
          headers: { 
            Authorization: `Bearer ${idToken}`
          }
        }
      );

      const viewedProducts = response.data.recentlyViewed || [];
      setRecentlyViewed(viewedProducts);
      return viewedProducts;
      
    } catch (err) {
      console.error('Error fetching recently viewed:', err);
      setError(err.response?.data?.message || 'Failed to load recently viewed');
      setRecentlyViewed([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [API_URL, user]);

  // Get recently viewed products from same category as given product
  const getRecentlyViewedByCategory = useCallback(async (categoryId) => {
    const allRecentlyViewed = await fetchRecentlyViewed();
    
    // Filter by category and exclude the current product
    return allRecentlyViewed.filter(item => 
      item.productId && 
      item.productId.category && 
      item.productId.category._id === categoryId
    );
  }, [fetchRecentlyViewed]);

  // Track product view - this is the main function to call when a product is viewed
  const trackProductView = useCallback(async (productId) => {
    if (!productId) return;
    
    await addToRecentlyViewed(productId);
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
