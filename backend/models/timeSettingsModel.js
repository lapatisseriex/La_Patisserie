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
}, {
  timestamps: true
});

// Method to check if shop is currently open
timeSettingsSchema.methods.isShopOpen = function() {
  const now = new Date();
  const currentTime = now.toLocaleTimeString('en-US', {
    hour12: false,
    timeZone: this.timezone,
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const today = now.toLocaleDateString('en-CA', { timeZone: this.timezone }); // YYYY-MM-DD format
  
  // Check for special days first
  const specialDay = this.specialDays.find(day => {
    const specialDate = new Date(day.date).toLocaleDateString('en-CA');
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
  
  return currentTime >= schedule.startTime && currentTime <= schedule.endTime;
};

// Method to get next opening time
timeSettingsSchema.methods.getNextOpeningTime = function() {
  const now = new Date();
  const currentDay = now.getDay();
  
  // Check if today has special hours
  const today = now.toLocaleDateString('en-CA', { timeZone: this.timezone });
  const specialDay = this.specialDays.find(day => {
    const specialDate = new Date(day.date).toLocaleDateString('en-CA');
    return specialDate === today;
  });
  
  if (specialDay && !specialDay.isClosed) {
    return `Today at ${specialDay.startTime || (currentDay === 0 || currentDay === 6 ? this.weekend.startTime : this.weekday.startTime)}`;
  }
  
  // Find next regular opening
  const isWeekend = currentDay === 0 || currentDay === 6;
  const schedule = isWeekend ? this.weekend : this.weekday;
  
  if (schedule.isActive) {
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