import mongoose from 'mongoose';

const timeSettingsSchema = new mongoose.Schema({
  weekday: {
    startTime: {
      type: String,
      default: '09:00'
    },
    endTime: {
      type: String,
      default: '21:00'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  weekend: {
    startTime: {
      type: String,
      default: '09:00'
    },
    endTime: {
      type: String,
      default: '21:00'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  timezone: {
    type: String,
    default: 'Asia/Kolkata'
  },
  specialDays: [{
    date: {
      type: Date,
      required: true
    },
    isClosed: {
      type: Boolean,
      default: true
    },
    startTime: String,
    endTime: String,
    description: String
  }]
  ,
  dailyPauseWindows: [{
    startTime: { type: String }, // 'HH:MM'
    endTime: { type: String },   // 'HH:MM'
    description: { type: String }
  }]
}, {
  timestamps: true
});

// Helper: compare HH:MM in same day with wrap support
function isTimeInRange(current, start, end) {
  // current, start, end are strings 'HH:MM'
  if (start === end) return true; // 24h pause if identical
  if (start < end) {
    return current >= start && current <= end;
  } else {
    // Wraps midnight: e.g., 23:00 - 02:00
    return current >= start || current <= end;
  }
}

// Method to check if shop is currently open
timeSettingsSchema.methods.isShopOpen = function() {
  const now = new Date();
  const currentTime = now.toLocaleTimeString('en-US', {
    hour12: false,
    timeZone: this.timezone,
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Compute current day-of-week and date in configured timezone
  const dowShort = new Intl.DateTimeFormat('en-US', { timeZone: this.timezone, weekday: 'short' }).format(now);
  const dayIndexMap = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const currentDay = dayIndexMap.indexOf(dowShort); // 0 = Sunday, 1 = Monday, etc.
  const today = now.toLocaleDateString('en-CA', { timeZone: this.timezone }); // YYYY-MM-DD format
  
  // Check for special days first
  const specialDay = this.specialDays.find(day => {
    // Compare dates in configured timezone to avoid mismatch around midnight
    const specialDate = new Date(day.date).toLocaleDateString('en-CA', { timeZone: this.timezone });
    return specialDate === today;
  });
  
  if (specialDay) {
    if (specialDay.isClosed) return false;
    if (specialDay.startTime && specialDay.endTime) {
      return currentTime >= specialDay.startTime && currentTime <= specialDay.endTime;
    }
  }
  
  // Check regular hours
  const isWeekend = currentDay === 0 || currentDay === 6; // Sunday or Saturday
  const schedule = isWeekend ? this.weekend : this.weekday;
  
  if (!schedule.isActive) return false;

  // Within base operating hours?
  const withinOperating = (schedule.startTime <= schedule.endTime)
    ? (currentTime >= schedule.startTime && currentTime <= schedule.endTime)
    : isTimeInRange(currentTime, schedule.startTime, schedule.endTime);
  if (!withinOperating) return false;

  // Apply daily pause windows if configured
  const pauses = this.dailyPauseWindows || [];
  for (const w of pauses) {
    if (w?.startTime && w?.endTime) {
      if (isTimeInRange(currentTime, w.startTime, w.endTime)) {
        return false; // paused now
      }
    }
  }

  return true;
};

// Method to get next opening time
timeSettingsSchema.methods.getNextOpeningTime = function() {
  const now = new Date();
  // Current day-of-week in configured timezone
  const dowShort = new Intl.DateTimeFormat('en-US', { timeZone: this.timezone, weekday: 'short' }).format(now);
  const dayIndexMap = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const currentDay = dayIndexMap.indexOf(dowShort);
  const currentTime = now.toLocaleTimeString('en-US', {
    hour12: false,
    timeZone: this.timezone,
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Check if today has special hours
  const today = now.toLocaleDateString('en-CA', { timeZone: this.timezone });
  const specialDay = this.specialDays.find(day => {
    const specialDate = new Date(day.date).toLocaleDateString('en-CA', { timeZone: this.timezone });
    return specialDate === today;
  });
  
  if (specialDay && !specialDay.isClosed) {
    return `Today at ${specialDay.startTime || (currentDay === 0 || currentDay === 6 ? this.weekend.startTime : this.weekday.startTime)}`;
  }
  
  // Find next regular opening
  const isWeekend = currentDay === 0 || currentDay === 6;
  const schedule = isWeekend ? this.weekend : this.weekday;
  
  if (schedule.isActive) {
    // If currently within a pause, next opening is pause end today
    const pauses = this.dailyPauseWindows || [];
    for (const w of pauses) {
      if (w?.startTime && w?.endTime && isTimeInRange(currentTime, w.startTime, w.endTime)) {
        return `Today at ${w.endTime}`;
      }
    }

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `${days[currentDay]} at ${schedule.startTime}`;
  }
  
  // Find next weekday if weekend is closed
  return `Monday at ${this.weekday.startTime}`;
};

// Static method to get current settings (create default if none exist)
timeSettingsSchema.statics.getCurrentSettings = async function() {
  try {
    // Fetch as a real document (not lean) so instance methods work and save() performs an update
    let settingsDoc = await this.findOne().maxTimeMS(5000);
    if (!settingsDoc) {
      // Create default settings once
      const defaultSettings = {
        weekday: {
          startTime: '09:00',
          endTime: '21:00',
          isActive: true
        },
        weekend: {
          startTime: '09:00',
          endTime: '21:00',
          isActive: true
        },
        timezone: 'Asia/Kolkata',
        specialDays: []
      };
      settingsDoc = await this.create(defaultSettings);
    }
    return settingsDoc;
  } catch (error) {
    console.error('Error in getCurrentSettings:', error);
    // Return an unsaved document with defaults if database fails
    return new this({
      weekday: {
        startTime: '09:00',
        endTime: '21:00',
        isActive: true
      },
      weekend: {
        startTime: '09:00',
        endTime: '21:00',
        isActive: true
      },
      timezone: 'Asia/Kolkata',
      specialDays: []
    });
  }
};

const TimeSettings = mongoose.model('TimeSettings', timeSettingsSchema);
export default TimeSettings;