import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../context/LocationContext/LocationContext';
import { useHostel } from '../../context/HostelContext/HostelContext';

const DebugUserState = () => {
  const { user, isAuthenticated } = useAuth();
  const { locations } = useLocation();
  const { hostels } = useHostel();

  // Get cached data from localStorage
  let cachedUser = null;
  try {
    const cached = localStorage.getItem('cachedUser');
    if (cached) cachedUser = JSON.parse(cached);
  } catch (error) {
    // Ignore parsing errors
  }

  if (!isAuthenticated || !user) {
    return (
      <div style={{ 
        position: 'fixed', 
        top: '10px', 
        right: '10px', 
        background: 'rgba(0,0,0,0.8)', 
        color: 'white', 
        padding: '10px', 
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 9999,
        maxWidth: '400px'
      }}>
        <strong>Debug: Not authenticated</strong>
        {cachedUser && (
          <><br/><strong>Cached Data Available:</strong> Yes</>
        )}
      </div>
    );
  }

  const locationObj = user.location;
  const hostelObj = user.hostel;
  
  const locationDetails = typeof locationObj === 'object' 
    ? `${locationObj?.area || 'No area'}, ${locationObj?.city || 'No city'}` 
    : locationObj 
      ? `ID: ${locationObj} (${locations.find(l => l._id === locationObj)?.area || 'Not found'})`
      : 'null/undefined';
    
  const hostelDetails = typeof hostelObj === 'object'
    ? hostelObj?.name || 'No name'
    : hostelObj
      ? `ID: ${hostelObj} (${hostels.find(h => h._id === hostelObj)?.name || 'Not found'})`
      : 'null/undefined';

  // Cached data details
  const cachedLocationDetails = cachedUser?.location
    ? (typeof cachedUser.location === 'object' 
        ? `${cachedUser.location?.area}, ${cachedUser.location?.city}`
        : `ID: ${cachedUser.location}`)
    : 'null/undefined';
    
  const cachedHostelDetails = cachedUser?.hostel
    ? (typeof cachedUser.hostel === 'object'
        ? cachedUser.hostel?.name
        : `ID: ${cachedUser.hostel}`)
    : 'null/undefined';

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'rgba(0,0,0,0.9)', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '10px',
      zIndex: 9999,
      maxWidth: '400px',
      maxHeight: '400px',
      overflow: 'auto'
    }}>
      <strong style={{color: '#ffd700'}}>🐛 Debug User State:</strong><br/>
      <strong>User:</strong> {user.name || user.phone}<br/>
      
      <br/><strong style={{color: '#87CEEB'}}>🔄 Current State:</strong><br/>
      <strong>Location:</strong> {locationDetails}<br/>
      <strong>Hostel:</strong> {hostelDetails}<br/>
      
      <br/><strong style={{color: '#98FB98'}}>💾 Cached Data:</strong><br/>
      <strong>Location:</strong> {cachedLocationDetails}<br/>
      <strong>Hostel:</strong> {cachedHostelDetails}<br/>
      
      <br/><strong style={{color: '#FFB6C1'}}>📊 Context Data:</strong><br/>
      <strong>Locations loaded:</strong> {locations?.length || 0}<br/>
      <strong>Hostels loaded:</strong> {hostels?.length || 0}<br/>
      
      <br/><strong style={{color: '#DDA0DD'}}>🔍 Raw Types:</strong><br/>
      State - Loc: {typeof locationObj}, Host: {typeof hostelObj}<br/>
      Cache - Loc: {typeof cachedUser?.location}, Host: {typeof cachedUser?.hostel}<br/>
      
      <br/><strong style={{color: '#FFA500'}}>🏠 Expected Header Display:</strong><br/>
      {locationObj && hostelObj ? `${hostelObj.name}, ${locationObj.area}` : 'Select Location'}<br/>
      
      {(() => {
        // More sophisticated mismatch detection
        const locationMismatch = JSON.stringify(locationObj) !== JSON.stringify(cachedUser?.location);
        const hostelMismatch = JSON.stringify(hostelObj) !== JSON.stringify(cachedUser?.hostel);
        
        if (locationMismatch || hostelMismatch) {
          return <><br/><strong style={{color: '#FF6347'}}>⚠️ DATA MISMATCH: {locationMismatch ? 'Location' : ''} {hostelMismatch ? 'Hostel' : ''}</strong></>;
        }
        return <><br/><strong style={{color: '#90EE90'}}>✅ DATA IN SYNC</strong></>;
      })()}
      
      <br/><button 
        onClick={() => {
          localStorage.removeItem('cachedUser');
          localStorage.removeItem('profileFormData');
          localStorage.removeItem('savedUserData');
          window.location.reload();
        }}
        style={{
          background: '#dc3545',
          color: 'white',
          border: 'none',
          padding: '4px 8px',
          borderRadius: '3px',
          fontSize: '9px',
          cursor: 'pointer',
          marginTop: '5px'
        }}
      >
        🗑️ Clear Cache & Reload
      </button>
    </div>
  );
};

export default DebugUserState;