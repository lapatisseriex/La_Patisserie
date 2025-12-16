import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Navigation, Loader2, CheckCircle, XCircle, AlertTriangle, Search, X } from 'lucide-react';
import { useDeliveryAvailability } from '../../context/DeliveryAvailabilityContext';

/**
 * UserLocationPicker Component
 * Allows users to:
 * 1. Auto-detect location (GPS)
 * 2. Manually search and select location (Google Places Autocomplete)
 * 
 * This solves the IP-based location issue (showing Chennai instead of Tirupur)
 */
const UserLocationPicker = ({ onLocationConfirmed, className = '' }) => {
  const {
    deliveryStatus,
    loading,
    error,
    detectUserLocation,
    setManualLocation,
    resetDeliveryStatus
  } = useDeliveryAvailability();

  const [showManualInput, setShowManualInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [isAccurate, setIsAccurate] = useState(true);
  const [autocomplete, setAutocomplete] = useState(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  
  const searchInputRef = useRef(null);
  const autocompleteRef = useRef(null);

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

    // Load script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => console.error('Failed to load Google Maps');
    document.head.appendChild(script);

    return () => {
      // Cleanup not needed as script stays loaded
    };
  }, []);

  // Initialize autocomplete when script is loaded and input is shown
  useEffect(() => {
    if (!isScriptLoaded || !showManualInput || !searchInputRef.current) return;
    if (autocompleteRef.current) return; // Already initialized

    try {
      const autoCompleteInstance = new window.google.maps.places.Autocomplete(
        searchInputRef.current,
        {
          componentRestrictions: { country: 'in' }, // India only
          types: ['geocode', 'establishment'],
          fields: ['geometry', 'formatted_address', 'name']
        }
      );

      autoCompleteInstance.addListener('place_changed', () => {
        const place = autoCompleteInstance.getPlace();
        
        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const address = place.formatted_address || place.name || '';
          
          console.log('📍 Place selected:', { lat, lng, address });
          
          // Set manual location (100% accurate)
          setManualLocation(lat, lng, address);
          setLocationAccuracy(null);
          setIsAccurate(true);
          setSearchQuery(address);
          
          if (onLocationConfirmed) {
            onLocationConfirmed({ lat, lng, address });
          }
        }
      });

      autocompleteRef.current = autoCompleteInstance;
      setAutocomplete(autoCompleteInstance);
    } catch (err) {
      console.error('Error initializing autocomplete:', err);
    }
  }, [isScriptLoaded, showManualInput, setManualLocation, onLocationConfirmed]);

  // Handle auto-detect
  const handleAutoDetect = useCallback(async () => {
    try {
      const result = await detectUserLocation();
      
      if (result) {
        setLocationAccuracy(result.accuracy);
        setIsAccurate(result.isAccurate);
        
        // If accuracy is poor (>1km), suggest manual entry
        if (!result.isAccurate) {
          console.log('⚠️ Location accuracy poor:', result.accuracy, 'm - suggesting manual entry');
        }
        
        if (onLocationConfirmed) {
          onLocationConfirmed(result);
        }
      }
    } catch (err) {
      console.error('Auto-detect failed:', err);
    }
  }, [detectUserLocation, onLocationConfirmed]);

  // Clear and reset
  const handleReset = () => {
    resetDeliveryStatus();
    setSearchQuery('');
    setLocationAccuracy(null);
    setIsAccurate(true);
    setShowManualInput(false);
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-[#733857]" />
        <h3 className="font-semibold text-gray-800">Delivery Location</h3>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <Loader2 className="w-5 h-5 text-[#733857] animate-spin" />
          <span className="text-gray-600">Detecting your location...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
          <div className="flex items-start gap-2">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={handleAutoDetect}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Not Yet Checked - Show Options */}
      {!deliveryStatus.checked && !loading && !error && (
        <div className="space-y-3">
          {/* Auto-detect button */}
          <button
            onClick={handleAutoDetect}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#733857] text-white rounded-lg hover:bg-[#5d2c46] transition-colors"
          >
            <Navigation className="w-4 h-4" />
            <span>Detect My Location (GPS)</span>
          </button>

          {/* Manual entry option */}
          <div className="text-center">
            <span className="text-sm text-gray-500">or</span>
          </div>

          <button
            onClick={() => setShowManualInput(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>Enter Location Manually</span>
          </button>

          {/* Manual search input */}
          {showManualInput && (
            <div className="mt-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search your delivery location..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#733857] focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Type your area, street, or landmark and select from suggestions
              </p>
            </div>
          )}
        </div>
      )}

      {/* Location Checked - Show Result */}
      {deliveryStatus.checked && !loading && (
        <div className="space-y-3">
          {/* Accuracy Warning */}
          {locationAccuracy && !isAccurate && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-700">
                    Location accuracy is low ({Math.round(locationAccuracy / 1000)} km range)
                  </p>
                  <button
                    onClick={() => {
                      resetDeliveryStatus();
                      setShowManualInput(true);
                    }}
                    className="mt-1 text-sm text-amber-600 hover:text-amber-800 underline"
                  >
                    Enter location manually for accurate results
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delivery Available */}
          {deliveryStatus.available && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-green-800">
                    ✓ Delivery available for your location!
                  </p>
                  {deliveryStatus.matchedLocation && (
                    <p className="text-sm text-green-700 mt-1">
                      Delivering from: {deliveryStatus.matchedLocation.area}
                      {deliveryStatus.matchedLocation.city && `, ${deliveryStatus.matchedLocation.city}`}
                    </p>
                  )}
                  {deliveryStatus.distance && (
                    <p className="text-xs text-green-600 mt-1">
                      Distance: {deliveryStatus.distance} km
                      {deliveryStatus.estimatedTime && ` • Est. ${deliveryStatus.estimatedTime}`}
                    </p>
                  )}
                  {deliveryStatus.manualAddress && (
                    <p className="text-xs text-green-600 mt-1">
                      📍 {deliveryStatus.manualAddress}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Delivery Not Available */}
          {!deliveryStatus.available && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-red-800">
                    Delivery not available for your location
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    {deliveryStatus.message || 'Your location is outside our delivery area'}
                  </p>
                  {deliveryStatus.closestArea && (
                    <p className="text-xs text-red-500 mt-2">
                      Nearest delivery area: {deliveryStatus.closestArea.name} ({deliveryStatus.closestArea.distance} km away)
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Change Location Button */}
          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Change Location</span>
          </button>

          {/* Manual Entry for Better Accuracy */}
          {!showManualInput && !deliveryStatus.available && (
            <button
              onClick={() => {
                resetDeliveryStatus();
                setShowManualInput(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Try entering location manually</span>
            </button>
          )}
        </div>
      )}

      {/* Manual Input When Changing Location */}
      {deliveryStatus.checked && showManualInput && (
        <div className="mt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search your delivery location..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#733857] focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Type your area, street, or landmark and select from suggestions
          </p>
        </div>
      )}
    </div>
  );
};

export default UserLocationPicker;
