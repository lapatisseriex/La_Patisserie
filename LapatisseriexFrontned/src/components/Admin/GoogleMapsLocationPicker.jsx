import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaMapMarkerAlt, FaSearch, FaCrosshairs, FaCheck, FaTimes } from 'react-icons/fa';

/**
 * Google Maps Location Picker Component
 * Allows admin to select a location on the map and set delivery radius
 * 
 * Props:
 * - initialLat: Initial latitude
 * - initialLng: Initial longitude
 * - initialRadius: Initial delivery radius in km
 * - onLocationSelect: Callback when location is selected (lat, lng, address)
 * - onRadiusChange: Callback when radius changes
 * - onClose: Callback to close the picker
 * - onSave: Callback to save the location
 */
const GoogleMapsLocationPicker = ({
  initialLat = null,
  initialLng = null,
  initialRadius = 5,
  onLocationSelect,
  onRadiusChange,
  onClose,
  onSave,
  googleMapsApiKey
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const autocompleteRef = useRef(null);
  const searchInputRef = useRef(null);

  const [selectedLocation, setSelectedLocation] = useState({
    lat: initialLat,
    lng: initialLng,
    address: ''
  });
  const [radius, setRadius] = useState(initialRadius);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  // Default center (Coimbatore, India - adjust as needed)
  const defaultCenter = { lat: 11.0168, lng: 76.9558 };

  // Load Google Maps script
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      // Check if script is already being loaded
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        const checkLoaded = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkLoaded);
            initializeMap();
          }
        }, 100);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => initializeMap();
      script.onerror = () => {
        setError('Failed to load Google Maps. Please check your API key.');
        setIsLoading(false);
      };
      document.head.appendChild(script);
    };

    loadGoogleMaps();
    
    return () => {
      // Cleanup
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      if (circleRef.current) {
        circleRef.current.setMap(null);
      }
    };
  }, [googleMapsApiKey]);

  // Initialize map
  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google) return;

    const center = selectedLocation.lat && selectedLocation.lng
      ? { lat: selectedLocation.lat, lng: selectedLocation.lng }
      : defaultCenter;

    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 14,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    mapInstanceRef.current = map;

    // Add marker if initial location exists
    if (selectedLocation.lat && selectedLocation.lng) {
      addMarkerAndCircle(center, radius);
    }

    // Initialize Places Autocomplete
    if (searchInputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(
        searchInputRef.current,
        {
          types: ['geocode', 'establishment'],
          componentRestrictions: { country: 'in' } // Restrict to India
        }
      );

      autocomplete.bindTo('bounds', map);
      autocompleteRef.current = autocomplete;

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();

        if (!place.geometry || !place.geometry.location) {
          setError('No location found for this place');
          return;
        }

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const address = place.formatted_address || place.name;

        map.setCenter({ lat, lng });
        map.setZoom(15);

        addMarkerAndCircle({ lat, lng }, radius);
        
        setSelectedLocation({ lat, lng, address });
        onLocationSelect?.({ lat, lng, address });
        setError(null);
      });
    }

    // Click listener to place marker
    map.addListener('click', (event) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();

      addMarkerAndCircle({ lat, lng }, radius);

      // Reverse geocode to get address
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        let address = '';
        if (status === 'OK' && results[0]) {
          address = results[0].formatted_address;
        }
        
        setSelectedLocation({ lat, lng, address });
        onLocationSelect?.({ lat, lng, address });
      });
    });

    setIsLoading(false);
  }, [selectedLocation.lat, selectedLocation.lng, radius, onLocationSelect]);

  // Add or update marker and circle
  const addMarkerAndCircle = useCallback((position, radiusKm) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing marker and circle
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }
    if (circleRef.current) {
      circleRef.current.setMap(null);
    }

    // Add marker
    const marker = new window.google.maps.Marker({
      position,
      map,
      draggable: true,
      animation: window.google.maps.Animation.DROP,
      title: 'Delivery Center'
    });

    // Add circle for radius
    const circle = new window.google.maps.Circle({
      map,
      center: position,
      radius: radiusKm * 1000, // Convert km to meters
      fillColor: '#733857',
      fillOpacity: 0.15,
      strokeColor: '#733857',
      strokeOpacity: 0.8,
      strokeWeight: 2
    });

    // Marker drag listener
    marker.addListener('dragend', () => {
      const newPos = marker.getPosition();
      const lat = newPos.lat();
      const lng = newPos.lng();

      circle.setCenter({ lat, lng });

      // Reverse geocode
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        let address = '';
        if (status === 'OK' && results[0]) {
          address = results[0].formatted_address;
        }
        
        setSelectedLocation({ lat, lng, address });
        onLocationSelect?.({ lat, lng, address });
      });
    });

    markerRef.current = marker;
    circleRef.current = circle;
  }, [onLocationSelect]);

  // Update circle radius
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radius * 1000);
    }
  }, [radius]);

  // Handle radius change
  const handleRadiusChange = (e) => {
    const newRadius = parseFloat(e.target.value);
    setRadius(newRadius);
    onRadiusChange?.(newRadius);
  };

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const map = mapInstanceRef.current;
        
        if (map) {
          map.setCenter({ lat: latitude, lng: longitude });
          map.setZoom(15);
          addMarkerAndCircle({ lat: latitude, lng: longitude }, radius);

          // Reverse geocode
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
            let address = '';
            if (status === 'OK' && results[0]) {
              address = results[0].formatted_address;
            }
            
            setSelectedLocation({ lat: latitude, lng: longitude, address });
            onLocationSelect?.({ lat: latitude, lng: longitude, address });
            setIsLoading(false);
          });
        }
      },
      (error) => {
        setError('Unable to get your location. Please search or click on the map.');
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Handle save
  const handleSave = () => {
    if (!selectedLocation.lat || !selectedLocation.lng) {
      setError('Please select a location on the map');
      return;
    }
    
    onSave?.({
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      address: selectedLocation.address,
      radius
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#733857] text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <FaMapMarkerAlt className="text-xl" />
            <h2 className="text-xl font-semibold">Set Delivery Location</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Search Bar */}
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for a location..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#733857] focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              onClick={getCurrentLocation}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition-colors"
              title="Use current location"
            >
              <FaCrosshairs className="text-[#733857]" />
              <span className="hidden sm:inline">Current Location</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Map Container */}
          <div className="relative mb-4">
            <div
              ref={mapRef}
              className="w-full h-[400px] rounded-lg border border-gray-200"
              style={{ minHeight: '400px' }}
            />
            {isLoading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                <div className="animate-spin w-10 h-10 border-4 border-[#733857] border-t-transparent rounded-full" />
              </div>
            )}
          </div>

          {/* Radius Slider */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Delivery Radius
              </label>
              <span className="text-lg font-semibold text-[#733857]">
                {radius} km
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="20"
              step="0.5"
              value={radius}
              onChange={handleRadiusChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#733857]"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.5 km</span>
              <span>20 km</span>
            </div>
          </div>

          {/* Selected Location Info */}
          {selectedLocation.lat && selectedLocation.lng && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FaMapMarkerAlt className="text-green-600 mt-1" />
                <div>
                  <p className="text-sm font-medium text-green-800">Selected Location</p>
                  {selectedLocation.address && (
                    <p className="text-sm text-green-700 mt-1">{selectedLocation.address}</p>
                  )}
                  <p className="text-xs text-green-600 mt-1">
                    Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedLocation.lat || !selectedLocation.lng}
            className="px-6 py-2.5 bg-[#733857] text-white rounded-lg hover:bg-[#5d2c46] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FaCheck />
            Save Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoogleMapsLocationPicker;
