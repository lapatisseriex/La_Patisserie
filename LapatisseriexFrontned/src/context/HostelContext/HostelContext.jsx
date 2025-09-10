import { createContext, useState, useContext } from 'react';
import axios from 'axios';

const HostelContext = createContext();

export const useHostel = () => useContext(HostelContext);

export const HostelProvider = ({ children }) => {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
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

  // Clear hostels when location changes
  const clearHostels = () => {
    setHostels([]);
    setError(null);
  };

  const value = {
    hostels,
    loading,
    error,
    fetchHostelsByLocation,
    clearHostels
  };

  return (
    <HostelContext.Provider value={value}>
      {children}
    </HostelContext.Provider>
  );
};

export default HostelContext;
