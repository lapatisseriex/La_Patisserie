import { createContext, useState, useContext, useCallback, useEffect } from 'react';
import axios from 'axios';

const DeliveryAvailabilityContext = createContext();

export const useDeliveryAvailability = () => useContext(DeliveryAvailabilityContext);

export const DeliveryAvailabilityProvider = ({ children }) => {
  const [deliveryStatus, setDeliveryStatus] = useState({
    checked: false,
    available: null,
    message: '',
    matchedLocation: null,
    distance: null,
    estimatedTime: null,
    userCoordinates: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [geoLocations, setGeoLocations] = useState([]);
  const [hasAttemptedAutoDetect, setHasAttemptedAutoDetect] = useState(false);
  
  const API_URL = import.meta.env.VITE_API_URL;

  /**
   * Check delivery availability for given coordinates
   * @param {number} lat - User's latitude
   * @param {number} lng - User's longitude
   */
  const checkDeliveryAvailability = useCallback(async (lat, lng) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_URL}/locations/check-delivery`, {
        lat,
        lng
      });
      
      setDeliveryStatus({
        checked: true,
        available: response.data.available,
        message: response.data.message,
        matchedLocation: response.data.matchedLocation,
        distance: response.data.distance,
        estimatedTime: response.data.estimatedTime,
        closestArea: response.data.closestArea,
        userCoordinates: { lat, lng }
      });
      
      return response.data;
    } catch (err) {
      console.error('Error checking delivery availability:', err);
      setError(err.response?.data?.message || 'Failed to check delivery availability');
      setDeliveryStatus(prev => ({
        ...prev,
        checked: true,
        available: false,
        message: 'Unable to verify delivery availability'
      }));
      return null;
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  /**
   * Get user's current location using browser Geolocation API
   * Returns accuracy in meters - if > 1000m, location is IP-based (unreliable)
   */
  const detectUserLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = 'Geolocation is not supported by your browser';
        setError(error);
        reject(new Error(error));
        return;
      }
      
      setLoading(true);
      setError(null);
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          
          console.log('📍 Location detected:', { latitude, longitude, accuracy: `${accuracy}m` });
          
          // Check if accuracy is poor (IP-based location)
          const isAccurate = accuracy < 1000; // Less than 1km is GPS-based
          
          // Check delivery availability with detected coordinates
          const result = await checkDeliveryAvailability(latitude, longitude);
          
          resolve({ 
            lat: latitude, 
            lng: longitude, 
            accuracy, // accuracy in meters
            isAccurate, // true if GPS, false if IP-based
            deliveryResult: result 
          });
        },
        (error) => {
          setLoading(false);
          let errorMessage = 'Unable to detect your location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location permissions.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          
          setError(errorMessage);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true, // VERY IMPORTANT - uses GPS
          timeout: 15000, // 15 seconds
          maximumAge: 0 // Don't use cached location
        }
      );
    });
  }, [checkDeliveryAvailability]);

  /**
   * Set location manually (from Google Places Autocomplete)
   * This is the MOST ACCURATE method - user selects their exact location
   */
  const setManualLocation = useCallback(async (lat, lng, address = '') => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📍 Manual location set:', { lat, lng, address });
      const result = await checkDeliveryAvailability(lat, lng);
      
      // Update delivery status with address info
      setDeliveryStatus(prev => ({
        ...prev,
        manualAddress: address
      }));
      
      return result;
    } catch (err) {
      console.error('Error setting manual location:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [checkDeliveryAvailability]);

  /**
   * Auto-detect user location when app loads
   */
  useEffect(() => {
    // Only attempt once and if not already checked
    if (hasAttemptedAutoDetect || deliveryStatus.checked) {
      return;
    }

    setHasAttemptedAutoDetect(true);

    // Check if geolocation is available
    if (!navigator.geolocation) {
      console.log('Geolocation not supported');
      return;
    }

    // Check permission status first (if available)
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        console.log('Geolocation permission status:', result.state);
        
        if (result.state === 'granted' || result.state === 'prompt') {
          // Permission granted or will prompt - try to get location
          fetchCurrentLocation();
        } else {
          console.log('Geolocation permission denied');
        }
      }).catch(() => {
        // Permissions API not supported, try anyway
        fetchCurrentLocation();
      });
    } else {
      // Permissions API not available, try to get location directly
      fetchCurrentLocation();
    }

    function fetchCurrentLocation() {
      setLoading(true);
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log('Auto-detected current location:', latitude, longitude);
          
          try {
            await checkDeliveryAvailability(latitude, longitude);
          } catch (err) {
            console.log('Auto-detection delivery check failed:', err);
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          setLoading(false);
          console.log('Auto-detection failed:', err.code, err.message);
          
          // Don't use IP-based fallback as it's unreliable (shows Chennai instead of Tirupur)
          // User should manually enter location instead
          console.log('💡 User should manually enter location for accuracy');
        },
        {
          enableHighAccuracy: true, // Use GPS for accurate location
          timeout: 15000, // 15 second timeout
          maximumAge: 0 // Don't use cached location
        }
      );
    }

    // NOTE: IP-based geolocation removed - too unreliable (ISPs route through Chennai)
    // Users on desktop should use manual location entry via Google Places
    
  }, [hasAttemptedAutoDetect, deliveryStatus.checked, checkDeliveryAvailability]);

  /**
   * Fetch all geo-enabled delivery locations
   */
  const fetchGeoLocations = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/locations/geo`);
      setGeoLocations(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching geo locations:', err);
      return [];
    }
  }, [API_URL]);

  /**
   * Reset delivery status
   */
  const resetDeliveryStatus = useCallback(() => {
    setDeliveryStatus({
      checked: false,
      available: null,
      message: '',
      matchedLocation: null,
      distance: null,
      estimatedTime: null,
      userCoordinates: null
    });
    setError(null);
  }, []);

  /**
   * Check if order can proceed based on delivery status
   */
  const canProceedWithOrder = useCallback(() => {
    // If geo-delivery is not checked, allow order (fallback to dropdown selection)
    if (!deliveryStatus.checked) {
      return true;
    }
    return deliveryStatus.available;
  }, [deliveryStatus]);

  const value = {
    deliveryStatus,
    loading,
    error,
    geoLocations,
    hasAttemptedAutoDetect,
    checkDeliveryAvailability,
    detectUserLocation,
    setManualLocation, // For Google Places Autocomplete
    fetchGeoLocations,
    resetDeliveryStatus,
    canProceedWithOrder
  };

  return (
    <DeliveryAvailabilityContext.Provider value={value}>
      {children}
    </DeliveryAvailabilityContext.Provider>
  );
};

export default DeliveryAvailabilityContext;
