import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext/AuthContext';

const LocationContext = createContext();

export const useLocation = () => useContext(LocationContext);

export const LocationProvider = ({ children }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, setUser } = useAuth();
  
  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch all active delivery locations
  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/locations`);
      setLocations(response.data);
      
      return response.data;
    } catch (err) {
      console.error("Error fetching locations:", err);
      setError("Failed to load delivery locations");
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Update user's selected location
  const updateUserLocation = async (locationId) => {
    if (!user) return false;
    
    try {
      // Don't set loading to true for location updates to avoid UI delays
      setError(null);
      
      // Get the location object from our locations array first
      const selectedLocation = locations.find(loc => loc._id === locationId);
      
      if (selectedLocation && setUser) {
        // Update user object immediately for instant UI feedback
        const updatedUser = {
          ...user,
          location: {
            ...selectedLocation
          }
        };
        
        // Update the user in the auth context immediately
        setUser(updatedUser);
        console.log("Location updated in user state:", updatedUser);
      }
      
      // Update backend asynchronously without blocking UI
      const updateBackend = async () => {
        try {
          const { getAuth } = await import('firebase/auth');
          const auth = getAuth();
          const idToken = await auth.currentUser.getIdToken(true);
          
          await axios.put(
            `${API_URL}/users/${user.uid}`,
            { location: locationId },
            { headers: { Authorization: `Bearer ${idToken}` } }
          );
          
          console.log("Backend location update successful");
        } catch (err) {
          console.error("Error updating location in backend:", err);
          // Optionally revert the user state if backend fails
          setError("Failed to update delivery location");
        }
      };
      
      // Start backend update without waiting
      updateBackend();
      
      return true;
    } catch (err) {
      console.error("Error updating location:", err);
      setError("Failed to update delivery location");
      return false;
    }
  };
  
  // Get current selected location name for display
  const getCurrentLocationName = () => {
    if (!user || !user.location) return "Select Location";
    
    const userLocation = user.location;
    return `${userLocation.area}, ${userLocation.city}`;
  };
  
  // Check if user has a valid delivery location
  const hasValidDeliveryLocation = () => {
    return !!(user && user.location && user.location.isActive);
  };

  // Fetch locations on component mount
  useEffect(() => {
    fetchLocations();
  }, []);

  const value = {
    locations,
    loading,
    error,
    fetchLocations,
    updateUserLocation,
    getCurrentLocationName,
    hasValidDeliveryLocation
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export default LocationContext;





