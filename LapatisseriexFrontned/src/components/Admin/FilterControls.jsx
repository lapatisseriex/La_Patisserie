import React, { useRef, useEffect, useState } from 'react';
import { Calendar, Filter, RefreshCw, TestTube } from 'lucide-react';

// Dynamic Time Component for Last Updated display
const DynamicLastUpdated = ({ timestamp }) => {
  const [timeText, setTimeText] = useState('');
  const timerRef = useRef(null);

  const calculateTimeText = () => {
    if (!timestamp) return '';
    const now = new Date();
    const diff = Math.floor((now - timestamp) / 1000); // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return timestamp.toLocaleDateString();
  };

  useEffect(() => {
    // Initial calculation
    setTimeText(calculateTimeText());

    // Update every minute
    timerRef.current = setInterval(() => {
      setTimeText(calculateTimeText());
    }, 60000);

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timestamp]);

  return timeText;
};

const FilterControls = ({ 
  selectedPeriod, 
  setSelectedPeriod, 
  selectedTrendPeriod, 
  setSelectedTrendPeriod, 
  onRefresh, 
  loading,
  lastUpdated,
  onTestHostels
}) => {
  const periodOptions = [
    { value: '7', label: 'Last 7 Days' },
    { value: '30', label: 'Last 30 Days' },
    { value: '90', label: 'Last 3 Months' },
    { value: '365', label: 'Last Year' },
  ];

  const trendOptions = [
    { value: 'day', label: 'Daily' },
    { value: 'week', label: 'Weekly' },
    { value: 'month', label: 'Monthly' },
  ];

  return (
    <div className="bg-white border border-gray-300 shadow-sm p-8 mb-8">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="text-gray-700" size={18} />
            <h2 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Analytics Filters</h2>
          </div>
          {lastUpdated && (
            <span className="text-xs text-gray-500">
              Updated: <DynamicLastUpdated timestamp={lastUpdated} />
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
          {/* Period Filter */}
          <div className="flex items-center space-x-3">
            <Calendar className="text-gray-600" size={16} />
            <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">Period:</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-white border border-gray-300 text-gray-900 text-sm px-3 py-2 focus:border-gray-500 focus:outline-none"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Trend Period Filter */}
          <div className="flex items-center space-x-3">
            <TestTube className="text-gray-600" size={16} />
            <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">Trend:</label>
            <select
              value={selectedTrendPeriod}
              onChange={(e) => setSelectedTrendPeriod(e.target.value)}
              className="bg-white border border-gray-300 text-gray-900 text-sm px-3 py-2 focus:border-gray-500 focus:outline-none"
            >
              {trendOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center space-x-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white px-4 py-2 border border-gray-900 focus:outline-none"
          >
            <RefreshCw 
              className={`${loading ? 'animate-spin' : ''}`} 
              size={16} 
            />
            <span className="text-xs font-medium uppercase tracking-wide">
              {loading ? 'Updating...' : 'Refresh'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterControls;