/**
 * Geo Utilities for Location-Based Delivery
 * Uses Haversine formula for accurate distance calculation
 */

/**
 * Calculate the distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in km
};

/**
 * Convert degrees to radians
 * @param {number} deg - Degrees
 * @returns {number} Radians
 */
const toRad = (deg) => {
  return deg * (Math.PI / 180);
};

/**
 * Check if a user location is within any delivery area
 * @param {number} userLat - User's latitude
 * @param {number} userLng - User's longitude
 * @param {Array} deliveryLocations - Array of delivery location objects with coordinates and radius
 * @returns {Object} Result with availability status and matching location if found
 */
export const checkDeliveryAvailability = (userLat, userLng, deliveryLocations) => {
  if (!userLat || !userLng || !Array.isArray(deliveryLocations)) {
    return {
      available: false,
      message: 'Invalid coordinates or delivery locations',
      matchedLocation: null,
      distance: null
    };
  }

  let closestLocation = null;
  let closestDistance = Infinity;

  for (const location of deliveryLocations) {
    // Skip locations without geo coordinates or inactive locations
    if (!location.useGeoDelivery || !location.coordinates?.lat || !location.coordinates?.lng || !location.isActive) {
      continue;
    }

    const distance = calculateDistance(
      userLat,
      userLng,
      location.coordinates.lat,
      location.coordinates.lng
    );

    // Track closest location for feedback
    if (distance < closestDistance) {
      closestDistance = distance;
      closestLocation = location;
    }

    // Check if within delivery radius
    if (distance <= location.deliveryRadiusKm) {
      return {
        available: true,
        message: 'Delivery available for your location',
        matchedLocation: {
          _id: location._id,
          area: location.area,
          city: location.city,
          pincode: location.pincode,
          deliveryCharge: location.deliveryCharge,
          deliveryRadiusKm: location.deliveryRadiusKm
        },
        distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
        estimatedTime: getEstimatedDeliveryTime(distance)
      };
    }
  }

  // No delivery area matched
  return {
    available: false,
    message: 'Delivery not available for your location',
    matchedLocation: null,
    distance: closestDistance !== Infinity ? Math.round(closestDistance * 100) / 100 : null,
    closestArea: closestLocation ? {
      area: closestLocation.area,
      city: closestLocation.city,
      radiusKm: closestLocation.deliveryRadiusKm
    } : null
  };
};

/**
 * Get estimated delivery time based on distance
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Estimated delivery time
 */
export const getEstimatedDeliveryTime = (distanceKm) => {
  if (distanceKm <= 2) {
    return '15-25 mins';
  } else if (distanceKm <= 5) {
    return '25-40 mins';
  } else if (distanceKm <= 10) {
    return '40-60 mins';
  } else {
    return '60-90 mins';
  }
};

/**
 * Validate coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} Whether coordinates are valid
 */
export const isValidCoordinates = (lat, lng) => {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180 &&
    !isNaN(lat) && !isNaN(lng)
  );
};

export default {
  calculateDistance,
  checkDeliveryAvailability,
  getEstimatedDeliveryTime,
  isValidCoordinates
};
