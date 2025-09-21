import asyncHandler from 'express-async-handler';
import TimeSettings from '../models/timeSettingsModel.js';

// @desc    Get time settings
// @route   GET /api/time-settings
// @access  Admin
export const getTimeSettings = asyncHandler(async (req, res) => {
  try {
    const settings = await TimeSettings.getCurrentSettings();
    const isOpen = settings.isShopOpen();
    const nextOpenTime = isOpen ? null : settings.getNextOpeningTime();
    
    res.status(200).json({
      success: true,
      data: settings,
      shopStatus: {
        isOpen,
        nextOpenTime,
        currentTime: new Date().toLocaleTimeString('en-US', {
          hour12: false,
          timeZone: settings.timezone,
          hour: '2-digit',
          minute: '2-digit'
        }),
        timezone: settings.timezone
      }
    });
  } catch (error) {
    console.error('Error fetching time settings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching time settings'
    });
  }
});

// @desc    Update time settings
// @route   PUT /api/time-settings
// @access  Admin
export const updateTimeSettings = asyncHandler(async (req, res) => {
  try {
    const settings = await TimeSettings.getCurrentSettings();
    
    // Update fields if provided
    if (req.body.weekday) {
      settings.weekday = { ...settings.weekday, ...req.body.weekday };
    }
    if (req.body.weekend) {
      settings.weekend = { ...settings.weekend, ...req.body.weekend };
    }
    if (req.body.timezone) {
      settings.timezone = req.body.timezone;
    }
    if (req.body.specialDays) {
      settings.specialDays = req.body.specialDays;
    }
    
    await settings.save();
    
    const isOpen = settings.isShopOpen();
    const nextOpenTime = isOpen ? null : settings.getNextOpeningTime();
    
    res.status(200).json({
      success: true,
      data: settings,
      message: 'Time settings updated successfully',
      shopStatus: {
        isOpen,
        nextOpenTime
      }
    });
  } catch (error) {
    console.error('Error updating time settings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating time settings'
    });
  }
});

// @desc    Add special day
// @route   POST /api/time-settings/special-day
// @access  Admin
export const addSpecialDay = asyncHandler(async (req, res) => {
  try {
    const { date, isClosed, startTime, endTime, description } = req.body;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }
    
    const settings = await TimeSettings.getCurrentSettings();
    
    // Remove existing entry for the same date
    settings.specialDays = settings.specialDays.filter(day => 
      new Date(day.date).toLocaleDateString('en-CA') !== new Date(date).toLocaleDateString('en-CA')
    );
    
    // Add new special day
    settings.specialDays.push({
      date: new Date(date),
      isClosed: isClosed !== undefined ? isClosed : true,
      startTime,
      endTime,
      description
    });
    
    await settings.save();
    
    res.status(200).json({
      success: true,
      data: settings,
      message: 'Special day added successfully'
    });
  } catch (error) {
    console.error('Error adding special day:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding special day'
    });
  }
});

// @desc    Remove special day
// @route   DELETE /api/time-settings/special-day/:date
// @access  Admin
export const removeSpecialDay = asyncHandler(async (req, res) => {
  try {
    const { date } = req.params;
    
    const settings = await TimeSettings.getCurrentSettings();
    
    const initialCount = settings.specialDays.length;
    settings.specialDays = settings.specialDays.filter(day => 
      new Date(day.date).toLocaleDateString('en-CA') !== date
    );
    
    if (settings.specialDays.length === initialCount) {
      return res.status(404).json({
        success: false,
        message: 'Special day not found'
      });
    }
    
    await settings.save();
    
    res.status(200).json({
      success: true,
      data: settings,
      message: 'Special day removed successfully'
    });
  } catch (error) {
    console.error('Error removing special day:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing special day'
    });
  }
});

// @desc    Check shop status (public)
// @route   GET /api/time-settings/status
// @access  Public
export const checkShopStatus = asyncHandler(async (req, res) => {
  try {
    const settings = await TimeSettings.getCurrentSettings();
    const isOpen = settings.isShopOpen();
    const nextOpenTime = isOpen ? null : settings.getNextOpeningTime();
    
    res.status(200).json({
      success: true,
      data: {
        isOpen,
        nextOpeningTime: nextOpenTime,
        currentTime: new Date().toLocaleTimeString('en-US', {
          hour12: false,
          timeZone: settings.timezone,
          hour: '2-digit',
          minute: '2-digit'
        }),
        timezone: settings.timezone
      }
    });
  } catch (error) {
    console.error('Error checking shop status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking shop status'
    });
  }
});