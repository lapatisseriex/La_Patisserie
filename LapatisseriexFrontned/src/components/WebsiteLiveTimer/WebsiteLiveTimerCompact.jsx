import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Compact Apple-inspired timer for inline/banner display
 * Shows Indian time format with AM/PM
 */
const WebsiteLiveTimerCompact = () => {
  const [shopStatus, setShopStatus] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Fetch shop status from backend
  const fetchShopStatus = async () => {
    try {
      console.log('Fetching shop status from:', `${API_URL}/time-settings/status`);
      const response = await axios.get(`${API_URL}/time-settings/status`);
      console.log('Shop status response:', response.data);
      if (response.data.success) {
        setShopStatus(response.data.shopStatus);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching shop status:', error);
      setLoading(false);
    }
  };

  // Format time to Indian format (12-hour with AM/PM)
  const formatIndianTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch shop status on mount and every minute
  useEffect(() => {
    fetchShopStatus();
    const interval = setInterval(fetchShopStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculate time remaining
  useEffect(() => {
    if (!shopStatus) return;

    const calculateTimeRemaining = () => {
      const now = new Date();
      let targetTime;

      if (shopStatus.isOpen && shopStatus.closingTime) {
        targetTime = new Date(shopStatus.closingTime);
      } else if (!shopStatus.isOpen && shopStatus.nextOpenTime) {
        targetTime = new Date(shopStatus.nextOpenTime);
      }

      if (!targetTime) return null;

      const diff = targetTime - now;
      if (diff <= 0) {
        fetchShopStatus();
        return null;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { hours, minutes, seconds };
    };

    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [shopStatus]);

  if (loading || !shopStatus) return null;

  const isOpen = shopStatus.isOpen;

  // Get current Indian time
  const currentIndianTime = currentTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white overflow-hidden"
    >
      <div className="px-4 py-2">
        {/* Single Row Layout */}
        <div className="flex items-center justify-between gap-3">
          {/* Left: Status */}
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{
                background: isOpen ? '#733857' : '#6b7280'
              }}
            />
            <span className="text-xs font-light whitespace-nowrap" style={{ 
              color: '#1a1a1a',
              letterSpacing: '0.02em'
            }}>
              {isOpen ? 'Open' : 'Closed'}
            </span>
            {/* Breadcrumb separator */}
            <span className="text-xs font-light hidden md:inline" style={{ color: '#d1d5db' }}>•</span>
          </div>

          {/* Center: Countdown - Text format on mobile, timer on desktop */}
          {timeRemaining && (
            <>
              {/* Mobile: Text format "Shop closes in 3h 30m" */}
              <div className="md:hidden flex-1 text-center">
                <span className="text-xs font-light" style={{ color: '#1a1a1a' }}>
                  {isOpen ? 'Closes in ' : 'Opens in '}
                  <span className="font-medium">
                    {timeRemaining.hours > 0 && `${timeRemaining.hours}h `}
                    {timeRemaining.minutes}m
                  </span>
                </span>
              </div>

              {/* Desktop: Timer format with current time */}
              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-light" style={{ color: '#6b7280' }}>
                    {isOpen ? 'Closes in' : 'Opens in'}
                  </span>
                  <div className="flex items-center gap-1">
                    <motion.span
                      key={`h-${timeRemaining.hours}`}
                      initial={{ y: -3, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="text-lg font-light tabular-nums"
                      style={{ color: '#1a1a1a' }}
                    >
                      {String(timeRemaining.hours).padStart(2, '0')}
                    </motion.span>
                    <span className="text-xs" style={{ color: '#d1d5db' }}>:</span>
                    <motion.span
                      key={`m-${timeRemaining.minutes}`}
                      initial={{ y: -3, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="text-lg font-light tabular-nums"
                      style={{ color: '#1a1a1a' }}
                    >
                      {String(timeRemaining.minutes).padStart(2, '0')}
                    </motion.span>
                    <span className="text-xs" style={{ color: '#d1d5db' }}>:</span>
                    <motion.span
                      key={`s-${timeRemaining.seconds}`}
                      initial={{ y: -3, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="text-lg font-light tabular-nums"
                      style={{ color: '#1a1a1a' }}
                    >
                      {String(timeRemaining.seconds).padStart(2, '0')}
                    </motion.span>
                  </div>
                </div>
                
                {/* Breadcrumb separator */}
                <span className="text-xs font-light" style={{ color: '#d1d5db' }}>•</span>
                
                {/* Current Time - Desktop only */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Clock className="w-3 h-3" style={{ color: '#6b7280' }} />
                  <span className="text-xs font-light tabular-nums" style={{ color: '#6b7280' }}>
                    {currentIndianTime}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Right: Operating hours - Mobile only */}
          {shopStatus.operatingHours && (
            <span className="md:hidden text-[10px] font-light whitespace-nowrap" style={{ color: '#6b7280' }}>
              {formatIndianTime(shopStatus.operatingHours.startTime)}-{formatIndianTime(shopStatus.operatingHours.endTime)}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Accent Line */}
      {isOpen && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="h-0.5"
          style={{
            background: 'linear-gradient(135deg, #733857 0%, #8d4466 50%, #412434 100%)',
            transformOrigin: 'left'
          }}
        />
      )}
    </motion.div>
  );
};

export default WebsiteLiveTimerCompact;
