import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { useLocation } from '../../../context/LocationContext/LocationContext';
import { MapPin, Check } from 'lucide-react';
import DebugUserData from './DebugUserData';

const Profile = () => {
  const { user, updateProfile, authError, loading, isNewUser } = useAuth();
  const { locations, loading: locationsLoading, fetchLocations } = useLocation();
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Initialize form with user values if available
  const [formData, setFormData] = useState({
    name: user?.name || '',
    dob: user?.dob || '',
    location: user?.location?._id || ''
  });
  
  // Debug initial form data
  console.log("Initial form data:", formData);
  console.log("Initial user data:", user);
  
  // Fetch locations only once on mount
  // Use a ref to track if locations have been fetched
  const hasRunLocationsFetch = useRef(false);
  
  useEffect(() => {
    // Only fetch locations if they haven't been fetched yet
    if (!hasRunLocationsFetch.current) {
      console.log("Fetching locations...");
      fetchLocations().then(result => {
        console.log("Locations fetched:", result);
        
        // Ensure locations were loaded successfully
        if (result && result.length > 0) {
          // If user has no location selected yet but we have locations, select the first one by default
          if (!formData.location && result.length > 0) {
            setFormData(prev => ({
              ...prev,
              location: result[0]._id
            }));
          }
        }
        // Mark as fetched
        hasRunLocationsFetch.current = true;
      });
    }
  }, []);

  // Format today's date for max value in date input
  const today = new Date().toISOString().split('T')[0];
  
  // Clear local error when authError changes
  useEffect(() => {
    if (authError) {
      setLocalError(authError);
      setSuccessMessage('');
    } else {
      setLocalError('');
    }
  }, [authError]);
  
  // Debug user information
  useEffect(() => {
    if (user) {
      console.log('Profile Component - User Data:', {
        user,
        name: user.name,
        dob: user.dob,
        location: user.location,
        locationId: user.location?._id
      });
    }
  }, [user]);

  // Track previous user data to avoid unnecessary updates
  const prevUserRef = useRef({
    name: null,
    dob: null,
    locationId: null
  });
  
  // useEffect to sync form data with user data - run ONLY ONCE when component mounts
  const userDataInitialized = useRef(false);
  
  useEffect(() => {
    // Only run this once when the user data is first available
    if (user && !userDataInitialized.current) {
      // Get current values
      const currentName = user.name || '';
      const currentLocationId = typeof user.location === 'object' ? user.location?._id : user.location;
      
      console.log('Setting initial form data with:', {
        name: currentName,
        dob: user.dob,
        locationObject: user.location,
        locationId: currentLocationId
      });
      
      // Format date correctly for the date input
      let formattedDob = '';
      if (user.dob) {
        try {
          // Try to format the date if it's a valid date string
          const dobDate = new Date(user.dob);
          if (!isNaN(dobDate.getTime())) {
            formattedDob = dobDate.toISOString().split('T')[0];
          } else {
            formattedDob = user.dob; // Use as is if not a valid date
          }
        } catch (error) {
          console.error("Error formatting date:", error);
          formattedDob = user.dob; // Use as is if there's an error
        }
      }
      
      // Set the form data once
      setFormData({
        name: currentName,
        dob: formattedDob,
        location: currentLocationId || ''
      });
      
      // Store the initial values
      prevUserRef.current = {
        name: currentName,
        dob: user.dob,
        locationId: currentLocationId
      };
      
      // Mark as initialized
      userDataInitialized.current = true;
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Check if we're in the Auth Modal or standalone page
  const isStandalonePage = window.location.pathname === "/profile";

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setLocalError('Please enter your full name');
      return;
    }
    
    if (!formData.dob) {
      setLocalError('Please enter your date of birth');
      return;
    }
    
    if (!formData.location) {
      setLocalError('Please select your delivery location');
      return;
    }
    
    // Reset error and success message
    setLocalError('');
    setSuccessMessage('');
    
    // Create a copy of the form data to submit
    const profileData = {
      ...formData,
      // Ensure the date is properly formatted
      dob: formData.dob, // The date input already provides a valid ISO date string
    };
    
    console.log("Submitting profile data:", profileData);
    
    // Update profile
    const success = await updateProfile(profileData);
    
    if (success) {
      setSuccessMessage('Profile updated successfully!');
      // On standalone page, success message will persist
      // In modal, it might be cleared when the auth panel is closed
    }
  };

  return (
    <div className="py-6">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="flex flex-col items-center mb-2">
          <img src="/images/logo.png" alt="Dessertify Logo" className="h-16 w-16 mb-3" />
          <h2 className="text-2xl font-bold text-cakeBrown">
            {isNewUser ? 'Complete Your Profile' : 'Your Profile'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {isNewUser 
              ? 'Just a few more details to get started' 
              : 'Update your information below'
            }
          </p>
          
          {/* Profile completion notice for new users */}
          {isNewUser && (
            <div className="mt-3 bg-amber-50 p-3 rounded-md text-left">
              <p className="text-sm text-amber-800 flex items-start">
                <span className="mr-2 mt-0.5 text-amber-600">⚠️</span>
                <span>
                  Your account was created after phone verification, but we need 
                  these additional details to complete your profile.
                </span>
              </p>
            </div>
          )}
          
          {/* Success message */}
          {successMessage && (
            <div className="mt-3 bg-green-50 p-3 rounded-md text-left">
              <p className="text-sm text-green-800 flex items-center">
                <Check className="w-4 h-4 mr-2 text-green-600" />
                {successMessage}
              </p>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-cakeBrown">
            Full Name
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full border-2 border-cakeBrown/30 pl-10 py-3 px-4 rounded-md focus:outline-none focus:border-cakePink focus:ring-1 focus:ring-cakePink transition-colors"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="dob" className="block text-sm font-medium text-cakeBrown">
            Date of Birth
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
            <input
              type="date"
              id="dob"
              name="dob"
              value={formData.dob || ''}
              onChange={handleChange}
              max={today}
              required
              disabled={loading}
              className="w-full border-2 border-cakeBrown/30 pl-10 py-3 px-4 rounded-md focus:outline-none focus:border-cakePink focus:ring-1 focus:ring-cakePink transition-colors"
            />
            {formData.dob && (
              <div className="mt-2 text-xs text-gray-500">
                Selected date: {formData.dob}
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="location" className="block text-sm font-medium text-cakeBrown">
            Delivery Location
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
              <MapPin className="h-5 w-5" />
            </span>
            <select
              id="location"
              name="location"
              value={formData.location || ''}
              onChange={handleChange}
              required
              disabled={loading || locationsLoading}
              className="w-full border-2 border-cakeBrown/30 pl-10 py-3 px-4 rounded-md focus:outline-none focus:border-cakePink focus:ring-1 focus:ring-cakePink transition-colors appearance-none"
            >
              <option value="">Select delivery location</option>
              {locations && locations.length > 0 ? (
                locations.map(location => (
                  <option key={location._id} value={location._id}>
                    {location.area}, {location.city} - {location.pincode}
                    {user?.location?._id === location._id && " (Current)"}
                  </option>
                ))
              ) : (
                <option value="" disabled>Loading locations...</option>
              )}
            </select>
            {/* Debug location data */}
            <div className="mt-1 text-xs text-gray-500">
              {formData.location && `Selected location ID: ${formData.location}`}
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <p className="text-amber-600 text-sm italic">
            Currently, we deliver only to the available locations shown above.
          </p>
        </div>
        
        {localError && (
          <p className="text-red-500 text-sm">{localError}</p>
        )}
        
        {/* Missing fields warning */}
        {(!formData.name.trim() || !formData.dob || !formData.location) && (
          <div className="bg-amber-50 p-3 rounded-md">
            <p className="text-sm text-amber-800">
              <span className="font-medium">Please complete all fields:</span>
              <ul className="mt-1 ml-4 list-disc">
                {!formData.name.trim() && <li>Full name is required</li>}
                {!formData.dob && <li>Date of birth is required</li>}
                {!formData.location && <li>Delivery location is required</li>}
              </ul>
            </p>
          </div>
        )}
        
        <button 
          type="submit" 
          disabled={loading || !formData.name.trim() || !formData.dob || !formData.location}
          className={`w-full bg-cakePink text-white py-3 px-4 rounded-md transition-colors shadow-md ${
            loading || !formData.name.trim() || !formData.dob || !formData.location
              ? 'opacity-60 cursor-not-allowed' 
              : 'hover:bg-cakePink-dark'
          }`}
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
        
        {/* Debug component for development */}
        {/* <DebugUserData user={user} formData={formData} locations={locations} /> */}
      </form>
    </div>
  );
};

export default Profile;
