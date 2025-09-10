import asyncHandler from 'express-async-handler';
import Hostel from '../models/hostelModel.js';
import Location from '../models/locationModel.js';

// @desc    Get all hostels for a specific location
// @route   GET /api/hostels/:locationId
// @access  Public
export const getHostelsByLocation = asyncHandler(async (req, res) => {
  const { locationId } = req.params;
  
  const hostels = await Hostel.find({ 
    locationId, 
    isActive: true 
  }).populate('locationId').sort('name');
  
  res.status(200).json(hostels);
});

// @desc    Get all hostels (admin)
// @route   GET /api/admin/hostels
// @access  Admin
export const getAllHostels = asyncHandler(async (req, res) => {
  const hostels = await Hostel.find({})
    .populate('locationId')
    .sort({ locationId: 1, name: 1 });
  
  res.status(200).json(hostels);
});

// @desc    Get hostels by location (admin)
// @route   GET /api/admin/hostels/location/:locationId
// @access  Admin
export const getHostelsByLocationAdmin = asyncHandler(async (req, res) => {
  const { locationId } = req.params;
  
  const hostels = await Hostel.find({ locationId })
    .populate('locationId')
    .sort('name');
  
  res.status(200).json(hostels);
});

// @desc    Create a new hostel
// @route   POST /api/admin/hostels
// @access  Admin
export const createHostel = asyncHandler(async (req, res) => {
  const { name, locationId, address } = req.body;
  
  if (!name || !locationId) {
    res.status(400);
    throw new Error('Please provide hostel name and location');
  }
  
  // Check if location exists
  const location = await Location.findById(locationId);
  if (!location) {
    res.status(404);
    throw new Error('Location not found');
  }
  
  // Check if hostel with same name already exists in this location
  const existingHostel = await Hostel.findOne({ 
    name: { $regex: new RegExp('^' + name + '$', 'i') }, 
    locationId 
  });
  
  if (existingHostel) {
    res.status(400);
    throw new Error('A hostel with this name already exists in this location');
  }
  
  const hostel = await Hostel.create({
    name,
    locationId,
    address
  });
  
  // Populate location data before sending response
  await hostel.populate('locationId');
  
  res.status(201).json(hostel);
});

// @desc    Update a hostel
// @route   PUT /api/admin/hostels/:id
// @access  Admin
export const updateHostel = asyncHandler(async (req, res) => {
  const { name, locationId, address } = req.body;
  
  const hostel = await Hostel.findById(req.params.id);
  
  if (!hostel) {
    res.status(404);
    throw new Error('Hostel not found');
  }
  
  // If updating name or location, check for duplicates
  if (name && (name !== hostel.name || locationId !== hostel.locationId.toString())) {
    const existingHostel = await Hostel.findOne({ 
      name: { $regex: new RegExp('^' + name + '$', 'i') }, 
      locationId: locationId || hostel.locationId,
      _id: { $ne: hostel._id }
    });
    
    if (existingHostel) {
      res.status(400);
      throw new Error('A hostel with this name already exists in this location');
    }
  }
  
  // If locationId is being updated, verify the new location exists
  if (locationId && locationId !== hostel.locationId.toString()) {
    const location = await Location.findById(locationId);
    if (!location) {
      res.status(404);
      throw new Error('New location not found');
    }
  }
  
  const updatedHostel = await Hostel.findByIdAndUpdate(
    req.params.id,
    { name, locationId, address },
    { new: true }
  ).populate('locationId');
  
  res.status(200).json(updatedHostel);
});

// @desc    Delete a hostel
// @route   DELETE /api/admin/hostels/:id
// @access  Admin
export const deleteHostel = asyncHandler(async (req, res) => {
  const hostel = await Hostel.findById(req.params.id);
  
  if (!hostel) {
    res.status(404);
    throw new Error('Hostel not found');
  }
  
  await Hostel.findByIdAndDelete(req.params.id);
  
  res.status(200).json({ message: 'Hostel deleted successfully' });
});

// @desc    Toggle hostel status (active/inactive)
// @route   PATCH /api/admin/hostels/:id/toggle
// @access  Admin
export const toggleHostelStatus = asyncHandler(async (req, res) => {
  const hostel = await Hostel.findById(req.params.id);
  
  if (!hostel) {
    res.status(404);
    throw new Error('Hostel not found');
  }
  
  hostel.isActive = !hostel.isActive;
  await hostel.save();
  
  res.status(200).json({ 
    id: hostel._id, 
    isActive: hostel.isActive 
  });
});
