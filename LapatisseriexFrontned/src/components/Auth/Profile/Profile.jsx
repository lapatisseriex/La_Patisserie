import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useSelector } from 'react-redux';
import { useLocation } from '../../../context/LocationContext/LocationContext';
import { useLocation as useRouterLocation } from 'react-router-dom';
import { useHostel } from '../../../context/HostelContext/HostelContext';
import ProfileImageUpload from './ProfileImageUpload';
import LocationAutocomplete from '../../common/LocationAutocomplete';
import axios from 'axios';
import { 
  User, 
  Phone, 
  Calendar, 
  Heart, 
  MapPin, 
  Flag,
  Check,
  ChevronDown,
  Building,
  Edit3,
  Save,
  X,
  Mail,
  Cake,
  MapPinned,
  Shield,
  Award,
  Sparkles,
  Navigation,
  Loader2,
  CheckCircle
} from 'lucide-react';
import EmailVerification from './EmailVerification';
import PhoneVerification from './PhoneVerification';
import { toast } from 'react-hot-toast';

// A portal-based overlay that renders at the document.body level so it always sits on top
const LoadingOverlayPortal = ({ show }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  
  useEffect(() => {
    if (show) {
      setShouldRender(true);
      setTimeout(() => setIsVisible(true), 10);
      console.log('🟢 LoadingOverlayPortal mounted');
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
        console.log('🔴 LoadingOverlayPortal fully unmounted');
      }, 350); // Wait for fade out animation
      return () => clearTimeout(timer);
    }
  }, [show]);

  // Don't render anything if shouldRender is false
  if (!shouldRender) return null;
  if (typeof document === 'undefined') return null;
  
  return ReactDOM.createPortal(
    (
      <div
        className={`fixed inset-0 z-[99999] flex items-center justify-center transition-all duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: isVisible ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          pointerEvents: isVisible ? 'all' : 'none',
          backgroundColor: isVisible ? 'rgba(0, 0, 0, 0.5)' : 'transparent',
          backdropFilter: isVisible ? 'blur(4px)' : 'none'}}
      >
        <div className={`bg-white rounded-lg shadow-2xl p-8 w-full max-w-sm mx-4 transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`} style={{ 
          textAlign: 'center',
          backgroundColor: '#ffffff',
          position: 'relative',
          zIndex: 1000000
        }}>
          <div className="flex flex-col items-center justify-center space-y-4 text-center w-full">
            {/* Animated Spinner with inline fallbacks */}
            <div className="relative mx-auto" style={{ width: 64, height: 64 }}>
              <div
                className="rounded-full"
                style={{ width: 64, height: 64, border: '4px solid #e5e7eb' }}
              />
              <div
                className="rounded-full animate-spin"
                style={{
                  width: 64,
                  height: 64,
                  border: '4px solid #000',
                  borderTopColor: 'transparent',
                  position: 'absolute',
                  top: 0,
                  left: 0}}
              />
            </div>
            {/* Loading Text */}
            <div className="text-center w-full">
              <h3
                className="text-xl font-bold text-black mb-2 text-center"
                style={{ textAlign: 'center' }}
              >
                Updating Your Profile
              </h3>
              <p
                className="text-gray-600 text-sm text-center"
                style={{ textAlign: 'center' }}
              >
                Please wait while we save your changes...
              </p>
            </div>
            {/* Animated Dots */}
            <div className="flex space-x-2 justify-center mx-auto" style={{ justifyContent: 'center' }}>
              <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms', width: 8, height: 8 }} />
              <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms', width: 8, height: 8 }} />
              <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms', width: 8, height: 8 }} />
            </div>
          </div>
        </div>
      </div>
    ),
    document.body
  );
};

const Profile = ({ onDirtyChange }) => {
  const { user, updateProfile, authError, loading, isNewUser, updateUser, getCurrentUser } = useAuth();
  const { locations, loading: locationsLoading, fetchLocations } = useLocation();
  const { hostels, loading: hostelsLoading, fetchHostelsByLocation, clearHostels } = useHostel();
  const routerLocation = useRouterLocation();
  const currentUser = useSelector(state => state.auth.user);
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isEditMode, setIsEditMode] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // Local saving state for more control
  const savingRef = useRef(false); // Ref to track saving state across re-renders
  const baselineRef = useRef(null); // Baseline snapshot for dirty tracking
  const [isDirty, setIsDirty] = useState(false);
  
  // Location detection states
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState(''); // 'detecting', 'success', 'error'
  const [detectedAddress, setDetectedAddress] = useState('');
  
  // Common CSS classes for form fields
  const inputClasses = `w-full pl-10 pr-4 py-3 border border-gray-300 rounded-none 
    focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-300
    hover:border-gray-400 focus:shadow-md ${!isEditMode ? 'bg-gray-50 text-gray-700' : 'animate-fadeIn'}`;
  
  const selectClasses = `w-full pl-10 pr-8 py-3 border border-gray-300 rounded-none 
    focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-300
    hover:border-gray-400 focus:shadow-md appearance-none ${!isEditMode ? 'bg-gray-50 text-gray-700' : 'animate-fadeIn'}`;
  
  // Initialize form with expanded user data
  // Helper function to create initial form data (also useful when adding new fields in the future)
  const createInitialFormData = (userData = {}, savedData = {}) => {
    // Log the input data for debugging
    console.log('Creating initial form data with:');
    console.log('User data (from Redux - source of truth):', userData);
    console.log('Saved data (from localStorage - for form fields only):', savedData);

    // Extract IDs from userData if they are objects
    // userData is from Redux and is the source of truth for location/hostel/userAddress
    const userLocationId = userData.location === null ? '' : 
      (typeof userData.location === 'object' ? userData.location?._id || '' : userData.location || '');
    const userHostelId = userData.hostel === null ? '' :
      (typeof userData.hostel === 'object' ? userData.hostel?._id || '' : userData.hostel || '');
    const userAddressData = userData.userAddress === null ? null : (userData.userAddress || null);

    console.log('Extracted user location ID:', userLocationId, 'from:', userData.location);
    console.log('Extracted user hostel ID:', userHostelId, 'from:', userData.hostel);
    console.log('Extracted user address:', userAddressData);

    const result = {
      // Personal information - savedData can provide fallbacks for form-only fields
      name: savedData.name || userData.name || '',
      phone: userData.phone || '',  // Phone cannot be changed
      email: savedData.email || userData.email || '',
      dob: savedData.dob || (userData.dob ? formatDate(userData.dob) : ''),
      gender: savedData.gender || userData.gender || '',
      anniversary: savedData.anniversary || (userData.anniversary ? formatDate(userData.anniversary) : ''),

      // Location information - Redux user data is source of truth (including null/empty)
      country: savedData.country || userData.country || 'India',
      location: userLocationId, // Use Redux value directly (empty string if null/cleared)
      hostel: userHostelId, // Use Redux value directly (empty string if null/cleared)
      userAddress: userAddressData, // Use Redux value directly (null if cleared)
    };

    console.log('Final hostel data (should be ID):', result.hostel, 'type:', typeof result.hostel);
    console.log('Final location data (should be ID):', result.location, 'type:', typeof result.location);

    return result;
  };

  // Format date helper function (moved here for clarity)
  const formatDate = (dateValue) => {
    if (!dateValue) return '';
    try {
      const date = new Date(dateValue);
      return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : '';
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Get saved user data from localStorage
  const savedUserData = JSON.parse(localStorage.getItem('savedUserData') || '{}');
  
    // Log for debugging
    console.log('Profile component initializing with:');
    console.log('User data:', user);
    console.log('Saved user data:', savedUserData);
    console.log('Hostel persistence check - savedUserData.hostel:', savedUserData.hostel, 'type:', typeof savedUserData.hostel);
  
  // Initialize form data with user and saved data
  const [formData, setFormData] = useState(createInitialFormData(user, savedUserData));
  
  // Fetch locations only once on mount
  const hasRunLocationsFetch = useRef(false);

  // Cleanup: Re-enable scrolling when component unmounts or isSaving changes
  useEffect(() => {
    // Cleanup function to ensure scrolling is re-enabled
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Additional cleanup when isSaving changes to false
  useEffect(() => {
    if (!isSaving) {
      document.body.style.overflow = 'auto';
    }
  }, [isSaving]);

  // Effect to react to user state changes (especially phone verification)
  useEffect(() => {
    if (user) {
      console.log('Profile - User state change detected:', {
        phoneVerified: user.phoneVerified,
        phoneVerifiedAt: user.phoneVerifiedAt,
        phone: user.phone,
        userUid: user.uid,
        location: user.location,
        hostel: user.hostel,
        userAddress: user.userAddress
      });
      
      // Re-read savedUserData from localStorage to get latest values
      const latestSavedData = JSON.parse(localStorage.getItem('savedUserData') || '{}');
      
      // Update form data with latest user state to reflect any changes
      // This is particularly important for phone verification status AND location changes
      const updatedFormData = createInitialFormData(user, latestSavedData);
      setFormData(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(updatedFormData)) {
          console.log('Profile - Updating form data due to user state change');
          return updatedFormData;
        }
        return prev;
      });
    }
  }, [user?.phoneVerified, user?.phoneVerifiedAt, user?.phone, user?.uid, user?.name, user?.email, user?.location, user?.hostel, user?.userAddress]);
  
  useEffect(() => {
    if (!hasRunLocationsFetch.current) {
      fetchLocations().then(result => {
        // Just fetch locations, don't auto-set first location
        // User intentionally cleared location should stay cleared
        hasRunLocationsFetch.current = true;
      });
    }
  }, []);

  // Fetch hostels on mount if location exists (for display in read-only view)
  useEffect(() => {
    if (formData.location && hostels.length === 0 && !hostelsLoading && !isEditMode) {
      console.log('Fetching hostels on profile load - location already selected:', formData.location);
      fetchHostelsByLocation(formData.location).catch(error => {
        console.error('Error fetching hostels on profile load:', error);
      });
    }
  }, []); // Only run once on mount

  // Fetch hostels when location changes
  useEffect(() => {
    if (formData.location) {
      console.log('Fetching hostels for location:', formData.location);
      fetchHostelsByLocation(formData.location).then(hostelsData => {
        console.log('Fetched hostels:', hostelsData);
        if (formData.hostel && hostelsData.length > 0) {
          // Check if current hostel exists in the fetched data
          const currentHostelExists = hostelsData.find(h => h._id === formData.hostel);
          if (!currentHostelExists) {
            console.log('Current hostel not found in fetched data, clearing selection');
            setFormData(prev => ({
              ...prev,
              hostel: ''
            }));
          } else {
            console.log('Current hostel verified:', formData.hostel);
          }
        }
      }).catch(error => {
        console.error('Error fetching hostels:', error);
      });
    } else {
      clearHostels();
      setFormData(prev => ({
        ...prev,
        hostel: ''
      }));
    }
  }, [formData.location]);

  // Fetch hostels when entering edit mode if location is already selected
  // This ensures fresh data from context even if hostel was previously selected
  useEffect(() => {
    if (isEditMode && formData.location && !hostelsLoading) {
      console.log('Entering edit mode - ensuring hostels are fetched for location:', formData.location);
      fetchHostelsByLocation(formData.location).then(hostelsData => {
        console.log('Fresh hostels fetched for edit mode:', hostelsData);
        if (formData.hostel && hostelsData.length > 0) {
          const currentHostelExists = hostelsData.find(h => h._id === formData.hostel);
          if (!currentHostelExists) {
            console.log('Saved hostel not found in fresh data, it will be cleared if location changes');
            // Don't clear here, let the user handle it if they change location
          } else {
            console.log('Saved hostel verified in fresh data:', formData.hostel);
          }
        }
      }).catch(error => {
        console.error('Error fetching fresh hostels for edit mode:', error);
      });
    }
  }, [isEditMode, formData.location]);

  // Format today's date for max value in date inputs
  const today = new Date().toISOString().split('T')[0];
  
  // Always editable; no need to restore edit mode from localStorage
  useEffect(() => {
    try {
      const savedFormData = localStorage.getItem('profileFormData');
      if (savedFormData) {
        const parsedFormData = JSON.parse(savedFormData);
        setFormData(prev => ({ ...prev, ...parsedFormData }));
      }
    } catch (error) {
      console.error('Error recovering form data:', error);
    }
  }, []);

  // Clear local error when authError changes
  useEffect(() => {
    if (authError) {
      // Removed: setLocalError(authError); - Unnecessary network error display
      setSuccessMessage('');
    } else {
      setLocalError('');
    }
  }, [authError]);
  
  // Debug helper to verify form data
  useEffect(() => {
    console.log('CURRENT FORM DATA STATE:', {
      ...formData,
      isEditMode
    });
    
  console.log('Anniversary date field:', formData.anniversary);
  // Email field logging removed
    
    try {
      const savedFormData = localStorage.getItem('profileFormData');
      if (savedFormData) {
        const parsed = JSON.parse(savedFormData);
        console.log('LOCALSTORAGE profileFormData:', {
          ...parsed,
          anniversary: parsed.anniversary || 'NOT SET'
        });
      }
    } catch (err) {
      console.error('Error checking localStorage:', err);
    }
  }, [formData, isEditMode]);

  // Cleanup effect on unmount (just clear persisted form snapshot)
  useEffect(() => {
    return () => {
      localStorage.removeItem('profileFormData');
      console.log('Profile component cleanup: cleared persisted form data');
    };
  }, []);
  
  // useEffect to handle user state changes (like phone verification)
  useEffect(() => {
    console.log('Profile - User state changed, updating form data:', {
      uid: user?.uid,
      phoneVerified: user?.phoneVerified,
      phone: user?.phone,
      phoneVerifiedAt: user?.phoneVerifiedAt
    });
    
    // Update form data when user verification status changes
    if (user) {
      setFormData(prevFormData => ({
        ...prevFormData,
        phone: user.phone || prevFormData.phone,
        // Keep other fields as they were
      }));
    }
  }, [user?.phoneVerified, user?.phone, user?.phoneVerifiedAt]);

  // useEffect to sync form data with user data
  const userDataInitialized = useRef(false);
  
  useEffect(() => {
    const fetchFreshUserData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.data.success) {
            localStorage.setItem('cachedUser', JSON.stringify(response.data.user));
            console.log('Fetched fresh user data from server:', response.data.user);
            localStorage.removeItem('profileFormData');
          }
        }
      } catch (error) {
        console.error('Error fetching fresh user data:', error);
      }
    };
    
    if (!userDataInitialized.current) {
      fetchFreshUserData();
    }
    
    if (user) {
      const currentLocationId = typeof user.location === 'object' ? user.location?._id : user.location;
      const currentHostelId = typeof user.hostel === 'object' ? user.hostel?._id : user.hostel;
      
      // COMPREHENSIVE DATA RECOVERY: Try all possible sources for profile data
      // First, get cached user data from localStorage
      let cachedUserData = {};
      try {
        const cachedUser = localStorage.getItem('cachedUser');
        if (cachedUser) {
          cachedUserData = JSON.parse(cachedUser) || {};
        }
      } catch (error) {
        console.error('Error parsing cached user data:', error);
        cachedUserData = {};
      }
      
      // Then, check for saved form data (has highest priority)
      let savedFormData = {};
      try {
        const profileFormData = localStorage.getItem('profileFormData');
        if (profileFormData) {
          savedFormData = JSON.parse(profileFormData) || {};
          console.log('Recovered saved form data:', savedFormData);
        }
      } catch (error) {
        console.error('Error recovering form data from localStorage:', error);
        savedFormData = {};
      }
      
      // Now use our helper function to create the initial form data with proper precedence:
      // savedFormData > cachedUserData > user object from backend
      
      // First merge cachedUserData with the user object
      const mergedUserData = {
        ...user,
        ...cachedUserData,
        // Keep the nested objects properly formatted
        location: currentLocationId || '',
        hostel: currentHostelId || ''};
      
      // Then create the form data with proper precedence
      const initialFormData = createInitialFormData(mergedUserData, savedFormData);
      console.log('Setting initial form data:', initialFormData);
      
      // Update form data state
      setFormData(initialFormData);
      // Initialize dirty baseline
      baselineRef.current = {
        name: initialFormData.name || '',
        gender: initialFormData.gender || '',
        dob: initialFormData.dob || '',
        anniversary: initialFormData.anniversary || '',
        country: initialFormData.country || 'India',
        location: initialFormData.location || '',
        hostel: initialFormData.hostel || '',
        userAddress: JSON.stringify(initialFormData.userAddress || {})
      };
      setIsDirty(false);
      if (onDirtyChange) onDirtyChange(false);
      
      // If user already has a location saved, show "Detected" status
      if (initialFormData.location) {
        setDetectionStatus('success');
      }
      
      // Save the complete form data to localStorage for refresh protection
      const dataToCache = {
        ...initialFormData
      };
      localStorage.setItem('profileFormData', JSON.stringify(dataToCache));
      
      console.log('Form data initialized completely with all fields preserved');
      
      userDataInitialized.current = true;
    }
  }, [user]);

  // Haversine formula to calculate distance between two points
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Find matching admin location based on coordinates
  const findMatchingLocation = useCallback((userLat, userLng) => {
    if (!locations || locations.length === 0) return null;
    
    for (const location of locations) {
      if (location.coordinates?.lat && location.coordinates?.lng) {
        const distance = calculateDistance(
          userLat, 
          userLng, 
          location.coordinates.lat, 
          location.coordinates.lng
        );
        const radiusKm = location.deliveryRadiusKm || 5;
        if (distance <= radiusKm) {
          return location;
        }
      }
    }
    return null;
  }, [locations, calculateDistance]);

  // Detect user's location using GPS
  const detectUserLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocalError('Geolocation is not supported by your browser');
      return;
    }

    setIsDetectingLocation(true);
    setDetectionStatus('detecting');
    setDetectedAddress('');
    setLocalError('');

    // Check permission status first (for Firefox/Edge/Brave compatibility)
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
        console.log('Geolocation permission status:', permissionStatus.state);
        
        if (permissionStatus.state === 'denied') {
          setLocalError('Location blocked. Click the lock icon 🔒 in address bar to enable.');
          setDetectionStatus('error');
          setIsDetectingLocation(false);
          setTimeout(() => setLocalError(''), 5000);
          return;
        }
      } catch (permErr) {
        console.log('Permissions API not fully supported, continuing...');
      }
    }

    // Helper function to get position with specific options
    // Uses watchPosition as fallback for better cross-browser support (Firefox, Edge, Brave)
    const getPosition = (options) => {
      return new Promise((resolve, reject) => {
        // First try getCurrentPosition
        const timeoutId = setTimeout(() => {
          // If getCurrentPosition is slow, try watchPosition (works better in Firefox/Edge)
          console.log('getCurrentPosition slow, trying watchPosition...');
          const watchId = navigator.geolocation.watchPosition(
            (pos) => {
              navigator.geolocation.clearWatch(watchId);
              resolve(pos);
            },
            (err) => {
              navigator.geolocation.clearWatch(watchId);
              reject(err);
            },
            { ...options, timeout: options.timeout / 2 }
          );
        }, options.timeout / 2);

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            clearTimeout(timeoutId);
            resolve(pos);
          },
          (err) => {
            clearTimeout(timeoutId);
            reject(err);
          },
          options
        );
      });
    };

    try {
      let position;
      
      // Try with lower accuracy first for faster response (works better cross-browser)
      try {
        console.log('Attempting location detection...');
        position = await getPosition({
          enableHighAccuracy: false, // Start with network-based (faster, more compatible)
          timeout: 20000,
          maximumAge: 120000
        });
        console.log('Network-based location obtained');
      } catch (lowAccuracyError) {
        console.log('Network location failed, trying GPS...', lowAccuracyError.message);
        // Try high accuracy as fallback
        position = await getPosition({
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 60000
        });
      }

      const { latitude, longitude } = position.coords;

      // Reverse geocode to get address
      if (window.google && window.google.maps) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
          if (status === 'OK' && results[0]) {
            setDetectedAddress(results[0].formatted_address);
          }
        });
      }

      // Find matching admin location
      const matchedLocation = findMatchingLocation(latitude, longitude);

      if (matchedLocation) {
        // Check if the detected location is same as current - don't change anything
        if (formData.location === matchedLocation._id) {
          setDetectionStatus('success');
          setSuccessMessage(`Location confirmed: ${matchedLocation.name}`);
          setTimeout(() => setSuccessMessage(''), 3000);
          // Don't change hostel or anything else - keep existing selection
        } else {
          // Different location detected - update form
          setFormData(prev => ({
            ...prev,
            location: matchedLocation._id,
            hostel: '' // Only reset hostel when location actually changes
          }));
          
          // Fetch hostels for this new location
          if (fetchHostelsByLocation) {
            fetchHostelsByLocation(matchedLocation._id);
          }
          
          // Auto-save the detected location to backend (silently, without redirect)
          try {
            const authToken = localStorage.getItem('authToken');
            await fetch(`${import.meta.env.VITE_API_URL}/users/${user.uid}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
              },
              body: JSON.stringify({
                location: matchedLocation._id,
                hostel: null,
                userAddress: null
              })
            });
            
            // Update Redux store immediately (without triggering any redirects)
            if (updateUser) {
              updateUser({
                ...user,
                location: matchedLocation,
                hostel: null,
                userAddress: null
              });
            }
            
            setDetectionStatus('success');
            setSuccessMessage(`Location saved: ${matchedLocation.name || matchedLocation.area}. Now select your hostel.`);
            setTimeout(() => setSuccessMessage(''), 4000);
          } catch (saveError) {
            console.error('Error saving location:', saveError);
            setDetectionStatus('success');
            setSuccessMessage(`Location detected: ${matchedLocation.name || matchedLocation.area}. Click Save to apply.`);
            setTimeout(() => setSuccessMessage(''), 3000);
          }
        }
      } else {
        setDetectionStatus('error');
        setLocalError('No delivery zone found for your location. Please select manually.');
        setTimeout(() => setLocalError(''), 4000);
      }
    } catch (error) {
      console.error('Geolocation error:', error);
      setDetectionStatus('error');
      
      // Detect browser for better error messages
      const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
      const isEdge = navigator.userAgent.toLowerCase().includes('edg');
      const isBrave = navigator.brave !== undefined;
      
      let errorMsg = 'Failed to detect location.';
      
      if (error.code === 1) {
        if (isFirefox) {
          errorMsg = 'Location blocked. Click 🔒 → Permissions → Allow Location.';
        } else if (isEdge) {
          errorMsg = 'Location blocked. Click 🔒 → Site permissions → Allow.';
        } else if (isBrave) {
          errorMsg = 'Location blocked. Click 🔒 and check Brave Shields.';
        } else {
          errorMsg = 'Location permission denied. Click 🔒 to enable.';
        }
      } else if (error.code === 2) {
        errorMsg = 'Location unavailable. Check device location settings.';
      } else if (error.code === 3) {
        errorMsg = 'Location timed out. Enable location services and retry.';
      }
      
      setLocalError(errorMsg);
      setTimeout(() => setLocalError(''), 6000);
    } finally {
      setIsDetectingLocation(false);
    }
  }, [findMatchingLocation, fetchHostelsByLocation, formData.location, updateUser, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for date fields to ensure proper formatting
    let processedValue = value;
    
    if ((name === 'dob' || name === 'anniversary') && value) {
      // Ensure date fields are properly formatted as strings
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          processedValue = date.toISOString().split('T')[0];
          console.log(`Formatted ${name} date:`, processedValue);
        }
      } catch (err) {
        console.error(`Error formatting ${name}:`, err);
      }
    }
    
    // Update form data
    setFormData({
      ...formData,
      [name]: processedValue
    });
    
    if (name === 'location') {
      setFormData(prev => ({
        ...prev,
        location: processedValue,
        hostel: ''
      }));
    }
    
    // Persist partial changes for dates
    if (name === 'anniversary' || name === 'dob') {
      const currentData = {
        ...formData,
        [name]: processedValue
      };
      localStorage.setItem('profileFormData', JSON.stringify(currentData));
      console.log(`Updated ${name} in localStorage:`, processedValue);
    }

    // Dirty tracking vs baseline
    if (baselineRef.current) {
      const comparable = {
        name: name === 'name' ? processedValue : formData.name,
        gender: name === 'gender' ? processedValue : formData.gender,
        dob: name === 'dob' ? processedValue : formData.dob,
        anniversary: name === 'anniversary' ? processedValue : formData.anniversary,
        country: name === 'country' ? processedValue : formData.country,
        location: name === 'location' ? processedValue : formData.location,
        hostel: name === 'hostel' ? processedValue : formData.hostel,
        userAddress: JSON.stringify(formData.userAddress || {})
      };
      const dirtyNow = JSON.stringify(comparable) !== JSON.stringify(baselineRef.current);
      if (dirtyNow !== isDirty) {
        setIsDirty(dirtyNow);
        if (onDirtyChange) onDirtyChange(dirtyNow);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // IMMEDIATELY scroll to top so user can see loading
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // Then lock scroll at top
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    
    if (!formData.name.trim()) {
      setLocalError('Please enter your full name');
      document.body.style.overflow = 'auto';
      document.body.style.height = '';
      return;
    }
    
    setLocalError('');
    setSuccessMessage('');
    
    // Set both state and ref to prevent re-render issues
    console.log('🔄 Starting save - Setting isSaving to TRUE');
    savingRef.current = true;
    setIsSaving(true);
    
    // Force a small delay to ensure state updates and loading shows
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Create a clean copy of form data with date fields properly formatted
    const profileData = { 
      ...formData,
      // Ensure date fields are properly formatted
      dob: typeof formData.dob === 'string' ? formData.dob : formatDate(formData.dob),
      anniversary: typeof formData.anniversary === 'string' ? formData.anniversary : formatDate(formData.anniversary),
      // Include phone verification data if user has verified phone
      ...(user?.phoneVerified && {
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        phoneVerifiedAt: user.phoneVerifiedAt
      })
    };
    
    // Save complete form data to localStorage for refresh protection
    const formDataToSave = {
      ...profileData
    };
    
    // Log the data being saved
    console.log('Saving complete form data with anniversary:', formDataToSave.anniversary);
    localStorage.setItem('profileFormData', JSON.stringify(formDataToSave));
    
    console.log('Submitting profile data (email omitted from update):', { ...profileData, email: undefined });
    console.log('Gender being submitted:', profileData.gender);
    console.log('Hostel data being submitted:', profileData.hostel, 'type:', typeof profileData.hostel);
    
    try {
      // Check if this is the admin's profile
      const isAdmin = user?.role === 'admin';
      console.log('Is admin user:', isAdmin);
      
      // Fetch latest user data to ensure we have current phone verification status
      console.log('Fetching latest user data before save to include phone verification...');
      await getCurrentUser();
      
      // Merge form data with any verified phone data from backend
      const finalProfileData = {
        ...profileData,
        ...(currentUser?.phoneVerified && {
          phone: currentUser.phone,
          phoneVerified: currentUser.phoneVerified,
          phoneVerifiedAt: currentUser.phoneVerifiedAt
        })
      };
      
      // Omit email from update payload
      const { email, ...profileDataWithoutEmail } = finalProfileData;
      const success = await updateProfile(profileDataWithoutEmail);

      if (success) {
        // Keep loading for minimum 3 seconds so user can see it
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('✅ Profile saved successfully - showing success message');
        
        // Re-enable scrolling first
        document.body.style.overflow = 'auto';
        document.body.style.height = '';
        
        // Now turn off loading flags synchronously
        savingRef.current = false;
        setIsSaving(false);
        
        // Set success message after a delay to ensure loading is fully hidden
        setTimeout(() => {
          setSuccessMessage('Profile updated successfully!');
        }, 400);
        // Wait a moment to show success, then exit edit mode and scroll to bottom
        setTimeout(() => {
          // Update baseline after successful save for dirty tracking
          baselineRef.current = {
            name: formData.name || '',
            gender: formData.gender || '',
            dob: typeof formData.dob === 'string' ? formData.dob : formatDate(formData.dob),
            anniversary: typeof formData.anniversary === 'string' ? formData.anniversary : formatDate(formData.anniversary),
            country: formData.country || 'India',
            location: formData.location || '',
            hostel: formData.hostel || '',
            userAddress: JSON.stringify(formData.userAddress || {})
          };
          setIsDirty(false);
          if (onDirtyChange) onDirtyChange(false);
        }, 2500); // Keep success message visible before clearing dirty state

        // Save user data to localStorage
        const savedUserData = JSON.parse(localStorage.getItem('savedUserData') || '{}');
        // Update or clear location data - use null for empty values
        savedUserData.location = formData.location || null;
        savedUserData.hostel = formData.hostel || null;
        savedUserData.anniversary = formData.anniversary;
        savedUserData.userAddress = formData.userAddress || null; // Save or clear user's precise sublocation
        localStorage.setItem('savedUserData', JSON.stringify(savedUserData));
        console.log('Permanently saved location, hostel, and userAddress to savedUserData:', savedUserData.location, savedUserData.hostel, savedUserData.userAddress);

        // Update cached user data - also clear location/hostel if removed
        const cachedUser = JSON.parse(localStorage.getItem('cachedUser') || '{}');
        cachedUser.anniversary = formData.anniversary || cachedUser.anniversary || '';
        cachedUser.location = formData.location || null;
        cachedUser.hostel = formData.hostel || null;
        cachedUser.userAddress = formData.userAddress || null;
        localStorage.setItem('cachedUser', JSON.stringify(cachedUser));
        
        console.log('Successfully updated profile, cleared/updated location in cache');
        
        // CRITICAL: Refresh Redux user state from backend to sync all components (Header, etc.)
        try {
          console.log('🔄 Refreshing Redux user state from backend...');
          await getCurrentUser();
          console.log('✅ Redux user state refreshed');
        } catch (refreshErr) {
          console.error('Error refreshing user state:', refreshErr);
        }
        
        // For admin users, refresh user data from server
        if (isAdmin) {
          try {
            const token = localStorage.getItem('authToken');
            if (token) {
              const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              if (response.data.success) {
                localStorage.setItem('cachedUser', JSON.stringify(response.data.user));
                console.log('Admin refreshed own user data from server:', response.data.user);
              }
            }
          } catch (error) {
            console.error('Error refreshing admin user data:', error);
          }
        }
      } else {
        // Keep loading for minimum 3 seconds, then show error
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Re-enable scrolling first
        document.body.style.overflow = 'auto';
        document.body.style.height = '';
        
        // Turn off loading flags
        savingRef.current = false;
        setIsSaving(false);
        
        // Set error message after delay to ensure loading is fully hidden
        setTimeout(() => {
          setLocalError('Failed to update profile. Please try again.');
        }, 400);
        
        // Scroll to error message
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 450);
      }
    } catch (error) {
      console.error('Error in profile update:', error);
      
      // Keep loading for minimum 3 seconds, then show error
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Re-enable scrolling first
      document.body.style.overflow = 'auto';
      document.body.style.height = '';
      
      // Turn off loading flags
      savingRef.current = false;
      setIsSaving(false);
      
      // Set error message after delay to ensure loading is fully hidden
      setTimeout(() => {
        setLocalError('Failed to update profile. Please try again.');
      }, 400);
      
      // Scroll to error message
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 450);
    } finally {
      // Final safety check to ensure scrolling is re-enabled and loading is stopped
      savingRef.current = false;
      document.body.style.overflow = 'auto';
      document.body.style.height = '';
    }
  };

  const handleCancel = () => {
    // Revert form to original baseline snapshot if available
    if (baselineRef.current) {
      setFormData({ ...baselineRef.current });
    } else if (user) {
      // Fallback: reconstruct from user
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
        dob: formatDate(user.dob) || '',
        gender: user.gender || '',
        anniversary: formatDate(user.anniversary) || '',
        country: user.country || 'India',
        location: typeof user.location === 'object' ? user.location?._id || '' : user.location || '',
        hostel: typeof user.hostel === 'object' ? user.hostel?._id || '' : user.hostel || ''
      });
    }
    // Reset dirty state and notify parent so buttons disappear
    setIsDirty(false);
    if (onDirtyChange) onDirtyChange(false);
    setLocalError('');
    setSuccessMessage('');
    toast('Changes discarded.', {
      icon: '↩️',
      duration: 3000
    });
  };

  const handleEditProfile = () => { /* no-op: always editable */ };





  // Show a loading spinner when the page is initially loading (before user data is fetched)
  if (loading && !user) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex flex-col items-center justify-center min-h-[300px]">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 right-0 bottom-0 left-0 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute top-1 right-1 bottom-1 left-1 border-4 border-gray-200 border-b-transparent rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
        </div>
        <p className="mt-4 text-gray-500 font-medium">Loading your profile...</p>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section - Elegant Dessert Shop Style */}
      <div className="relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, #FFF5F0 0%, #FFFFFF 50%, #FFF5F0 100%)',
        borderBottom: '1px solid rgba(115, 56, 87, 0.1)'
      }}>
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 opacity-[0.03]" style={{
          background: 'radial-gradient(circle, #733857 0%, transparent 70%)'}}></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 opacity-[0.03]" style={{
          background: 'radial-gradient(circle, #8d4466 0%, transparent 70%)'}}></div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 lg:gap-8">
            {/* Profile Image - Elegant Frame */}
            <div className="relative flex-shrink-0">
              <div className="relative group">
                {/* Decorative corner accents */}
                <div className="absolute -top-2 -left-2 w-16 h-16 border-l-2 border-t-2 opacity-20 transition-opacity duration-300 group-hover:opacity-40" style={{borderColor: '#733857'}}></div>
                <div className="absolute -bottom-2 -right-2 w-16 h-16 border-r-2 border-b-2 opacity-20 transition-opacity duration-300 group-hover:opacity-40" style={{borderColor: '#733857'}}></div>
                
                <div className="relative">
                  <ProfileImageUpload isEditMode={true} />
                </div>
              </div>
            </div>
            
            {/* User Info - Center on mobile, left on desktop */}
            <div className="flex-1 text-center sm:text-left">
              <div className="mb-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight mb-1" style={{
                  color: '#281c20',
                  letterSpacing: '0.01em'
                }}>
                  {formData.name || 'Welcome Back'}
                </h1>
                <p className="text-xs sm:text-sm" style={{
                  color: 'rgba(40, 28, 32, 0.6)',
                  letterSpacing: '0.03em'
                }}>
                  Manage your sweet preferences & delivery details
                </p>
              </div>
              
              {/* Quick Stats - Elegant Pills */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm transition-all duration-300 hover:shadow-sm" style={{
                  backgroundColor: 'rgba(115, 56, 87, 0.05)',
                  border: '1px solid rgba(115, 56, 87, 0.1)',
                  borderRadius: '20px',
                  color: '#733857'}}>
                  <MapPinned className="h-3 w-3 sm:h-4 sm:w-4" strokeWidth={1.5} />
                  <span className="font-medium">
                    {formData.location 
                      ? locations.find(loc => loc._id === formData.location)?.area || 'Location Set'
                      : 'Set Location'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm transition-all duration-300 hover:shadow-sm" style={{
                  backgroundColor: 'rgba(190, 24, 93, 0.05)',
                  border: '1px solid rgba(190, 24, 93, 0.1)',
                  borderRadius: '20px',
                  color: '#BE185D'}}>
                  <Cake className="h-3 w-3 sm:h-4 sm:w-4" strokeWidth={1.5} />
                  <span className="font-medium">
                    {formData.dob 
                      ? new Date(formData.dob).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric'
                        })
                      : 'Add Birthday'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Edit Button - Refined Style */}
            {!isEditMode && (
              <button
                onClick={handleEditProfile}
                className="group relative px-6 sm:px-8 py-2.5 sm:py-3 overflow-hidden transition-all duration-300 hover:shadow-lg"
                style={{
                  backgroundColor: '#733857',
                  color: 'white',
                  border: '1px solid rgba(115, 56, 87, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#5a2b43';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#733857';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span className="relative flex items-center gap-2 font-medium text-sm">
                  <Edit3 className="h-4 w-4" strokeWidth={2} />
                  Edit Profile
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Main content container - Elegant spacing */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-10 relative overflow-x-hidden" style={{
        background: 'linear-gradient(to bottom, #FDFBF9 0%, #FFFFFF 100%)'
      }}>

      <form 
        onSubmit={handleSubmit} 
        className="profile-form-mobile space-y-4 sm:space-y-6 md:space-y-8 pb-20 md:pb-6 overflow-x-hidden max-w-full"
        onFocus={(e) => {
          // Prevent any scroll when form elements get focus
          if (savingRef.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        {/* Loading Overlay via Portal (always above everything) */}
        <LoadingOverlayPortal show={isSaving || savingRef.current} />
        
        {/* Success Message - Fixed Position below header */}
        {successMessage && !isSaving && (
          <div className="fixed top-[70px] md:top-[130px] left-1/2 transform -translate-x-1/2 z-[9998] w-full max-w-md px-4 animate-slideDown">
            <div className="bg-white border border-green-500 shadow-lg p-4">
              <div className="flex items-center gap-3">
                {/* Success Icon */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 flex items-center justify-center">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                </div>
                {/* Success Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {successMessage}
                  </p>
                </div>
                {/* Close Button */}
                <button
                  onClick={() => setSuccessMessage('')}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Error Message - High-Visibility Banner */}
        {localError && !isSaving && (
          <div className="fixed top-0 left-0 right-0 z-[9998] px-4 sm:px-6 lg:px-8 py-4 shadow-lg animate-slideDown">
            <div className="max-w-3xl mx-auto">
              <div className="relative overflow-hidden rounded-xl border-2 bg-gradient-to-r from-red-600 via-red-500 to-red-600">
                {/* Decorative sheen */}
                <div className="absolute inset-0 opacity-20" style={{background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), transparent 70%)'}}></div>
                <div className="relative flex items-start gap-4 p-5 sm:p-6">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center ring-4 ring-white/30 bg-white/10 backdrop-blur-sm">
                      <X className="h-8 w-8 text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl sm:text-2xl font-bold tracking-wide mb-1" style={{ letterSpacing: '0.03em', color: '#ffffff'}}>
                      Something went wrong
                    </h3>
                    <p className="text-sm sm:text-base font-medium leading-relaxed" style={{ color: 'rgba(255,255,255,0.92)'}}>
                      {localError}
                    </p>
                  </div>
                  <button
                    onClick={() => setLocalError('')}
                    className="ml-2 flex-shrink-0 text-white/80 hover:text-white transition-colors"
                    aria-label="Dismiss error"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                {/* Bottom accent bar */}
                <div className="h-1 w-full bg-gradient-to-r from-red-300 via-white/60 to-red-300"></div>
              </div>
            </div>
          </div>
        )}

        {/* Personal Information Section - Refined Dessert Shop Style */}
        <div className="bg-white overflow-hidden transition-all duration-300 hover:shadow-lg" style={{
          border: '1px solid rgba(115, 56, 87, 0.12)',
          boxShadow: '0 2px 8px rgba(115, 56, 87, 0.04)'
        }}>
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b" style={{
            background: 'linear-gradient(135deg, rgba(115, 56, 87, 0.03) 0%, rgba(115, 56, 87, 0.01) 100%)',
            borderColor: 'rgba(115, 56, 87, 0.08)'
          }}>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 sm:h-10 sm:w-10 bg-white flex items-center justify-center transition-transform duration-300 hover:scale-110" style={{
                border: '1px solid rgba(115, 56, 87, 0.15)',
                boxShadow: '0 2px 4px rgba(115, 56, 87, 0.08)'
              }}>
                <User className="h-4 w-4 sm:h-5 sm:w-5" style={{color: '#733857'}} strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold" style={{
                  color: '#733857',
                  letterSpacing: '0.01em'
                }}>Personal Information</h2>
                <p className="text-xs sm:text-sm" style={{
                  color: 'rgba(115, 56, 87, 0.6)'}}>Your basic details</p>
              </div>
            </div>
          </div>
          
          <div className="p-3 sm:p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6" style={{
            background: 'linear-gradient(to bottom, #FEFEFE 0%, #FCFCFC 100%)'
          }}>
            {/* Name Field */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-semibold flex items-center gap-2" style={{
                color: '#733857',
                letterSpacing: '0.02em'
              }}>
                <User className="h-3 w-3 sm:h-4 sm:w-4" style={{color: 'rgba(115, 56, 87, 0.6)'}} strokeWidth={1.5} />
                Full Name <span style={{color: '#733857'}}>*</span>
              </label>
              <div className="relative group">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  readOnly={false}
                  disabled={isSaving}
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border transition-all duration-300 outline-none border-gray-300 focus:border-[#733857] bg-white shadow-sm focus:shadow-md text-black`}
                  style={{
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>

            {/* Gender Field */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-semibold flex items-center gap-2" style={{
                color: '#733857',
                letterSpacing: '0.02em'
              }}>
                <User className="h-3 w-3 sm:h-4 sm:w-4" style={{color: 'rgba(115, 56, 87, 0.6)'}} strokeWidth={1.5} />
                Gender <span style={{color: '#733857'}}>*</span>
              </label>
              <div className="relative">
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  disabled={isSaving}
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border transition-all duration-300 outline-none appearance-none border-gray-300 focus:border-[#733857] bg-white shadow-sm focus:shadow-md text-black`}
                  style={{
                    borderRadius: '4px'
                  }}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <ChevronDown className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 pointer-events-none" strokeWidth={1.5} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Verification Section - Refined Style */}
        <div className="bg-white overflow-hidden transition-all duration-300 hover:shadow-lg" style={{
          border: '1px solid rgba(115, 56, 87, 0.12)',
          boxShadow: '0 2px 8px rgba(115, 56, 87, 0.04)'
        }}>
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b" style={{
            background: 'linear-gradient(135deg, rgba(115, 56, 87, 0.03) 0%, rgba(115, 56, 87, 0.01) 100%)',
            borderColor: 'rgba(115, 56, 87, 0.08)'
          }}>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 sm:h-10 sm:w-10 bg-white flex items-center justify-center transition-transform duration-300 hover:scale-110" style={{
                border: '1px solid rgba(115, 56, 87, 0.15)',
                boxShadow: '0 2px 4px rgba(115, 56, 87, 0.08)'
              }}>
                <Shield className="h-4 w-4 sm:h-5 sm:w-5" style={{color: '#733857'}} strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold" style={{
                  color: '#733857',
                  letterSpacing: '0.01em'
                }}>Verification & Security</h2>
                <p className="text-xs sm:text-sm" style={{
                  color: 'rgba(115, 56, 87, 0.6)'}}>Verify your contact details</p>
              </div>
            </div>
          </div>
          
          <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 md:space-y-6 max-w-full overflow-hidden" style={{
            background: 'linear-gradient(to bottom, #FEFEFE 0%, #FCFCFC 100%)'
          }}>
            {/* Email verification section */}
            <EmailVerification lockEmail={true} />
            
            {/* Phone verification section */}
            <PhoneVerification 
              key={`phone-${user?.phoneVerified}-${user?.phoneVerifiedAt}`}
              lockPhone={false}
              onVerificationSuccess={() => {
                console.log('Phone verified and saved automatically - staying in view mode');
                // Don't enter edit mode - phone is already saved
                setLocalError('');
                setSuccessMessage('Phone verified and saved successfully!');
                // Always-edit mode: do not toggle edit mode
              }}
            />
          </div>
        </div>
        
        {/* Special Dates Section - Elegant Pink Theme */}
        <div className="bg-white overflow-hidden transition-all duration-300 hover:shadow-lg" style={{
          border: '1px solid rgba(190, 24, 93, 0.15)',
          boxShadow: '0 2px 8px rgba(190, 24, 93, 0.06)'
        }}>
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b" style={{
            background: 'linear-gradient(135deg, rgba(255, 241, 242, 0.6) 0%, rgba(255, 251, 252, 0.4) 100%)',
            borderColor: 'rgba(190, 24, 93, 0.12)'
          }}>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 sm:h-10 sm:w-10 bg-white flex items-center justify-center transition-transform duration-300 hover:scale-110" style={{
                border: '1px solid rgba(190, 24, 93, 0.2)',
                boxShadow: '0 2px 4px rgba(190, 24, 93, 0.1)'
              }}>
                <Cake className="h-4 w-4 sm:h-5 sm:w-5" style={{color: '#BE185D'}} strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold" style={{
                  color: '#BE185D',
                  letterSpacing: '0.01em'
                }}>Special Dates</h2>
                <p className="text-xs sm:text-sm" style={{
                  color: 'rgba(159, 18, 57, 0.7)'}}>Get special treats on your special days!</p>
              </div>
            </div>
          </div>
          
          <div className="p-3 sm:p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6" style={{
            background: 'linear-gradient(to bottom, rgba(255, 251, 252, 0.3) 0%, #FFFFFF 100%)'
          }}>
            {/* Date of Birth Field */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-semibold flex items-center gap-2" style={{
                color: '#BE185D',
                letterSpacing: '0.02em'
              }}>
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" style={{color: '#EC4899'}} strokeWidth={1.5} />
                Date of Birth <span style={{color: '#BE185D'}}>*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  max={today}
                  readOnly={!isEditMode}
                  disabled={isSaving}
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border transition-all duration-300 outline-none ${
                    isEditMode 
                      ? 'border-pink-300 focus:border-pink-600 bg-white shadow-sm focus:shadow-md' 
                      : 'border-pink-200 bg-pink-50'
                  } ${!isEditMode ? 'text-gray-700' : 'text-black'}`}
                  style={{
                    borderRadius: '4px'
                  }}
                />
              </div>
              <p className="text-[10px] sm:text-xs" style={{
                color: '#9F1239'}}>
                We'll send you special birthday treats!
              </p>
            </div>

            {/* Date of Anniversary Field */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-semibold flex items-center gap-2" style={{
                color: '#BE185D',
                letterSpacing: '0.02em'
              }}>
                <Heart className="h-3 w-3 sm:h-4 sm:w-4" style={{color: '#EC4899'}} strokeWidth={1.5} />
                Anniversary Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="anniversary"
                  value={formData.anniversary}
                  onChange={handleChange}
                  max={today}
                  readOnly={!isEditMode}
                  disabled={isSaving}
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border transition-all duration-300 outline-none ${
                    isEditMode 
                      ? 'border-pink-300 focus:border-pink-600 bg-white shadow-sm focus:shadow-md' 
                      : 'border-pink-200 bg-pink-50'
                  } ${!isEditMode ? 'text-gray-700' : 'text-black'}`}
                  style={{
                    borderRadius: '4px'
                  }}
                />
              </div>
              <p className="text-[10px] sm:text-xs" style={{
                color: '#9F1239'}}>
                Celebrate with special anniversary offers!
              </p>
            </div>
          </div>
        </div>

        {/* Delivery Information Section - Elegant Chocolate Theme */}
        <div className="bg-white transition-all duration-300 hover:shadow-lg" style={{
          border: '1px solid rgba(107, 68, 35, 0.15)',
          boxShadow: '0 2px 8px rgba(107, 68, 35, 0.06)'
        }}>
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b" style={{
            background: 'linear-gradient(135deg, rgba(245, 243, 240, 0.6) 0%, rgba(250, 250, 249, 0.4) 100%)',
            borderColor: 'rgba(107, 68, 35, 0.12)'
          }}>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 sm:h-10 sm:w-10 bg-white flex items-center justify-center transition-transform duration-300 hover:scale-110" style={{
                border: '1px solid rgba(107, 68, 35, 0.2)',
                boxShadow: '0 2px 4px rgba(107, 68, 35, 0.1)'
              }}>
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5" style={{color: '#6B4423'}} strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold" style={{
                  color: '#6B4423',
                  letterSpacing: '0.01em'
                }}>Delivery Information</h2>
                <p className="text-xs sm:text-sm" style={{
                  color: 'rgba(139, 115, 85, 0.8)'}}>Where should we deliver your treats?</p>
              </div>
            </div>
          </div>
          
          <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 md:space-y-6" style={{
            background: 'linear-gradient(to bottom, rgba(250, 250, 249, 0.3) 0%, #FFFFFF 100%)'
          }}>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
              {/* Delivery Location with Autocomplete */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold flex items-center gap-2" style={{color: '#6B4423'}}>
                    <MapPinned className="h-4 w-4" style={{color: '#8B7355'}} />
                    Delivery Location <span style={{color: '#6B4423'}}>*</span>
                  </label>
                  {isEditMode && (
                    <button
                      type="button"
                      onClick={detectUserLocation}
                      disabled={isDetectingLocation || isSaving}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] md:text-xs font-medium border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ 
                        color: detectionStatus === 'success' ? '#16a34a' : '#6B4423', 
                        borderColor: detectionStatus === 'success' ? '#16a34a' : '#8B7355',
                        background: 'transparent'
                      }}
                    >
                      {isDetectingLocation ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span className="hidden sm:inline">Detecting</span>
                        </>
                      ) : detectionStatus === 'success' ? (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          <span className="hidden sm:inline">Detected</span>
                        </>
                      ) : (
                        <>
                          <Navigation className="h-3 w-3" />
                          <span className="hidden sm:inline">Detect</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                {detectedAddress && detectionStatus === 'success' && (
                  <p className="text-xs mt-1" style={{ color: '#6B4423' }}>
                    📍 {detectedAddress}
                  </p>
                )}
                {isEditMode ? (
                  <LocationAutocomplete
                    locations={locations}
                    selectedLocationId={formData.location}
                    currentUserAddress={formData.userAddress}
                    onLocationSelect={(locationId, locationObj, userAddressData) => {
                      setFormData(prev => ({
                        ...prev,
                        location: locationId || '', // Allow empty string for clearing
                        userAddress: userAddressData || null, // Store user's precise sublocation or null
                        hostel: '' // Reset hostel when location changes
                      }));
                      
                      // Reset detection status when location is cleared or changed manually
                      if (!locationId) {
                        setDetectionStatus(''); // Reset to show "Detect Location" button
                        setDetectedAddress('');
                      } else {
                        setDetectionStatus('success'); // Show as detected when manually selected
                      }
                      
                      // Update dirty tracking when location changes (including clearing)
                      if (baselineRef.current) {
                        const comparable = {
                          name: formData.name,
                          gender: formData.gender,
                          dob: formData.dob,
                          anniversary: formData.anniversary,
                          country: formData.country,
                          location: locationId || '',
                          hostel: '',
                          userAddress: JSON.stringify(userAddressData || {})
                        };
                        const dirtyNow = JSON.stringify(comparable) !== JSON.stringify(baselineRef.current);
                        setIsDirty(dirtyNow);
                        if (onDirtyChange) onDirtyChange(dirtyNow);
                      } else {
                        // If no baseline, mark as dirty for any change (including clearing)
                        setIsDirty(true);
                        if (onDirtyChange) onDirtyChange(true);
                      }
                    }}
                    disabled={isSaving || locationsLoading}
                    placeholder="Search your delivery area (e.g., SITRA, Peelamedu, Coimbatore)..."
                  />
                ) : (
                  <div className={`w-full px-4 py-3 border ${!formData.location && !formData.userAddress?.fullAddress ? 'bg-amber-50 border-amber-300' : 'bg-stone-50'} text-gray-700`} style={{ borderColor: !formData.location && !formData.userAddress?.fullAddress ? undefined : '#8B7355'}}>
                    {(() => {
                      // Show user's precise address if available, otherwise admin location
                      if (formData.userAddress?.fullAddress) {
                        return formData.userAddress.fullAddress;
                      }
                      if (!formData.location) {
                        return (
                          <span className="text-amber-700 flex items-center gap-2">
                            <span>📍</span>
                            <span>Please select your delivery location to continue</span>
                          </span>
                        );
                      }
                      const loc = locations.find(l => l._id === formData.location);
                      return loc ? `${loc.area}, ${loc.city} - ${loc.pincode}` : 'Loading...';
                    })()}
                  </div>
                )}
              </div>

              {/* Country Field */}
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2" style={{color: '#6B4423'}}>
                  <Flag className="h-4 w-4" style={{color: '#8B7355'}} />
                  Country <span style={{color: '#6B4423'}}>*</span>
                </label>
                <div className="relative">
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    disabled={loading || !isEditMode}
                    className={`w-full px-4 py-3 border ${
                      isEditMode 
                        ? 'bg-white focus:border-black' 
                        : 'bg-stone-50'
                    } focus:ring-2 transition-all duration-300 outline-none appearance-none ${
                      !isEditMode ? 'text-gray-700' : 'text-black'
                    }`}
                    style={{ borderColor: '#8B7355', '--tw-ring-color': '#6B4423'}}
                  >
                    <option value="India">India</option>
                    <option value="USA">USA</option>
                    <option value="UK">UK</option>
                    <option value="Canada">Canada</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{color: '#8B7355'}} />
                </div>
              </div>
            </div>

            {/* Hostel Selection */}
            {formData.location && (
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2" style={{color: '#6B4423'}}>
                  <Building className="h-4 w-4" style={{color: '#8B7355'}} />
                  Hostel/Residence
    
                </label>
                <div className="relative">
                  {!isEditMode ? (
                    <div className={`w-full px-4 py-3 border ${!formData.hostel ? 'bg-amber-50 border-amber-300' : 'bg-stone-50'} text-gray-700`} style={{ borderColor: !formData.hostel ? undefined : '#8B7355'}}>
                      {(() => {
                        if (!formData.hostel) {
                          return (
                            <span className="text-amber-700 flex items-center gap-2">
                              <span>🏠</span>
                              <span>Select a hostel for faster delivery</span>
                            </span>
                          );
                        }
                        if (user?.hostel && typeof user.hostel === 'object' && user.hostel._id === formData.hostel) {
                          return `${user.hostel.name || 'Unknown Hostel'}`;
                        }
                        if (hostels && hostels.length > 0) {
                          const hostelObj = hostels.find(h => h._id === formData.hostel);
                          if (hostelObj) return hostelObj.name;
                        }
                        return 'Loading hostel details...';
                      })()}
                    </div>
                  ) : (
                    <>
                      <select
                        name="hostel"
                        value={formData.hostel || ''}
                        onChange={handleChange}
                        disabled={isSaving || hostelsLoading}
                        className={`w-full px-4 py-3 border bg-white focus:border-black focus:ring-2 transition-all duration-300 outline-none appearance-none text-black`}
                        style={{ borderColor: '#8B7355', '--tw-ring-color': '#6B4423'}}
                      >
                        <option value="">🏠 Select your hostel/residence</option>
                        {hostels && hostels.length > 0 ? (
                          hostels.map(hostel => (
                            <option key={hostel._id} value={hostel._id}>
                              {hostel.name}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>
                            {hostelsLoading ? '⏳ Loading hostels...' : '📍 No hostels listed for this area'}
                          </option>
                        )}
                      </select>
                      {hostels && hostels.length > 0 && !formData.hostel && (
                        <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                          <span>💡</span>
                          <span>Not a hostel resident? No worries! Select any nearby hostel to enjoy our delicious treats! 🍰</span>
                        </p>
                      )}
                    </>
                  )}
                  {isEditMode && (
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 pointer-events-none" style={{color: '#8B7355'}} />
                  )}
                </div>
                <p className="text-xs" style={{color: '#8B7355'}}>
                  🎓 Students & residents get priority delivery! Everyone is welcome to select a hostel near you 💜
                </p>
              </div>
            )}
          </div>
        </div>

  {/* Spacer to avoid content being hidden by fixed bar */}
  {isDirty && (<div className="h-24" />)}

  {/* Action Buttons - Fixed Bottom Bar (only when form is dirty) */}
        {isDirty && (
          <div className="profile-save-buttons fixed bottom-0 left-0 right-0 z-[200] px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-white/95 backdrop-blur border-t" style={{
            borderColor: 'rgba(115, 56, 87, 0.18)',
            boxShadow: '0 -4px 16px rgba(115, 56, 87, 0.12)'
          }}>
            <div className="flex items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex-1 px-4 sm:px-6 py-3 sm:py-4 border-2 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                style={{
                  borderColor: 'rgba(115, 56, 87, 0.3)',
                  color: '#733857',
                  borderRadius: '4px'
                }}
                onMouseEnter={(e) => {
                  if (!isSaving) {
                    e.currentTarget.style.borderColor = '#733857';
                    e.currentTarget.style.backgroundColor = 'rgba(115, 56, 87, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(115, 56, 87, 0.3)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  <X className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} />
                  Cancel
                </span>
              </button>
              <button
                type="submit"
                disabled={isSaving || !formData.name.trim()}
                onFocus={(e) => {
                  // Prevent scroll when button gets focus
                  const scrollY = window.scrollY;
                  setTimeout(() => window.scrollTo(0, scrollY), 0);
                }}
                className="flex-1 relative px-6 sm:px-8 py-3 sm:py-4 text-white overflow-hidden transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                style={{
                  backgroundColor: '#733857',
                  borderRadius: '4px',
                  boxShadow: '0 4px 12px rgba(115, 56, 87, 0.25)'
                }}
                onMouseEnter={(e) => {
                  if (!isSaving && formData.name.trim()) {
                    e.currentTarget.style.backgroundColor = '#5a2b43';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(115, 56, 87, 0.35)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#733857';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(115, 56, 87, 0.25)';
                }}
              >
                <span className={`relative flex items-center justify-center gap-2 transition-opacity duration-300 ${isSaving ? 'opacity-0' : 'opacity-100'}`}>
                  <Save className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} />
                  Save Profile
                </span>
                {isSaving && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs sm:text-sm font-semibold">Saving...</span>
                    </div>
                  </div>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
      </div>
    </>
  );
};

export default Profile;


