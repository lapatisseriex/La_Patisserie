import React from 'react';
import { MapPin, AlertCircle, CheckCircle, Navigation, Clock, Loader2 } from 'lucide-react';
import { useDeliveryAvailability } from '../../context/DeliveryAvailabilityContext';

/**
 * DeliveryStatusBanner Component
 * Shows delivery availability status and allows location detection
 */
const DeliveryStatusBanner = ({ className = '' }) => {
  const {
    deliveryStatus,
    loading,
    error,
    detectUserLocation,
    resetDeliveryStatus
  } = useDeliveryAvailability();

  const handleDetectLocation = async () => {
    try {
      await detectUserLocation();
    } catch (err) {
      console.error('Location detection failed:', err);
    }
  };

  // Not checked yet - show detect button
  if (!deliveryStatus.checked && !loading) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Navigation className="w-5 h-5 text-blue-600 mt-0.5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-800">
              Check Delivery Availability
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Allow location access to verify if we deliver to your area
            </p>
            <button
              onClick={handleDetectLocation}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Detect My Location
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
          <p className="text-sm text-gray-700">Checking delivery availability...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-amber-50 border border-amber-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">{error}</p>
            <button
              onClick={handleDetectLocation}
              className="mt-2 text-xs text-amber-700 hover:text-amber-900 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Delivery available
  if (deliveryStatus.available) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">
              ✓ Delivery available for your location!
            </p>
            {deliveryStatus.matchedLocation && (
              <p className="text-xs text-green-700 mt-1">
                Delivering from: {deliveryStatus.matchedLocation.area}, {deliveryStatus.matchedLocation.city}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2">
              {deliveryStatus.distance && (
                <span className="inline-flex items-center gap-1 text-xs text-green-600">
                  <MapPin className="w-3 h-3" />
                  {deliveryStatus.distance} km away
                </span>
              )}
              {deliveryStatus.estimatedTime && (
                <span className="inline-flex items-center gap-1 text-xs text-green-600">
                  <Clock className="w-3 h-3" />
                  Est. {deliveryStatus.estimatedTime}
                </span>
              )}
            </div>
            <button
              onClick={resetDeliveryStatus}
              className="mt-2 text-xs text-green-700 hover:text-green-900 underline"
            >
              Check different location
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Delivery not available
  return (
    <div className={`bg-red-50 border border-red-200 rounded-xl p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800">
            🚫 Delivery not available for your location
          </p>
          <p className="text-xs text-red-600 mt-1">
            Unfortunately, we don't deliver to your current location yet.
          </p>
          {deliveryStatus.closestArea && (
            <p className="text-xs text-red-600 mt-1">
              Nearest delivery area: {deliveryStatus.closestArea.area}, {deliveryStatus.closestArea.city} 
              ({deliveryStatus.closestArea.radiusKm} km radius)
            </p>
          )}
          {deliveryStatus.distance && (
            <p className="text-xs text-red-500 mt-1">
              You are {deliveryStatus.distance} km from the nearest delivery zone
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              onClick={resetDeliveryStatus}
              className="text-xs text-red-700 hover:text-red-900 underline"
            >
              Check different location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryStatusBanner;
