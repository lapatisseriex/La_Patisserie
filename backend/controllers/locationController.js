import asyncHandler from 'express-async-handler';
import Location from '../models/locationModel.js';
import { checkDeliveryAvailability, isValidCoordinates } from '../utils/geoUtils.js';

// @desc    Get all active delivery locations
// @route   GET /api/locations
// @access  Public
export const getLocations = asyncHandler(async (req, res) => {
  const locations = await Location.find({ isActive: true }).sort('city');
  res.status(200).json(locations);
});

// @desc    Get all locations (including inactive)
// @route   GET /api/admin/locations
// @access  Admin
export const getAllLocations = asyncHandler(async (req, res) => {
  const locations = await Location.find({}).sort('city');
  res.status(200).json(locations);
});

// @desc    Create a new location
// @route   POST /api/admin/locations
// @access  Admin
export const createLocation = asyncHandler(async (req, res) => {
  const { city, area, pincode, deliveryCharge, coordinates, state, geoAddress } = req.body;
  
  if (!city || !area || !pincode) {
    res.status(400);
    throw new Error('Please provide city, area, and pincode');
  }
  
  const locationData = {
    city,
    area,
    pincode,
    deliveryCharge: deliveryCharge || 49, // Default to 49 if not provided
  };
  
  // Add coordinates if provided from Google Maps search
  if (coordinates && coordinates.lat && coordinates.lng) {
    locationData.coordinates = {
      lat: coordinates.lat,
      lng: coordinates.lng
    };
  }
  
  // Add state if provided
  if (state) {
    locationData.state = state;
  }
  
  // Add full address from Google Places
  if (geoAddress) {
    locationData.geoAddress = geoAddress;
  }
  
  const location = await Location.create(locationData);
  
  res.status(201).json(location);
});

// @desc    Update a location
// @route   PUT /api/admin/locations/:id
// @access  Admin
export const updateLocation = asyncHandler(async (req, res) => {
  const location = await Location.findById(req.params.id);
  
  if (!location) {
    res.status(404);
    throw new Error('Location not found');
  }
  
  const updatedLocation = await Location.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  
  res.status(200).json(updatedLocation);
});

// @desc    Toggle location status (active/inactive)
// @route   PATCH /api/admin/locations/:id/toggle
// @access  Admin
export const toggleLocationStatus = asyncHandler(async (req, res) => {
  const location = await Location.findById(req.params.id);
  
  if (!location) {
    res.status(404);
    throw new Error('Location not found');
  }
  
  location.isActive = !location.isActive;
  await location.save();
  
  res.status(200).json({ id: location._id, isActive: location.isActive });
});

// @desc    Delete a location
// @route   DELETE /api/admin/locations/:id
// @access  Admin
export const deleteLocation = asyncHandler(async (req, res) => {
  const location = await Location.findById(req.params.id);
  
  if (!location) {
    res.status(404);
    throw new Error('Location not found');
  }
  
  await Location.findByIdAndDelete(req.params.id);
  
  res.status(200).json({ message: 'Location deleted successfully' });
});

// @desc    Check delivery availability for user coordinates
// @route   POST /api/locations/check-delivery
// @access  Public
export const checkDelivery = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;
  
  // Validate coordinates
  if (!isValidCoordinates(lat, lng)) {
    res.status(400);
    throw new Error('Invalid coordinates. Please provide valid latitude and longitude.');
  }
  
  // Get all active locations with geo-delivery enabled
  const locations = await Location.find({ 
    isActive: true,
    useGeoDelivery: true,
    'coordinates.lat': { $ne: null },
    'coordinates.lng': { $ne: null }
  });
  
  // Check delivery availability
  const result = checkDeliveryAvailability(lat, lng, locations);
  
  res.status(200).json(result);
});

// @desc    Get locations with geo-delivery info (for frontend map display)
// @route   GET /api/locations/geo
// @access  Public
export const getGeoLocations = asyncHandler(async (req, res) => {
  const locations = await Location.find({ 
    isActive: true,
    useGeoDelivery: true,
    'coordinates.lat': { $ne: null },
    'coordinates.lng': { $ne: null }
  }).select('area city pincode coordinates deliveryRadiusKm deliveryCharge');
  
  res.status(200).json(locations);
});

// @desc    Update location coordinates, radius, and address details (Admin)
// @route   PUT /api/admin/locations/:id/geo
// @access  Admin
export const updateLocationGeo = asyncHandler(async (req, res) => {
  const { 
    lat, 
    lng, 
    deliveryRadiusKm, 
    useGeoDelivery,
    // Auto-filled address fields from Google Geocoding
    area,
    city,
    state,
    pincode,
    address
  } = req.body;
  
  const location = await Location.findById(req.params.id);
  
  if (!location) {
    res.status(404);
    throw new Error('Location not found');
  }
  
  // Validate coordinates if provided
  if (lat !== undefined && lng !== undefined) {
    if (!isValidCoordinates(lat, lng)) {
      res.status(400);
      throw new Error('Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.');
    }
    location.coordinates = { lat, lng };
  }
  
  // Update radius if provided
  if (deliveryRadiusKm !== undefined) {
    if (deliveryRadiusKm < 0.5 || deliveryRadiusKm > 50) {
      res.status(400);
      throw new Error('Delivery radius must be between 0.5 and 50 km');
    }
    location.deliveryRadiusKm = deliveryRadiusKm;
  }
  
  // Update geo-delivery flag if provided
  if (useGeoDelivery !== undefined) {
    location.useGeoDelivery = useGeoDelivery;
  }
  
  // Auto-fill address details from Google Geocoding
  if (area) {
    location.area = area;
  }
  if (city) {
    location.city = city;
  }
  if (state) {
    location.state = state;
  }
  if (pincode) {
    location.pincode = pincode;
  }
  if (address) {
    location.geoAddress = address;
  }
  
  await location.save();
  
  console.log('📍 Location updated with geo data:', {
    id: location._id,
    area: location.area,
    city: location.city,
    pincode: location.pincode,
    coordinates: location.coordinates
  });
  
  res.status(200).json(location);
});
