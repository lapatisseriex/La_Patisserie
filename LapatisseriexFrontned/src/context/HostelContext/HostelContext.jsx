import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

const HostelContext = createContext();

export const useHostel = () => useContext(HostelContext);

export const HostelProvider = ({ children }) => {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { user, updateUser } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch hostels for a specific location
  const fetchHostelsByLocation = async (locationId) => {
    if (!locationId) {
      setHostels([]);
      return [];
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/hostels/location/${locationId}`);
      setHostels(response.data);
      
      return response.data;
    } catch (err) {
      console.error("Error fetching hostels:", err);
      setError("Failed to load hostels for this location");
      setHostels([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch a single hostel by ID (for quick lookups) and add to hostels array
  const fetchHostelById = async (hostelId) => {
    if (!hostelId) return null;
    
    // Check if we already have this hostel
    const existingHostel = hostels.find(h => h._id === hostelId);
    if (existingHostel) return existingHostel;
    
    try {
      const response = await axios.get(`${API_URL}/hostels/${hostelId}`);
      const hostelData = response.data;
      
      // Add to hostels array for future lookups
      setHostels(prev => {
        const exists = prev.find(h => h._id === hostelId);
        return exists ? prev : [...prev, hostelData];
      });
      
      return hostelData;
    } catch (err) {
      console.error("Error fetching hostel by ID:", err);
      return null;
    }
  };

  // Populate user hostel with full object if it's just an ID
  const populateUserHostel = async () => {
    if (user?.hostel && typeof user.hostel === 'string') {
      const hostelData = await fetchHostelById(user.hostel);
      if (hostelData && updateUser) {
        console.log("HostelContext - Populating user hostel object:", hostelData);
        const updatedUser = {
          ...user,
          hostel: hostelData
        };
        updateUser(updatedUser);
      }
    }
  };

  // Clear hostels when location changes
  const clearHostels = () => {
    setHostels([]);
    setError(null);
  };

  // Effect to populate user hostel data when needed
  useEffect(() => {
    if (user?.hostel && typeof user.hostel === 'string') {
      console.log('HostelContext: User has hostel ID, fetching data...');
      populateUserHostel();
    }
  }, [user?.hostel]);

  const value = {
    hostels,
    loading,
    error,
    fetchHostelsByLocation,
    fetchHostelById,
    populateUserHostel,
    clearHostels
  };

  return (
    <HostelContext.Provider value={value}>
      {children}
    </HostelContext.Provider>
  );
};

export default HostelContext;





