import asyncHandler from 'express-async-handler';
import Location from '../models/locationModel.js';

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
  const { city, area, pincode } = req.body;
  
  if (!city || !area || !pincode) {
    res.status(400);
    throw new Error('Please provide city, area, and pincode');
  }
  
  const location = await Location.create({
    city,
    area,
    pincode,
  });
  
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
