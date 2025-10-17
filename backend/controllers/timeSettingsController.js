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
    // Add timeout to prevent hanging requests
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database query timeout')), 8000);
    });
    
    const settingsPromise = TimeSettings.getCurrentSettings();
    const settings = await Promise.race([settingsPromise, timeoutPromise]);
    
    const now = new Date();
    const isOpen = settings.isShopOpen();
    const currentDay = now.getDay();
    const today = now.toLocaleDateString('en-CA', { timeZone: settings.timezone });
    
    // Check for special day hours
    const specialDay = settings.specialDays.find(day => {
      const specialDate = new Date(day.date).toLocaleDateString('en-CA');
      return specialDate === today;
    });
    
    // Get operating hours for today
    const isWeekend = currentDay === 0 || currentDay === 6;
    let operatingHours;
    let closingTime = null;
    let nextOpenTime = null;
    let message = '';
    
    if (specialDay) {
      if (specialDay.isClosed) {
        operatingHours = null;
        message = specialDay.description || 'Closed for special day';
      } else {
        operatingHours = {
          startTime: specialDay.startTime || (isWeekend ? settings.weekend.startTime : settings.weekday.startTime),
          endTime: specialDay.endTime || (isWeekend ? settings.weekend.endTime : settings.weekday.endTime)
        };
        message = specialDay.description || '';
      }
    } else {
      const schedule = isWeekend ? settings.weekend : settings.weekday;
      operatingHours = schedule.isActive ? {
        startTime: schedule.startTime,
        endTime: schedule.endTime
      } : null;
    }
    
    // Calculate closing time if shop is open
    if (isOpen && operatingHours) {
      const [hours, minutes] = operatingHours.endTime.split(':');
      const closing = new Date(now);
      closing.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      closingTime = closing.toISOString();
    }
    
    // Calculate next opening time if shop is closed
    if (!isOpen) {
      if (operatingHours) {
        const [hours, minutes] = operatingHours.startTime.split(':');
        const opening = new Date(now);
        opening.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        // If opening time has passed today, set to tomorrow
        if (opening <= now) {
          opening.setDate(opening.getDate() + 1);
        }
        
        nextOpenTime = opening.toISOString();
      } else {
        // Find next available day
        let daysToAdd = 1;
        let foundNextDay = false;
        
        while (!foundNextDay && daysToAdd <= 7) {
          const futureDate = new Date(now);
          futureDate.setDate(futureDate.getDate() + daysToAdd);
          const futureDayOfWeek = futureDate.getDay();
          const futureSchedule = (futureDayOfWeek === 0 || futureDayOfWeek === 6) ? settings.weekend : settings.weekday;
          
          if (futureSchedule.isActive) {
            const [hours, minutes] = futureSchedule.startTime.split(':');
            futureDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            nextOpenTime = futureDate.toISOString();
            foundNextDay = true;
          } else {
            daysToAdd++;
          }
        }
      }
    }
    
    res.status(200).json({
      success: true,
      shopStatus: {
        isOpen,
        nextOpenTime,
        closingTime,
        currentTime: now.toISOString(),
        timezone: settings.timezone,
        operatingHours,
        message
      }
    });
  } catch (error) {
    console.error('Error checking shop status:', error);
    
    // Return default "open" status if database fails
    const defaultTimezone = 'Asia/Kolkata';
    res.status(200).json({
      success: true,
      shopStatus: {
        isOpen: true, // Default to open when database is unavailable
        nextOpenTime: null,
        closingTime: null,
        currentTime: new Date().toISOString(),
        timezone: defaultTimezone,
        operatingHours: {
          startTime: '09:00',
          endTime: '21:00'
        },
        message: ''
      },
      warning: 'Using default shop status due to database connectivity issues'
    });
  }
});