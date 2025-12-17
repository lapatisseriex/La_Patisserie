import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, CheckCircle, X, Loader2 } from 'lucide-react';

// Fix Google autocomplete dropdown z-index and visibility
const autocompleteStyles = `
  .pac-container {
    z-index: 99999 !important;
    background-color: #fff !important;
    border: 1px solid #e5e7eb !important;
    border-radius: 8px !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
    margin-top: 4px !important;
    font-family: inherit !important;
  }
  .pac-item {
    padding: 10px 12px !important;
    cursor: pointer !important;
    border-top: 1px solid #f3f4f6 !important;
  }
  .pac-item:first-child {
    border-top: none !important;
  }
  .pac-item:hover {
    background-color: #f9fafb !important;
  }
  .pac-item-query {
    font-size: 14px !important;
    color: #374151 !important;
  }
  .pac-matched {
    font-weight: 600 !important;
    color: #6B4423 !important;
  }
  .pac-icon {
    display: none !important;
  }
`;

/**
 * LocationAutocomplete Component
 * A reusable Google Places Autocomplete input for selecting delivery locations
 * Used in Profile page and Checkout page
 * 
 * Stores user's precise sublocation (e.g., SITRA) while matching to admin's parent location (e.g., Peelamedu)
 */
const LocationAutocomplete = ({ 
  locations = [], // Available delivery locations from admin
  selectedLocationId = '',
  currentUserAddress = null, // User's saved precise address
  onLocationSelect, // Callback: (locationId, adminLocation, userAddressData) => void
  disabled = false,
  placeholder = "Search your delivery area...",
  className = ""
}) => {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [matchResult, setMatchResult] = useState(null); // { matched: boolean, location: object }
  const [showDropdown, setShowDropdown] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Inject autocomplete z-index fix styles
  useEffect(() => {
    const styleId = 'pac-container-fix';
    if (!document.getElementById(styleId)) {
      const styleTag = document.createElement('style');
      styleTag.id = styleId;
      styleTag.textContent = autocompleteStyles;
      document.head.appendChild(styleTag);
    }
  }, []);
  
  const searchInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const dropdownRef = useRef(null);

  // Get display name for selected location
  const getSelectedLocationName = useCallback(() => {
    if (!selectedLocationId || !locations.length) return '';
    const loc = locations.find(l => l._id === selectedLocationId);
    return loc ? `${loc.area}, ${loc.city} - ${loc.pincode}` : '';
  }, [selectedLocationId, locations]);

  // Track current search query separately from selected value
  const [searchQuery, setSearchQuery] = useState(() => {
    // First priority: user's saved precise address
    if (currentUserAddress?.fullAddress) {
      return currentUserAddress.fullAddress;
    }
    // Fallback: admin location name
    if (selectedLocationId && locations.length) {
      const loc = locations.find(l => l._id === selectedLocationId);
      return loc ? `${loc.area}, ${loc.city} - ${loc.pincode}` : '';
    }
    return '';
  });

  // Update search query when user address or selectedLocationId changes
  useEffect(() => {
    if (!isInitialized) {
      // Priority: show user's precise address if available
      if (currentUserAddress?.fullAddress) {
        setSearchQuery(currentUserAddress.fullAddress);
        if (selectedLocationId) {
          const loc = locations.find(l => l._id === selectedLocationId);
          if (loc) {
            setMatchResult({ matched: true, location: loc, userAddress: currentUserAddress });
          }
        }
        setIsInitialized(true);
      } else if (selectedLocationId && locations.length) {
        const loc = locations.find(l => l._id === selectedLocationId);
        if (loc) {
          setSearchQuery(`${loc.area}, ${loc.city} - ${loc.pincode}`);
          setMatchResult({ matched: true, location: loc });
          setIsInitialized(true);
        }
      }
    }
  }, [selectedLocationId, locations, currentUserAddress, isInitialized]);

  // Load Google Maps script
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Maps API key not found');
      return;
    }

    // Check if already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsScriptLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsScriptLoaded(true));
      return;
    }

    // Load script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => console.error('Failed to load Google Maps');
    document.head.appendChild(script);
  }, []);

  // Initialize autocomplete when script is loaded
  useEffect(() => {
    if (!isScriptLoaded || !searchInputRef.current || disabled) return;
    
    // Clean up previous instance
    if (autocompleteRef.current) {
      window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      autocompleteRef.current = null;
    }

    try {
      const autoCompleteInstance = new window.google.maps.places.Autocomplete(
        searchInputRef.current,
        {
          componentRestrictions: { country: 'in' }, // India only
          types: ['geocode', 'establishment'],
          fields: ['geometry', 'formatted_address', 'name', 'address_components']
        }
      );

      autoCompleteInstance.addListener('place_changed', () => {
        const place = autoCompleteInstance.getPlace();
        
        if (place.geometry && place.geometry.location) {
          handlePlaceSelected(place);
        }
      });

      autocompleteRef.current = autoCompleteInstance;
    } catch (err) {
      console.error('Error initializing autocomplete:', err);
    }

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isScriptLoaded, disabled]);

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

  // Handle place selection from Google Places
  const handlePlaceSelected = useCallback((place) => {
    setIsSearching(true);
    
    const userLat = place.geometry.location.lat();
    const userLng = place.geometry.location.lng();
    const fullAddress = place.formatted_address || place.name || '';
    
    console.log('📍 Place selected:', { lat: userLat, lng: userLng, fullAddress });
    
    // Extract address components
    let area = '';
    let city = '';
    let state = '';
    let pincode = '';
    
    if (place.address_components) {
      for (const component of place.address_components) {
        const types = component.types;
        if (types.includes('sublocality_level_1') || types.includes('sublocality') || types.includes('neighborhood')) {
          area = component.long_name;
        }
        if (types.includes('locality')) {
          city = component.long_name;
        }
        if (types.includes('administrative_area_level_1')) {
          state = component.long_name;
        }
        if (types.includes('postal_code')) {
          pincode = component.long_name;
        }
      }
    }
    
    // Build user's precise address data
    const userAddressData = {
      fullAddress,
      area: area || place.name || '',
      city,
      state,
      pincode,
      coordinates: {
        lat: userLat,
        lng: userLng
      }
    };
    
    console.log('📍 User address data:', userAddressData);
    
    // Find matching location using geo-radius check
    let matchedLocation = null;
    let closestDistance = Infinity;
    
    // Check each admin location's coordinates and radius
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
      
      const radiusKm = loc.deliveryRadiusKm || 5; // Default 5km
      
      console.log(`📏 Distance to ${loc.area}: ${distance.toFixed(2)}km (radius: ${radiusKm}km)`);
      
      // Check if user is within this location's delivery radius
      if (distance <= radiusKm && distance < closestDistance) {
        matchedLocation = loc;
        closestDistance = distance;
      }
    }
    
    setSearchQuery(fullAddress);
    
    if (matchedLocation) {
      setMatchResult({ 
        matched: true, 
        location: matchedLocation,
        userAddress: userAddressData,
        distance: closestDistance.toFixed(2)
      });
      // Pass both admin location and user's precise address
      onLocationSelect(matchedLocation._id, matchedLocation, userAddressData);
      console.log('✅ Location matched:', matchedLocation.area, `(${closestDistance.toFixed(2)}km away)`);
      console.log('✅ User sublocation:', userAddressData.area || userAddressData.fullAddress);
    } else {
      setMatchResult({ 
        matched: false, 
        location: null, 
        searchedAddress: fullAddress 
      });
      onLocationSelect('', null, null); // Clear selection if no match
      console.log('❌ No delivery location within radius');
    }
    
    setIsSearching(false);
    setShowDropdown(false);
  }, [locations, onLocationSelect]);

  // Handle manual dropdown selection
  const handleDropdownSelect = (location) => {
    setSearchQuery(`${location.area}, ${location.city} - ${location.pincode}`);
    // Create userAddressData from the selected admin location
    const userAddressData = {
      fullAddress: `${location.area}, ${location.city} - ${location.pincode}`,
      area: location.area,
      city: location.city,
      state: location.state || '',
      pincode: location.pincode,
      coordinates: location.coordinates || { lat: null, lng: null }
    };
    setMatchResult({ matched: true, location, userAddress: userAddressData });
    setIsInitialized(true);
    onLocationSelect(location._id, location, userAddressData);
    setShowDropdown(false);
  };

  // Clear selection
  const handleClear = () => {
    setSearchQuery('');
    setMatchResult(null);
    setIsInitialized(false);
    onLocationSelect('', null, null);
  };

  // Filter locations based on search query for dropdown
  const filteredLocations = locations.filter(loc => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      loc.area.toLowerCase().includes(searchLower) ||
      loc.city.toLowerCase().includes(searchLower) ||
      loc.pincode.includes(searchQuery)
    );
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#733857] focus:border-transparent transition-all ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
          } ${matchResult?.matched ? 'border-green-400' : ''}`}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
            setMatchResult(null);
            setIsInitialized(true); // User started typing
          }}
          onFocus={() => setShowDropdown(true)}
          disabled={disabled}
        />
        
        {/* Clear button */}
        {(searchQuery || selectedLocationId) && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        
        {/* Loading indicator */}
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#733857] animate-spin" />
        )}
      </div>

      {/* Match Result Message */}
      {matchResult && (
        <div className={`mt-2 p-3 rounded-lg text-sm ${
          matchResult.matched 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-amber-50 text-amber-800 border border-amber-200'
        }`}>
          {matchResult.matched ? (
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">✓ Delivery available!</span>
                <p className="text-xs mt-0.5">
                  <span className="font-medium">Your location:</span> {matchResult.userAddress?.area || matchResult.userAddress?.fullAddress?.split(',')[0] || 'Your area'}
                </p>
                <p className="text-xs text-green-600">
                  <span className="font-medium">Delivery zone:</span> {matchResult.location.area}, {matchResult.location.city} ({matchResult.distance}km)
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800">We're not in your area yet! 🎂</p>
                  <p className="text-xs mt-1 text-amber-700">
                    Looks like our delivery trucks haven't explored your neighborhood. But don't worry, we're expanding soon!
                  </p>
                </div>
              </div>
              
              {/* Show available locations dropdown */}
              <div className="pt-2 border-t border-amber-200">
                <p className="text-xs font-medium text-amber-800 mb-2 flex items-center gap-1">
                  <span>📍</span> Select from our delivery zones:
                </p>
                <select
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-md text-sm text-gray-700 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  value=""
                  onChange={(e) => {
                    const loc = locations.find(l => l._id === e.target.value);
                    if (loc) {
                      handleDropdownSelect(loc);
                    }
                  }}
                >
                  <option value="">Choose a delivery location...</option>
                  {locations.filter(loc => loc.isActive !== false).map(loc => (
                    <option key={loc._id} value={loc._id}>
                      {loc.area}, {loc.city} - {loc.pincode}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-500 mt-1">
        🔍 Search your area or select from available delivery zones
      </p>
    </div>
  );
};

export default LocationAutocomplete;
