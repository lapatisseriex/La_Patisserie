import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

const LocationContext = createContext();

export const useLocation = () => useContext(LocationContext);

export const LocationProvider = ({ children }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, updateUser } = useAuth();
  
  const API_URL = import.meta.env.VITE_API_URL;

  const LOC_CACHE_KEY = 'lp_locations_cache_v1';
  const LOC_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  const readCachedLocations = () => {
    try {
      const raw = localStorage.getItem(LOC_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.timestamp || !Array.isArray(parsed?.data)) return null;
      if (Date.now() - parsed.timestamp > LOC_CACHE_TTL) return null;
      return parsed.data;
    } catch {
      return null;
    }
  };

  const writeCachedLocations = (data) => {
    try {
      localStorage.setItem(LOC_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    } catch {}
  };

  // Fetch all active delivery locations
  const fetchLocations = async () => {
    try {
      // Use cached data immediately to avoid UI flicker
      const cached = readCachedLocations();
      if (cached && cached.length > 0) {
        setLocations(cached);
        setLoading(false);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const response = await axios.get(`${API_URL}/locations`);
      setLocations(response.data);
      writeCachedLocations(response.data);
      
      return response.data;
    } catch (err) {
      console.error("Error fetching locations:", err);
      setError("Failed to load delivery locations");
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Populate user location with full object if it's just an ID
  const populateUserLocation = async () => {
    if (user?.location && typeof user.location === 'string' && locations.length > 0) {
      const locationObj = locations.find(loc => loc._id === user.location);
      if (locationObj && updateUser) {
        console.log("LocationContext - Populating user location object:", locationObj);
        const updatedUser = {
          ...user,
          location: locationObj
        };
        updateUser(updatedUser);
      }
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
      
      if (selectedLocation && updateUser) {
        // Update user object immediately for instant UI feedback
        const updatedUser = {
          ...user,
          location: {
            ...selectedLocation
          }
        };
        
        // Update the user in the auth context immediately
        updateUser(updatedUser);
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
    
    // Handle both object and ID cases
    if (typeof userLocation === 'object' && userLocation.area && userLocation.city) {
      return `${userLocation.area}, ${userLocation.city}`;
    } else if (typeof userLocation === 'string' && locations.length > 0) {
      // If location is stored as ID, find it in locations array
      const locationData = locations.find(loc => loc._id === userLocation);
      if (locationData) {
        return `${locationData.area}, ${locationData.city}`;
      }
    }
    
    return "Location Loading...";
  };
  
  // Check if user has a valid delivery location
  const hasValidDeliveryLocation = () => {
    if (!user || !user.location) return false;
    
    // Handle object location (populated)
    if (typeof user.location === 'object') {
      return !!(user.location.isActive);
    }
    
    // Handle string location (ID only) - need to check against locations array
    if (typeof user.location === 'string' && locations.length > 0) {
      const locationData = locations.find(loc => loc._id === user.location);
      return !!(locationData && locationData.isActive);
    }
    
    return false;
  };

  // Fetch locations on component mount
  useEffect(() => {
    // Prime from cache synchronously
    const cached = readCachedLocations();
    if (cached && cached.length > 0) {
      setLocations(cached);
      setLoading(false);
    }
    // Then fetch fresh in background
    fetchLocations();
  }, []);

  // If user has location as ID but we need populated data, refresh user data
  useEffect(() => {
    if (user && typeof user.location === 'string' && locations.length > 0 && updateUser) {
      console.log('LocationContext: User has location ID, checking if population needed...');
      
      const locationData = locations.find(loc => loc._id === user.location);
      if (locationData) {
        console.log('LocationContext: Populating user location data');
        // Update user with populated location data
        updateUser({
          ...user,
          location: locationData
        });
      }
    }
  }, [user?.location, locations.length, updateUser]);

  const value = {
    locations,
    loading,
    error,
    fetchLocations,
    updateUserLocation,
    populateUserLocation,
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





