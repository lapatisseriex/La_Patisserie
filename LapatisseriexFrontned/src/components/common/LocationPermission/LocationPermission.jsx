import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, Navigation, X, Loader2, CheckCircle, AlertCircle, MapPinOff } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useLocation as useLocationContext } from '../../../context/LocationContext/LocationContext';

/**
 * LocationPermission Component
 * 
 * A modal/banner that asks for user's geolocation permission on page load.
 * Once allowed, it accurately detects the user's live location using the Geolocation API.
 * Works on HTTPS only (which is required for production).
 * 
 * Features:
 * - Asks for location permission on first visit
 * - Uses high accuracy GPS for precise location
 * - Matches user's coordinates to available delivery zones using Haversine formula
 * - Saves user's location preference
 * - Remembers user's choice (don't ask again)
 */

const PERMISSION_STORAGE_KEY = 'lp_location_permission_asked';
const LOCATION_CACHE_KEY = 'lp_user_geolocation';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Props:
 * - isOpen: boolean (optional) - externally control modal visibility
 * - onClose: function (optional) - callback when modal closes
 * - showTriggerButton: boolean (optional) - show a floating button to trigger detection
 */
const LocationPermission = ({ isOpen: externalIsOpen, onClose, showTriggerButton = true }) => {
  const { user, updateProfile } = useAuth();
  const { locations, updateUserLocation } = useLocationContext();
  
  const [showModal, setShowModal] = useState(false);
  const [permissionState, setPermissionState] = useState('prompt'); // 'prompt' | 'granted' | 'denied' | 'unsupported'
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null); // { success, location, error, userCoords }
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  
  const hasCheckedRef = useRef(false);
  const watchIdRef = useRef(null);

  // Handle external isOpen prop
  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setShowModal(externalIsOpen);
      if (externalIsOpen) {
        setDetectionResult(null); // Reset when opening
      }
    }
  }, [externalIsOpen]);

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @returns distance in kilometers
   */
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  /**
   * Find the closest matching delivery zone for given coordinates
   */
  const findMatchingLocation = useCallback((userLat, userLng) => {
    if (!locations || locations.length === 0) {
      return { matched: false, error: 'No delivery locations available' };
    }

    let matchedLocation = null;
    let closestDistance = Infinity;

    for (const loc of locations) {
      // Skip locations without coordinates
      if (!loc.coordinates?.lat || !loc.coordinates?.lng) {
        continue;
      }

      const distance = calculateDistance(
        userLat,
        userLng,
        loc.coordinates.lat,
        loc.coordinates.lng
      );

      const radiusKm = loc.deliveryRadiusKm || 5; // Default 5km radius

      console.log(`📏 Distance to ${loc.area}: ${distance.toFixed(2)}km (radius: ${radiusKm}km)`);

      // Check if user is within this location's delivery radius
      if (distance <= radiusKm && distance < closestDistance) {
        matchedLocation = loc;
        closestDistance = distance;
      }
    }

    if (matchedLocation) {
      return {
        matched: true,
        location: matchedLocation,
        distance: closestDistance.toFixed(2)
      };
    }

    return {
      matched: false,
      error: 'Your location is outside our delivery zones',
      closestLocation: locations[0] // Suggest closest zone
    };
  }, [locations]);

  /**
   * Reverse geocode coordinates to get human-readable address using Google Maps API
   */
  const reverseGeocode = async (lat, lng) => {
    try {
      // Check if Google Maps is loaded
      if (window.google && window.google.maps && window.google.maps.Geocoder) {
        const geocoder = new window.google.maps.Geocoder();
        const result = await new Promise((resolve, reject) => {
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results[0]) {
              resolve(results[0].formatted_address);
            } else {
              reject(new Error('Geocoding failed'));
            }
          });
        });
        return result;
      }
      return null;
    } catch (err) {
      console.error('Reverse geocoding error:', err);
      return null;
    }
  };

  /**
   * Get user's current location using Geolocation API with high accuracy
   */
  const detectUserLocation = useCallback(async () => {
    setIsDetecting(true);
    setDetectionResult(null);

    // Check if Geolocation is supported
    if (!navigator.geolocation) {
      setDetectionResult({
        success: false,
        error: 'Geolocation is not supported by your browser'
      });
      setPermissionState('unsupported');
      setIsDetecting(false);
      return;
    }

    // Helper function to get position with specific options
    // Uses watchPosition as fallback for better cross-browser support
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
      // then try high accuracy if needed
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

      const { latitude, longitude, accuracy } = position.coords;
      
      console.log('📍 Live location detected:', { 
        lat: latitude, 
        lng: longitude, 
        accuracy: `${accuracy.toFixed(0)}m` 
      });

      // Cache the location
      localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify({
        lat: latitude,
        lng: longitude,
        accuracy,
        timestamp: Date.now()
      }));

      // Get reverse geocoded address (async, don't block)
      let reverseGeocodedAddress = null;
      try {
        reverseGeocodedAddress = await reverseGeocode(latitude, longitude);
        console.log('📍 Reverse geocoded address:', reverseGeocodedAddress);
      } catch (err) {
        console.warn('Could not reverse geocode:', err);
      }

      // Find matching delivery zone
      const matchResult = findMatchingLocation(latitude, longitude);

      if (matchResult.matched) {
        setDetectionResult({
          success: true,
          location: matchResult.location,
          distance: matchResult.distance,
          userCoords: { lat: latitude, lng: longitude, accuracy },
          reverseGeocodedAddress
        });

        // Auto-save if user is logged in
        if (user && matchResult.location) {
          try {
            await updateUserLocation(matchResult.location._id);
            console.log('✅ Location auto-saved:', matchResult.location.area);
          } catch (err) {
            console.error('Error saving location:', err);
          }
        }

        setShowSuccessBanner(true);
        setTimeout(() => {
          setShowModal(false);
          setShowSuccessBanner(false);
        }, 5000); // Increased to 5 seconds so user can see details
      } else {
        setDetectionResult({
          success: false,
          error: matchResult.error,
          userCoords: { lat: latitude, lng: longitude, accuracy },
          closestLocation: matchResult.closestLocation,
          reverseGeocodedAddress
        });
      }

      setPermissionState('granted');
    } catch (error) {
      console.error('Geolocation error:', error);
      
      let errorMessage = 'Unable to detect your location';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location permission was denied. Please enable it in your browser settings.';
          setPermissionState('denied');
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information is unavailable. Please try again.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out. Please try again.';
          break;
        default:
          errorMessage = 'An unknown error occurred while detecting your location.';
      }

      setDetectionResult({
        success: false,
        error: errorMessage
      });
    } finally {
      setIsDetecting(false);
    }
  }, [findMatchingLocation, user, updateUserLocation]);

  /**
   * Check permission state and decide whether to show modal
   */
  const checkPermissionState = useCallback(async () => {
    // Don't show if already asked and user dismissed
    const alreadyAsked = localStorage.getItem(PERMISSION_STORAGE_KEY);
    
    // Don't show if user already has a location set
    if (user?.location && typeof user.location === 'object' && user.location._id) {
      console.log('📍 User already has location set:', user.location.area);
      return;
    }

    // Check cached location
    const cachedLocation = localStorage.getItem(LOCATION_CACHE_KEY);
    if (cachedLocation) {
      try {
        const cached = JSON.parse(cachedLocation);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
          console.log('📍 Using cached geolocation');
          const matchResult = findMatchingLocation(cached.lat, cached.lng);
          if (matchResult.matched && user) {
            await updateUserLocation(matchResult.location._id);
            return;
          }
        }
      } catch (e) {
        console.error('Error parsing cached location:', e);
      }
    }

    // Check browser permission state if supported
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setPermissionState(result.state);
        
        if (result.state === 'granted') {
          // Permission already granted, detect location automatically
          detectUserLocation();
          return;
        } else if (result.state === 'denied') {
          // Permission denied, don't show modal
          return;
        }
        
        // Listen for permission changes
        result.addEventListener('change', () => {
          setPermissionState(result.state);
          if (result.state === 'granted') {
            detectUserLocation();
          }
        });
      } catch (e) {
        console.log('Permission API not supported, will ask directly');
      }
    }

    // Show modal if not already asked or permission is prompt
    if (!alreadyAsked || alreadyAsked === 'later') {
      // Small delay to let the page load first
      setTimeout(() => {
        setShowModal(true);
      }, 1500);
    }
  }, [user, findMatchingLocation, updateUserLocation, detectUserLocation]);

  // Check permission on mount
  useEffect(() => {
    if (!hasCheckedRef.current && locations.length > 0) {
      hasCheckedRef.current = true;
      checkPermissionState();
    }
  }, [locations, checkPermissionState]);

  // Cleanup watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  /**
   * Handle "Allow" button click
   */
  const handleAllowLocation = () => {
    localStorage.setItem(PERMISSION_STORAGE_KEY, 'allowed');
    detectUserLocation();
  };

  /**
   * Handle "Not Now" / "Later" button click
   */
  const handleDismiss = () => {
    localStorage.setItem(PERMISSION_STORAGE_KEY, 'later');
    setShowModal(false);
    if (onClose) onClose();
  };

  /**
   * Handle "Don't Ask Again" button click
   */
  const handleDontAskAgain = () => {
    localStorage.setItem(PERMISSION_STORAGE_KEY, 'never');
    setShowModal(false);
    if (onClose) onClose();
  };

  /**
   * Handle opening the modal manually (for trigger button)
   */
  const handleOpenModal = () => {
    setDetectionResult(null);
    setShowModal(true);
  };

  /**
   * Handle manual location selection from dropdown
   */
  const handleSelectLocation = async (locationId) => {
    if (user && locationId) {
      try {
        await updateUserLocation(locationId);
        setShowModal(false);
        if (onClose) onClose();
        setShowSuccessBanner(true);
        setTimeout(() => setShowSuccessBanner(false), 3000);
      } catch (err) {
        console.error('Error setting location:', err);
      }
    }
  };

  // Floating trigger button (always visible when showTriggerButton is true)
  const TriggerButton = () => (
    <button
      onClick={handleOpenModal}
      className="fixed bottom-24 right-4 md:bottom-8 z-[100] bg-gradient-to-r from-[#733857] to-[#8B4D6B] text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
      title="Detect My Location"
    >
      <div className="relative">
        <Navigation className="w-6 h-6" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
      </div>
      {/* Tooltip */}
      <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        📍 Detect My Location
      </span>
    </button>
  );

  // If modal is not shown but trigger button should be visible
  if (!showModal && !showSuccessBanner) {
    return showTriggerButton ? <TriggerButton /> : null;
  }

  // Success banner (brief notification after location is set)
  if (showSuccessBanner && detectionResult?.success) {
    return (
      <>
        {showTriggerButton && <TriggerButton />}
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] animate-slideDown">
          <div className="bg-green-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">
              📍 Delivering to {detectionResult.location.area}!
            </span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Trigger Button (visible even when modal is open on desktop) */}
      {showTriggerButton && !showModal && <TriggerButton />}
      
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] animate-fadeIn"
        onClick={handleDismiss}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scaleIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#733857] to-[#8B4D6B] text-white p-6 relative">
            <button 
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                <Navigation className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Enable Location</h2>
                <p className="text-white/80 text-sm">For faster, accurate delivery</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Initial State - Asking for permission */}
            {!isDetecting && !detectionResult && (
              <>
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-[#FFF5F8] rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-10 h-10 text-[#733857]" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Allow La Pâtisserie to access your location?
                  </h3>
                  <p className="text-gray-600 text-sm">
                    We'll use your location to find the nearest delivery zone and ensure your 
                    delicious treats reach you fresh! 🍰
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleAllowLocation}
                    className="w-full py-3 px-4 bg-[#733857] hover:bg-[#5a2a45] text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-5 h-5" />
                    Allow Location Access
                  </button>
                  
                  <button
                    onClick={handleDismiss}
                    className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                  >
                    Maybe Later
                  </button>
                  
                  <button
                    onClick={handleDontAskAgain}
                    className="w-full py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors"
                  >
                    Don't ask again
                  </button>
                </div>
              </>
            )}

            {/* Detecting State */}
            {isDetecting && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-[#FFF5F8] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Loader2 className="w-8 h-8 text-[#733857] animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Detecting your location...
                </h3>
                <p className="text-gray-500 text-sm">
                  Please wait while we pinpoint your location 📍
                </p>
              </div>
            )}

            {/* Success State */}
            {detectionResult?.success && (
              <div className="py-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Live Location Detected! 🎉
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Matched to <span className="font-semibold text-[#733857]">{detectionResult.location.area}, {detectionResult.location.city}</span>
                  </p>
                </div>
                
                {/* Live Location Details Box */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold text-green-700">📍 Your Live Location</span>
                  </div>
                  
                  {/* Coordinates */}
                  {detectionResult.userCoords && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center bg-white/60 rounded-lg px-3 py-2">
                        <span className="text-gray-600">Latitude:</span>
                        <span className="font-mono text-gray-900">{detectionResult.userCoords.lat.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/60 rounded-lg px-3 py-2">
                        <span className="text-gray-600">Longitude:</span>
                        <span className="font-mono text-gray-900">{detectionResult.userCoords.lng.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/60 rounded-lg px-3 py-2">
                        <span className="text-gray-600">Accuracy:</span>
                        <span className="font-mono text-gray-900">±{detectionResult.userCoords.accuracy.toFixed(0)}m</span>
                      </div>
                      {detectionResult.distance && (
                        <div className="flex justify-between items-center bg-white/60 rounded-lg px-3 py-2">
                          <span className="text-gray-600">Distance to zone:</span>
                          <span className="font-mono text-gray-900">{detectionResult.distance} km</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Reverse Geocoded Address */}
                  {detectionResult.reverseGeocodedAddress && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-xs text-gray-500 mb-1">Detected Address:</p>
                      <p className="text-sm text-gray-700">{detectionResult.reverseGeocodedAddress}</p>
                    </div>
                  )}
                </div>
                
                {/* Delivery Zone Matched */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>✨ Great news! We deliver to your area. Location saved!</span>
                </div>
              </div>
            )}

            {/* Error State - No matching zone */}
            {detectionResult && !detectionResult.success && (
              <div className="py-4">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPinOff className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    We're Not In Your Area Yet 😔
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {detectionResult.error}
                  </p>
                </div>

                {/* Show detected location details even when not matched */}
                {detectionResult.userCoords && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold text-amber-700">📍 Your Detected Location</span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center bg-white/60 rounded-lg px-3 py-2">
                        <span className="text-gray-600">Latitude:</span>
                        <span className="font-mono text-gray-900">{detectionResult.userCoords.lat.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/60 rounded-lg px-3 py-2">
                        <span className="text-gray-600">Longitude:</span>
                        <span className="font-mono text-gray-900">{detectionResult.userCoords.lng.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/60 rounded-lg px-3 py-2">
                        <span className="text-gray-600">Accuracy:</span>
                        <span className="font-mono text-gray-900">±{detectionResult.userCoords.accuracy.toFixed(0)}m</span>
                      </div>
                    </div>
                    
                    {/* Reverse Geocoded Address */}
                    {detectionResult.reverseGeocodedAddress && (
                      <div className="mt-3 pt-3 border-t border-amber-200">
                        <p className="text-xs text-gray-500 mb-1">Detected Address:</p>
                        <p className="text-sm text-gray-700">{detectionResult.reverseGeocodedAddress}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Manual selection dropdown */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Select a delivery zone manually:
                  </p>
                  <select
                    onChange={(e) => handleSelectLocation(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#733857] focus:border-transparent"
                    defaultValue=""
                  >
                    <option value="" disabled>Choose a location...</option>
                    {locations.map((loc) => (
                      <option key={loc._id} value={loc._id}>
                        {loc.area}, {loc.city} - {loc.pincode}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleDismiss}
                  className="w-full mt-4 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="px-6 pb-4">
            <p className="text-xs text-gray-400 text-center">
              🔒 Your location data is only used for delivery purposes and is never shared.
            </p>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { 
            opacity: 0; 
            transform: scale(0.9); 
          }
          to { 
            opacity: 1; 
            transform: scale(1); 
          }
        }
        
        @keyframes slideDown {
          from { 
            opacity: 0; 
            transform: translate(-50%, -20px); 
          }
          to { 
            opacity: 1; 
            transform: translate(-50%, 0); 
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default LocationPermission;
