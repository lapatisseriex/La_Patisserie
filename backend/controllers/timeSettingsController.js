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
    if (req.body.dailyPauseWindows) {
      settings.dailyPauseWindows = req.body.dailyPauseWindows;
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
    // Determine current day based on configured timezone, not server timezone
    const tz = settings.timezone;
    const dowShort = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(now);
    const dayIndexMap = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const currentDay = dayIndexMap.indexOf(dowShort);
    const today = now.toLocaleDateString('en-CA', { timeZone: settings.timezone });
    
    // Check for special day hours
    const specialDay = settings.specialDays.find(day => {
      // Compare dates in the configured timezone to avoid off-by-one day errors
      const specialDate = new Date(day.date).toLocaleDateString('en-CA', { timeZone: settings.timezone });
      return specialDate === today;
    });
    
    // Get operating hours for today
    const isWeekend = currentDay === 0 || currentDay === 6;
  let operatingHours;
    let closingTime = null;
    let nextOpenTime = null;
    let message = '';
  const pauses = settings.dailyPauseWindows || [];
    
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
    
    // Helper to build a Date (UTC instant) for a given local time in a specific timezone
    const buildTzDate = (refDate, tz, hhmm) => {
      const [hh, mm] = (hhmm || '00:00').split(':').map(v => parseInt(v, 10));
      const ymd = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(refDate);
      const year = parseInt(ymd.find(p => p.type === 'year').value, 10);
      const month = parseInt(ymd.find(p => p.type === 'month').value, 10);
      const day = parseInt(ymd.find(p => p.type === 'day').value, 10);
      const naiveUtcMs = Date.UTC(year, month - 1, day, hh, mm, 0, 0);
      // Determine tz offset at this instant using shortOffset (e.g., GMT+5:30)
      const dtf = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        timeZoneName: 'shortOffset',
        hour12: false,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
      const parts = dtf.formatToParts(new Date(naiveUtcMs));
      const tzName = parts.find(p => p.type === 'timeZoneName')?.value || 'GMT+0';
      const m = tzName.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
      let offsetMs = 0;
      if (m) {
        const sign = m[1] === '+' ? 1 : -1;
        const oh = parseInt(m[2] || '0', 10);
        const om = parseInt(m[3] || '0', 10);
        offsetMs = sign * (oh * 60 + om) * 60 * 1000;
      } else {
        // Fallback for environments without shortOffset support
        const naiveUtcDate = new Date(naiveUtcMs);
        const tzLocal = new Date(naiveUtcDate.toLocaleString('en-US', { timeZone: tz })).getTime();
        offsetMs = tzLocal - naiveUtcMs;
      }
      // Local tz wall-clock at hh:mm corresponds to UTC time = naiveUtcMs - offsetMs
      return new Date(naiveUtcMs - offsetMs);
    };

    // Calculate closing time if shop is open
    if (isOpen && operatingHours) {
      // Helper: get next occurrence (>= now) of a HH:MM wall-clock time in tz
      const nextOccurrence = (ref, hhmm) => {
        let d = buildTzDate(ref, tz, hhmm);
        if (d <= now) {
          const nextRef = new Date(ref);
          nextRef.setUTCDate(nextRef.getUTCDate() + 1);
          d = buildTzDate(nextRef, tz, hhmm);
        }
        return d;
      };

      // Operating end boundary for current open session
      const endCandidate = nextOccurrence(now, operatingHours.endTime);

      // Consider upcoming pause starts that occur before the endCandidate
      const pauseCandidates = (pauses || [])
        .filter(w => w?.startTime && w?.endTime)
        .map(w => nextOccurrence(now, w.startTime))
        .filter(d => d <= endCandidate);

      const allCandidates = [endCandidate, ...pauseCandidates].filter(Boolean);
      const closing = allCandidates.reduce((min, d) => (!min || d < min ? d : min), null);
      closingTime = closing ? closing.toISOString() : null;
    }
    
    // Calculate next opening time if shop is closed
    if (!isOpen) {
      const tz = settings.timezone;
      if (operatingHours) {
        // If closed due to pause, next opening is pause end today; else next schedule opening
        const currentTime = now.toLocaleTimeString('en-US', { hour12: false, timeZone: tz, hour: '2-digit', minute: '2-digit' });
        let target = null;
        for (const w of pauses) {
          if (!w?.startTime || !w?.endTime) continue;
          // if within pause now -> next opening at endTime
          const within = (w.startTime === w.endTime) ||
            (w.startTime < w.endTime ? (currentTime >= w.startTime && currentTime <= w.endTime)
                                      : (currentTime >= w.startTime || currentTime <= w.endTime));
          if (within) { target = w.endTime; break; }
        }
        if (!target) {
          target = operatingHours.startTime;
        }
        let opening = buildTzDate(now, tz, target);
        if (opening <= now) {
          // Compute same local time on next local day in tz
          const nextRef = new Date(now);
          nextRef.setUTCDate(nextRef.getUTCDate() + 1);
          opening = buildTzDate(nextRef, tz, target);
        }
        nextOpenTime = opening.toISOString();
      } else {
        // Find next available day with active schedule
        let daysToAdd = 1;
        let foundNextDay = false;
        while (!foundNextDay && daysToAdd <= 7) {
          const futureRef = new Date(now);
          futureRef.setUTCDate(futureRef.getUTCDate() + daysToAdd);
          const futureDayOfWeek = futureRef.toLocaleDateString('en-US', { timeZone: tz, weekday: 'short' });
          // Determine weekend vs weekday based on tz
          const dow = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(futureRef);
          const dayIndex = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(dow);
          const futureSchedule = (dayIndex === 0 || dayIndex === 6) ? settings.weekend : settings.weekday;
          if (futureSchedule.isActive) {
            const opening = buildTzDate(futureRef, tz, futureSchedule.startTime);
            nextOpenTime = opening.toISOString();
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