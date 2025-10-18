import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Save, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';
import webSocketService from '../../services/websocketService.js';

const AdminTimeSettings = () => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL;
  const [settings, setSettings] = useState({
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
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [shopStatus, setShopStatus] = useState({ isOpen: true });
  const [newSpecialDay, setNewSpecialDay] = useState({
    date: '',
    isClosed: true,
    startTime: '',
    endTime: '',
    description: ''
  });

  // Compute today's info for admin: weekday/weekend and today's hours (timezone-aware)
  const todayInfo = useMemo(() => {
    try {
      const tz = settings.timezone || 'Asia/Kolkata';
      const now = new Date();
      const weekdayShort = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(now);
      const weekdayLong = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long' }).format(now);
      const dayIndex = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(weekdayShort);
      const isWeekend = dayIndex === 0 || dayIndex === 6;
      const todayStr = now.toLocaleDateString('en-CA', { timeZone: tz });
      const special = (settings.specialDays || []).find(d => new Date(d.date).toLocaleDateString('en-CA', { timeZone: tz }) === todayStr);
      let hours = null;
      let closed = false;
      if (special) {
        closed = !!special.isClosed;
        if (!closed) {
          hours = {
            startTime: special.startTime || (isWeekend ? settings.weekend.startTime : settings.weekday.startTime),
            endTime: special.endTime || (isWeekend ? settings.weekend.endTime : settings.weekday.endTime)
          };
        }
      } else {
        const sched = isWeekend ? settings.weekend : settings.weekday;
        closed = !sched?.isActive;
        if (!closed && sched) {
          hours = { startTime: sched.startTime, endTime: sched.endTime };
        }
      }
      return {
        weekdayLong,
        isWeekend,
        closed,
        hours,
        tz
      };
    } catch (e) {
      return { weekdayLong: '', isWeekend: false, closed: false, hours: null, tz: 'Asia/Kolkata' };
    }
  }, [settings]);

  // Format next open time for display based on settings timezone
  const formattedNextOpen = useMemo(() => {
    try {
      if (!shopStatus?.nextOpenTime) return null;
      const tz = settings.timezone || 'Asia/Kolkata';
      const d = new Date(shopStatus.nextOpenTime);
      const now = new Date();
      const todayStr = now.toLocaleDateString('en-CA', { timeZone: tz });
      const dateStr = d.toLocaleDateString('en-CA', { timeZone: tz });
      const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: tz });
      if (todayStr === dateStr) return `at ${timeStr}`;
      const weekday = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: tz });
      return `${weekday} ${timeStr}`;
    } catch {
      return shopStatus?.nextOpenTime ?? null;
    }
  }, [shopStatus?.nextOpenTime, settings.timezone]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { getAuth, onAuthStateChanged } = await import('firebase/auth');
        const auth = getAuth();
        
        console.log('AdminTimeSettings: Initializing auth listener...');
        
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          console.log('AdminTimeSettings: Auth state changed:', user ? 'User logged in' : 'No user');
          setUser(user);
          setAuthLoading(false);
          if (user) {
            console.log('AdminTimeSettings: User found, fetching time settings...');
            fetchTimeSettingsWithUser(user);
          } else {
            console.log('AdminTimeSettings: No user, showing login prompt');
          }
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('AdminTimeSettings: Error initializing auth:', error);
        setAuthLoading(false);
        setMessage('Error initializing authentication: ' + error.message);
      }
    };

    initializeAuth();
  }, []);

  // Realtime shop status updates for admin view
  useEffect(() => {
    if (!webSocketService.isConnected()) {
      webSocketService.connect(null);
    }
    const handleShop = (status) => setShopStatus(status);
    webSocketService.onShopStatusUpdate(handleShop);
    return () => webSocketService.offShopStatusUpdate(handleShop);
  }, []);

  const fetchTimeSettingsWithUser = async (authUser) => {
    if (!authUser) {
      console.log('AdminTimeSettings: No user provided for fetching settings');
      setMessage('Please log in to access time settings');
      return;
    }

    try {
      console.log('AdminTimeSettings: Starting to fetch time settings with user...');
      setLoading(true);
      const idToken = await authUser.getIdToken(true);
      console.log('AdminTimeSettings: Got auth token, making API request...');

      const response = await fetch(`${API_URL}/time-settings`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      console.log('AdminTimeSettings: API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('AdminTimeSettings: API response data:', data);
      
      if (data.success) {
        setSettings(data.data);
        setShopStatus(data.shopStatus);
        console.log('AdminTimeSettings: Settings loaded successfully');
        setMessage(''); // Clear any previous error messages
      } else {
        setMessage('Error fetching settings: ' + data.message);
      }
    } catch (error) {
      console.error('AdminTimeSettings: Error fetching time settings:', error);
      setMessage('Error fetching time settings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeSettings = async () => {
    if (!user) {
      console.log('AdminTimeSettings: No user available for fetching settings');
      setMessage('Please log in to access time settings');
      return;
    }
    return fetchTimeSettingsWithUser(user);
  };

  const handleSaveSettings = async () => {
    if (!user) {
      setMessage('Please log in to save settings');
      return;
    }

    try {
      setSaving(true);
      const idToken = await user.getIdToken(true);
      const response = await fetch(`${API_URL}/time-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(settings)
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Settings saved successfully!');
        setShopStatus(data.shopStatus);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Error saving settings: ' + data.message);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSpecialDay = async () => {
    if (!newSpecialDay.date) {
      setMessage('Please select a date for the special day');
      return;
    }

    if (!user) {
      setMessage('Please log in to add special days');
      return;
    }

    try {
      const idToken = await user.getIdToken(true);
      const response = await fetch(`${API_URL}/time-settings/special-day`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(newSpecialDay)
      });

      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
        setNewSpecialDay({
          date: '',
          isClosed: true,
          startTime: '',
          endTime: '',
          description: ''
        });
        setMessage('Special day added successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Error adding special day: ' + data.message);
      }
    } catch (error) {
      console.error('Error adding special day:', error);
      setMessage('Error adding special day');
    }
  };

  const handleRemoveSpecialDay = async (date) => {
    if (!user) {
      setMessage('Please log in to remove special days');
      return;
    }

    try {
      const idToken = await user.getIdToken(true);
      const response = await fetch(`${API_URL}/time-settings/special-day/${date}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
        setMessage('Special day removed successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Error removing special day: ' + data.message);
      }
    } catch (error) {
      console.error('Error removing special day:', error);
      setMessage('Error removing special day');
    }
  };

  const handleTimeChange = (day, type, field, value) => {
    setSettings(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-6">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">
            You need to be logged in as an admin to access time settings.
          </p>
          <button 
            onClick={() => window.location.href = '/admin/login'}
            className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        <span className="ml-2 text-gray-600">Loading time settings...</span>
      </div>
    );
  }

  return (
    // Tweak spacing to fixed mobile header: mt-20 keeps content below the fixed header; adjust pt-2 to reduce space above the title
    <div className="max-w-4xl mx-auto px-6 pb-6 space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Clock className="h-8 w-8 text-pink-500" />
          Time Settings
        </h1>
        
        {/* Shop Status Indicator */}
        <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${
          shopStatus.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          <div className={`w-3 h-3 rounded-full ${
            shopStatus.isOpen ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className="font-medium">
            {shopStatus.isOpen ? 'Shop Open' : 'Shop Closed'}
          </span>
          {!shopStatus.isOpen && formattedNextOpen && (
            <span className="text-sm">
              • Opens {formattedNextOpen}
            </span>
          )}
        </div>
      </div>

      {/* Today info (weekday/weekend and hours) */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 -mt-2">
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
          <span className="font-medium">Today:</span>
          <span className={`px-2 py-0.5 rounded-full border text-xs ${todayInfo.isWeekend ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
            {todayInfo.weekdayLong} • {todayInfo.isWeekend ? 'Weekend' : 'Weekday'}
          </span>
          <span className="text-gray-400">|</span>
          {todayInfo.closed ? (
            <span className="text-red-600">Closed today</span>
          ) : todayInfo.hours ? (
            <span>Hours: {todayInfo.hours.startTime} – {todayInfo.hours.endTime} ({settings.timezone})</span>
          ) : (
            <span>No hours configured</span>
          )}
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.includes('Error') 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          <AlertCircle className="h-5 w-5" />
          {message}
        </div>
      )}

      {/* Regular Hours */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Regular Operating Hours</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Weekday Hours */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700">Weekday Hours (Mon-Fri)</h3>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.weekday.isActive}
                onChange={(e) => handleTimeChange('weekday', 'isActive', 'isActive', e.target.checked)}
                className="w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-500"
              />
              <span className="text-sm text-gray-700">Open on weekdays</span>
            </label>

            {settings.weekday.isActive && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={settings.weekday.startTime}
                    onChange={(e) => handleTimeChange('weekday', 'startTime', 'startTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={settings.weekday.endTime}
                    onChange={(e) => handleTimeChange('weekday', 'endTime', 'endTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Weekend Hours */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700">Weekend Hours (Sat-Sun)</h3>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.weekend.isActive}
                onChange={(e) => handleTimeChange('weekend', 'isActive', 'isActive', e.target.checked)}
                className="w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-500"
              />
              <span className="text-sm text-gray-700">Open on weekends</span>
            </label>

            {settings.weekend.isActive && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={settings.weekend.startTime}
                    onChange={(e) => handleTimeChange('weekend', 'startTime', 'startTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={settings.weekend.endTime}
                    onChange={(e) => handleTimeChange('weekend', 'endTime', 'endTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
            <select
              value={settings.timezone}
              onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
              className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Special Days */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Special Days
        </h2>

        {/* Add Special Day Form */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-md font-medium text-gray-700 mb-3">Add Special Day</h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={newSpecialDay.date}
                onChange={(e) => setNewSpecialDay(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={newSpecialDay.isClosed ? 'closed' : 'custom'}
                onChange={(e) => setNewSpecialDay(prev => ({ 
                  ...prev, 
                  isClosed: e.target.value === 'closed',
                  startTime: e.target.value === 'closed' ? '' : prev.startTime,
                  endTime: e.target.value === 'closed' ? '' : prev.endTime
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="closed">Closed</option>
                <option value="custom">Custom Hours</option>
              </select>
            </div>

            {!newSpecialDay.isClosed && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newSpecialDay.startTime}
                    onChange={(e) => setNewSpecialDay(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={newSpecialDay.endTime}
                    onChange={(e) => setNewSpecialDay(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </>
            )}

            <div className="flex items-end">
              <button
                onClick={handleAddSpecialDay}
                className="w-full px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <input
              type="text"
              placeholder="e.g., Holiday, Maintenance, etc."
              value={newSpecialDay.description}
              onChange={(e) => setNewSpecialDay(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Special Days List */}
        {settings.specialDays && settings.specialDays.length > 0 ? (
          <div className="space-y-2">
            {settings.specialDays.map((day, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <span className="font-medium text-gray-900">
                      {new Date(day.date).toLocaleDateString()}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      day.isClosed 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {day.isClosed ? 'Closed' : `${day.startTime} - ${day.endTime}`}
                    </span>
                    {day.description && (
                      <span className="text-sm text-gray-600 break-words">
                        {day.description}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveSpecialDay(new Date(day.date).toISOString().split('T')[0])}
                  className="text-red-600 hover:text-red-800 p-1"
                  title="Remove special day"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No special days configured</p>
            <p className="text-sm">Add holidays, maintenance days, or custom hours above</p>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-6 py-3 bg-pink-600 text-white rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AdminTimeSettings;