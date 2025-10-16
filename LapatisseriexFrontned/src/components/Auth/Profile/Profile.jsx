import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useSelector } from 'react-redux';
import { useLocation } from '../../../context/LocationContext/LocationContext';
import { useLocation as useRouterLocation } from 'react-router-dom';
import { useHostel } from '../../../context/HostelContext/HostelContext';
import ProfileImageUpload from './ProfileImageUpload';
import GlobalLoadingOverlay from '../../common/GlobalLoadingOverlay';
import axios from 'axios';
import { 
  User, 
  Phone, 
  Calendar, 
  Heart, 
  MapPin, 
  Flag,
  Check,
  ChevronDown,
  Building,
  Edit3,
  Save,
  X,
  Mail,
  Cake,
  MapPinned,
  Shield,
  Award,
  Sparkles
} from 'lucide-react';
import EmailVerification from './EmailVerification';
import PhoneVerification from './PhoneVerification';

const Profile = () => {
  const { user, updateProfile, authError, loading, isNewUser, updateUser, getCurrentUser } = useAuth();
  const { locations, loading: locationsLoading, fetchLocations } = useLocation();
  const { hostels, loading: hostelsLoading, fetchHostelsByLocation, clearHostels } = useHostel();
  const routerLocation = useRouterLocation();
  const currentUser = useSelector(state => state.auth.user);
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Local saving state for more control
  
  // Common CSS classes for form fields
  const inputClasses = `w-full pl-10 pr-4 py-3 border border-gray-300 rounded-none 
    focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-300
    hover:border-gray-400 focus:shadow-md ${!isEditMode ? 'bg-gray-50 text-gray-700' : 'animate-fadeIn'}`;
  
  const selectClasses = `w-full pl-10 pr-8 py-3 border border-gray-300 rounded-none 
    focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-300
    hover:border-gray-400 focus:shadow-md appearance-none ${!isEditMode ? 'bg-gray-50 text-gray-700' : 'animate-fadeIn'}`;
  
  // Initialize form with expanded user data
  // Helper function to create initial form data (also useful when adding new fields in the future)
  const createInitialFormData = (userData = {}, savedData = {}) => {
    // Log the input data for debugging
    console.log('Creating initial form data with:');
    console.log('User data:', userData);
    console.log('Saved data:', savedData);

    // Extract IDs from userData if they are objects
    const userLocationId = typeof userData.location === 'object' ? userData.location?._id || '' : userData.location || '';
    const userHostelId = typeof userData.hostel === 'object' ? userData.hostel?._id || '' : userData.hostel || '';

    console.log('Extracted user location ID:', userLocationId, 'from:', userData.location);
    console.log('Extracted user hostel ID:', userHostelId, 'from:', userData.hostel);

    const result = {
      // Personal information
      name: savedData.name || userData.name || '',
      phone: userData.phone || '',  // Phone cannot be changed
      email: savedData.email || userData.email || '',
      dob: savedData.dob || (userData.dob ? formatDate(userData.dob) : ''),
      gender: savedData.gender || userData.gender || '',
      anniversary: savedData.anniversary || (userData.anniversary ? formatDate(userData.anniversary) : ''),

      // Location information
      country: savedData.country || userData.country || 'India',
      location: savedData.location || userLocationId,  // Prioritize savedData.location (now as ID), fallback to extracted ID
      hostel: savedData.hostel || userHostelId,  // Prioritize savedData.hostel (now as ID), fallback to extracted ID
    };

    console.log('Final hostel data (should be ID):', result.hostel, 'type:', typeof result.hostel);
    console.log('Final location data (should be ID):', result.location, 'type:', typeof result.location);

    return result;
  };

  // Format date helper function (moved here for clarity)
  const formatDate = (dateValue) => {
    if (!dateValue) return '';
    try {
      const date = new Date(dateValue);
      return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : '';
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Get saved user data from localStorage
  const savedUserData = JSON.parse(localStorage.getItem('savedUserData') || '{}');
  
    // Log for debugging
    console.log('Profile component initializing with:');
    console.log('User data:', user);
    console.log('Saved user data:', savedUserData);
    console.log('Hostel persistence check - savedUserData.hostel:', savedUserData.hostel, 'type:', typeof savedUserData.hostel);
  
  // Initialize form data with user and saved data
  const [formData, setFormData] = useState(createInitialFormData(user, savedUserData));
  
  // Fetch locations only once on mount
  const hasRunLocationsFetch = useRef(false);

  // Effect to react to user state changes (especially phone verification)
  useEffect(() => {
    if (user) {
      console.log('Profile - User state change detected:', {
        phoneVerified: user.phoneVerified,
        phoneVerifiedAt: user.phoneVerifiedAt,
        phone: user.phone,
        userUid: user.uid
      });
      
      // Update form data with latest user state to reflect any changes
      // This is particularly important for phone verification status
      const updatedFormData = createInitialFormData(user, savedUserData);
      setFormData(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(updatedFormData)) {
          console.log('Profile - Updating form data due to user state change');
          return updatedFormData;
        }
        return prev;
      });
    }
  }, [user?.phoneVerified, user?.phoneVerifiedAt, user?.phone, user?.uid, user?.name, user?.email]);
  
  useEffect(() => {
    if (!hasRunLocationsFetch.current) {
      fetchLocations().then(result => {
        if (result && result.length > 0) {
          if (!formData.location && result.length > 0) {
            setFormData(prev => ({
              ...prev,
              location: result[0]._id
            }));
          }
        }
        hasRunLocationsFetch.current = true;
      });
    }
  }, []);

  // Fetch hostels on mount if location exists (for display in read-only view)
  useEffect(() => {
    if (formData.location && hostels.length === 0 && !hostelsLoading && !isEditMode) {
      console.log('Fetching hostels on profile load - location already selected:', formData.location);
      fetchHostelsByLocation(formData.location).catch(error => {
        console.error('Error fetching hostels on profile load:', error);
      });
    }
  }, []); // Only run once on mount

  // Fetch hostels when location changes
  useEffect(() => {
    if (formData.location) {
      console.log('Fetching hostels for location:', formData.location);
      fetchHostelsByLocation(formData.location).then(hostelsData => {
        console.log('Fetched hostels:', hostelsData);
        if (formData.hostel && hostelsData.length > 0) {
          // Check if current hostel exists in the fetched data
          const currentHostelExists = hostelsData.find(h => h._id === formData.hostel);
          if (!currentHostelExists) {
            console.log('Current hostel not found in fetched data, clearing selection');
            setFormData(prev => ({
              ...prev,
              hostel: ''
            }));
          } else {
            console.log('Current hostel verified:', formData.hostel);
          }
        }
      }).catch(error => {
        console.error('Error fetching hostels:', error);
      });
    } else {
      clearHostels();
      setFormData(prev => ({
        ...prev,
        hostel: ''
      }));
    }
  }, [formData.location]);

  // Fetch hostels when entering edit mode if location is already selected
  // This ensures fresh data from context even if hostel was previously selected
  useEffect(() => {
    if (isEditMode && formData.location && !hostelsLoading) {
      console.log('Entering edit mode - ensuring hostels are fetched for location:', formData.location);
      fetchHostelsByLocation(formData.location).then(hostelsData => {
        console.log('Fresh hostels fetched for edit mode:', hostelsData);
        if (formData.hostel && hostelsData.length > 0) {
          const currentHostelExists = hostelsData.find(h => h._id === formData.hostel);
          if (!currentHostelExists) {
            console.log('Saved hostel not found in fresh data, it will be cleared if location changes');
            // Don't clear here, let the user handle it if they change location
          } else {
            console.log('Saved hostel verified in fresh data:', formData.hostel);
          }
        }
      }).catch(error => {
        console.error('Error fetching fresh hostels for edit mode:', error);
      });
    }
  }, [isEditMode, formData.location]);

  // Format today's date for max value in date inputs
  const today = new Date().toISOString().split('T')[0];
  
  // Restore edit mode state from localStorage if available
  useEffect(() => {
    const savedEditMode = localStorage.getItem('profileEditMode');
    if (savedEditMode === 'true') {
      setIsEditMode(true);
      
      // If in edit mode, try to recover form data from localStorage
      try {
        const savedFormData = localStorage.getItem('profileFormData');
        if (savedFormData) {
          const parsedFormData = JSON.parse(savedFormData);
          console.log('Recovering form data after refresh:', parsedFormData);
          
          // First get cached user data for fallback
          let cachedUserData = {};
          try {
            const cachedUser = localStorage.getItem('cachedUser');
            if (cachedUser) {
              cachedUserData = JSON.parse(cachedUser);
            }
          } catch (err) {
            console.error('Error parsing cached user:', err);
          }
          
          // Make sure email is always available
          if (!parsedFormData.email) {
            if (cachedUserData.email) {
              parsedFormData.email = cachedUserData.email;
            } else if (user?.email) {
              parsedFormData.email = user.email;
            }
            console.log('Email missing in saved form data, using fallback email:', parsedFormData.email);
          }
          
          // Make sure all date fields are correctly formatted
          if (parsedFormData.dob && !(parsedFormData.dob instanceof String) && typeof parsedFormData.dob !== 'string') {
            parsedFormData.dob = formatDate(parsedFormData.dob);
          }
          
          if (parsedFormData.anniversary && !(parsedFormData.anniversary instanceof String) && typeof parsedFormData.anniversary !== 'string') {
            parsedFormData.anniversary = formatDate(parsedFormData.anniversary);
          }
          
          // Use our helper function for consistent form data recovery
          const mergedUserData = {
            ...user,
            ...cachedUserData,
            location: typeof user?.location === 'object' ? user?.location?._id || '' : user?.location || '',
            hostel: typeof user?.hostel === 'object' ? user?.hostel?._id || '' : user?.hostel || '',
          };
          
          const restoredForm = createInitialFormData(mergedUserData, parsedFormData);
          console.log('Restored form data with anniversary:', restoredForm);
          setFormData(restoredForm);
          
          // Re-save the complete form data to localStorage to ensure consistency
          const dataToCache = {
            ...restoredForm
          };
          localStorage.setItem('profileFormData', JSON.stringify(dataToCache));
        }
      } catch (error) {
        console.error('Error recovering form data:', error);
      }
    }
  }, []);

  // Clear local error when authError changes
  useEffect(() => {
    if (authError) {
      setLocalError(authError);
      setSuccessMessage('');
    } else {
      setLocalError('');
    }
  }, [authError]);
  
  // Debug helper to verify form data
  useEffect(() => {
    console.log('CURRENT FORM DATA STATE:', {
      ...formData,
      isEditMode
    });
    
  console.log('Anniversary date field:', formData.anniversary);
  // Email field logging removed
    
    try {
      const savedFormData = localStorage.getItem('profileFormData');
      if (savedFormData) {
        const parsed = JSON.parse(savedFormData);
        console.log('LOCALSTORAGE profileFormData:', {
          ...parsed,
          anniversary: parsed.anniversary || 'NOT SET'
        });
      }
    } catch (err) {
      console.error('Error checking localStorage:', err);
    }
  }, [formData, isEditMode]);

  // Cleanup effect to reset edit mode when component unmounts
  useEffect(() => {
    return () => {
      // Reset edit mode in localStorage when component unmounts
      localStorage.removeItem('profileEditMode');
      localStorage.removeItem('profileFormData');
      console.log('Profile component cleanup: Reset edit mode and cleared form data');
    };
  }, []);

  // Effect to reset edit mode when navigating away from profile section
  useEffect(() => {
    const currentPath = routerLocation.pathname;
    
    // Check if user navigated away from profile-related pages
    if (!currentPath.includes('/profile')) {
      if (isEditMode) {
        console.log('User navigated away from profile, resetting edit mode');
        setIsEditMode(false);
        localStorage.removeItem('profileEditMode');
        localStorage.removeItem('profileFormData');
      }
    }
  }, [routerLocation.pathname, isEditMode]);
  
  // useEffect to handle user state changes (like phone verification)
  useEffect(() => {
    console.log('Profile - User state changed, updating form data:', {
      uid: user?.uid,
      phoneVerified: user?.phoneVerified,
      phone: user?.phone,
      phoneVerifiedAt: user?.phoneVerifiedAt
    });
    
    // Update form data when user verification status changes
    if (user) {
      setFormData(prevFormData => ({
        ...prevFormData,
        phone: user.phone || prevFormData.phone,
        // Keep other fields as they were
      }));
    }
  }, [user?.phoneVerified, user?.phone, user?.phoneVerifiedAt]);

  // useEffect to sync form data with user data
  const userDataInitialized = useRef(false);
  
  useEffect(() => {
    const fetchFreshUserData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.data.success) {
            localStorage.setItem('cachedUser', JSON.stringify(response.data.user));
            console.log('Fetched fresh user data from server:', response.data.user);
            localStorage.removeItem('profileFormData');
          }
        }
      } catch (error) {
        console.error('Error fetching fresh user data:', error);
      }
    };
    
    if (!userDataInitialized.current) {
      fetchFreshUserData();
    }
    
    if (user) {
      const currentLocationId = typeof user.location === 'object' ? user.location?._id : user.location;
      const currentHostelId = typeof user.hostel === 'object' ? user.hostel?._id : user.hostel;
      
      // COMPREHENSIVE DATA RECOVERY: Try all possible sources for profile data
      // First, get cached user data from localStorage
      let cachedUserData = {};
      try {
        const cachedUser = localStorage.getItem('cachedUser');
        if (cachedUser) {
          cachedUserData = JSON.parse(cachedUser) || {};
        }
      } catch (error) {
        console.error('Error parsing cached user data:', error);
        cachedUserData = {};
      }
      
      // Then, check for saved form data (has highest priority)
      let savedFormData = {};
      try {
        const profileFormData = localStorage.getItem('profileFormData');
        if (profileFormData) {
          savedFormData = JSON.parse(profileFormData) || {};
          console.log('Recovered saved form data:', savedFormData);
        }
      } catch (error) {
        console.error('Error recovering form data from localStorage:', error);
        savedFormData = {};
      }
      
      // Now use our helper function to create the initial form data with proper precedence:
      // savedFormData > cachedUserData > user object from backend
      
      // First merge cachedUserData with the user object
      const mergedUserData = {
        ...user,
        ...cachedUserData,
        // Keep the nested objects properly formatted
        location: currentLocationId || '',
        hostel: currentHostelId || '',
      };
      
      // Then create the form data with proper precedence
      const initialFormData = createInitialFormData(mergedUserData, savedFormData);
      console.log('Setting initial form data:', initialFormData);
      
      // Update form data state
      setFormData(initialFormData);
      
      // Save the complete form data to localStorage for refresh protection
      const dataToCache = {
        ...initialFormData
      };
      localStorage.setItem('profileFormData', JSON.stringify(dataToCache));
      
      console.log('Form data initialized completely with all fields preserved');
      
      userDataInitialized.current = true;
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for date fields to ensure proper formatting
    let processedValue = value;
    
    if ((name === 'dob' || name === 'anniversary') && value) {
      // Ensure date fields are properly formatted as strings
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          processedValue = date.toISOString().split('T')[0];
          console.log(`Formatted ${name} date:`, processedValue);
        }
      } catch (err) {
        console.error(`Error formatting ${name}:`, err);
      }
    }
    
    // Update form data
    setFormData({
      ...formData,
      [name]: processedValue
    });
    
    if (name === 'location') {
      setFormData(prev => ({
        ...prev,
        location: processedValue,
        hostel: ''
      }));
    }
    
    // If we're in edit mode, immediately update localStorage for persistence
    // This ensures even partial changes are saved during editing
    if (isEditMode && (name === 'anniversary' || name === 'dob')) {
      const currentData = {
        ...formData,
        [name]: processedValue
      };
      localStorage.setItem('profileFormData', JSON.stringify(currentData));
      console.log(`Updated ${name} in localStorage:`, processedValue);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setLocalError('Please enter your full name');
      return;
    }
    
    setLocalError('');
    setSuccessMessage('');
    
    // Set loading state to show animations
    setIsSaving(true);
    console.log('🔄 Setting isSaving to TRUE'); // Debug log
    
    // Scroll to the top to make loading indicator visible
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Create a clean copy of form data with date fields properly formatted
    const profileData = { 
      ...formData,
      // Ensure date fields are properly formatted
      dob: typeof formData.dob === 'string' ? formData.dob : formatDate(formData.dob),
      anniversary: typeof formData.anniversary === 'string' ? formData.anniversary : formatDate(formData.anniversary),
      // Include phone verification data if user has verified phone
      ...(user?.phoneVerified && {
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        phoneVerifiedAt: user.phoneVerifiedAt
      })
    };
    
    // Save complete form data to localStorage for refresh protection
    const formDataToSave = {
      ...profileData
    };
    
    // Log the data being saved
    console.log('Saving complete form data with anniversary:', formDataToSave.anniversary);
    localStorage.setItem('profileFormData', JSON.stringify(formDataToSave));
    
    console.log('Submitting profile data (email omitted from update):', { ...profileData, email: undefined });
    console.log('Gender being submitted:', profileData.gender);
    console.log('Hostel data being submitted:', profileData.hostel, 'type:', typeof profileData.hostel);
    
    try {
      // Check if this is the admin's profile
      const isAdmin = user?.role === 'admin';
      console.log('Is admin user:', isAdmin);
      
      // Fetch latest user data to ensure we have current phone verification status
      console.log('Fetching latest user data before save to include phone verification...');
      await getCurrentUser();
      
      // Merge form data with any verified phone data from backend
      const finalProfileData = {
        ...profileData,
        ...(currentUser?.phoneVerified && {
          phone: currentUser.phone,
          phoneVerified: currentUser.phoneVerified,
          phoneVerifiedAt: currentUser.phoneVerifiedAt
        })
      };
      
      // Omit email from update payload
      const { email, ...profileDataWithoutEmail } = finalProfileData;
      const success = await updateProfile(profileDataWithoutEmail);

      if (success) {
        // Show success message
        setSuccessMessage('Profile updated successfully!');
        
        // Wait a moment to show success, then exit edit mode
        setTimeout(() => {
          setIsEditMode(false);
          localStorage.removeItem('profileEditMode');
          // Scroll to top to show success message
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1000);

        // Save user data to localStorage
        const savedUserData = JSON.parse(localStorage.getItem('savedUserData') || '{}');
        savedUserData.location = formData.location;
        savedUserData.hostel = formData.hostel;
        savedUserData.anniversary = formData.anniversary;
        localStorage.setItem('savedUserData', JSON.stringify(savedUserData));
        console.log('Permanently saved location and hostel to savedUserData:', savedUserData.location, savedUserData.hostel);

        // Update cached user data
        const cachedUser = JSON.parse(localStorage.getItem('cachedUser') || '{}');
        cachedUser.anniversary = formData.anniversary || cachedUser.anniversary || '';
        localStorage.setItem('cachedUser', JSON.stringify(cachedUser));
        
        console.log('Successfully updated profile, preserved email and anniversary in cache');
        
        // For admin users, refresh user data from server
        if (isAdmin) {
          try {
            const token = localStorage.getItem('authToken');
            if (token) {
              const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              if (response.data.success) {
                localStorage.setItem('cachedUser', JSON.stringify(response.data.user));
                console.log('Admin refreshed own user data from server:', response.data.user);
              }
            }
          } catch (error) {
            console.error('Error refreshing admin user data:', error);
          }
        }
      } else {
        setLocalError('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error in profile update:', error);
      setLocalError('Failed to update profile. Please try again.');
    } finally {
      // Ensure loading state is visible for a minimum time
      setTimeout(() => {
        console.log('🛑 Setting isSaving to FALSE'); // Debug log
        setIsSaving(false);
      }, 1000); // Minimum 1 second to show loading animation
    }
  };

  const handleCancel = () => {
    if (user) {
      // IMPORTANT: Instead of resetting to user values completely, we need to preserve
      // certain fields like email and anniversary from the current form data
      
      // Get the current form data values we want to preserve
  const currentEmail = user.email || '';
      const currentAnniversary = formData.anniversary || formatDate(user.anniversary) || '';
  // Email verification flow removed; preserve existing form values only
      
      // Log current values to verify we're preserving them
      console.log('Preserving current values on cancel:', {
  // email removed from UI; do not bind to form state
        anniversary: currentAnniversary,
  // email verification removed
      });
      
      // Create form data while keeping the existing values
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        email: currentEmail, // Keep the existing email
        dob: formatDate(user.dob) || '',
        gender: user.gender || '',
        anniversary: currentAnniversary, // Keep the existing anniversary
        country: user.country || 'India',
        location: typeof user.location === 'object' ? user.location?._id || '' : user.location || '',
        hostel: typeof user.hostel === 'object' ? user.hostel?._id || '' : user.hostel || ''
      });
      
  // email verification removed
    }
    
    setIsEditMode(false);
    localStorage.removeItem('profileEditMode');
    
  // email verification removed
    
    // Update the cached user data to include preserved values
    if (user) {
      const cachedUser = JSON.parse(localStorage.getItem('cachedUser') || '{}');
      
  // email verification removed
      
      // Keep email and anniversary from the form data
  // do not modify cached email here
      cachedUser.anniversary = formData.anniversary || user.anniversary || '';
      
      // Keep other fields
      if (user.dob) {
        cachedUser.dob = user.dob;
      }
      
      localStorage.setItem('cachedUser', JSON.stringify(cachedUser));
      console.log('Updated cached user data with preserved email and anniversary:', cachedUser);
    }
    
    // Clear error and success messages
    setLocalError('');
    setSuccessMessage('');
  };

  const handleEditProfile = () => {
    setIsEditMode(true);
    localStorage.setItem('profileEditMode', 'true');
    setLocalError('');
    setSuccessMessage('');
    
    // email verification removed
    
    // Ensure all date fields are properly formatted strings before saving
    const formDataToSave = {
      ...formData,
      // Explicitly format date fields to ensure consistency
      dob: typeof formData.dob === 'string' ? formData.dob : formatDate(formData.dob),
  anniversary: typeof formData.anniversary === 'string' ? formData.anniversary : formatDate(formData.anniversary)
    };
    
    // Always save the complete current form data to localStorage for consistency
    // This ensures we have a backup of all fields even after multiple refreshes
    localStorage.setItem('profileFormData', JSON.stringify(formDataToSave));
    
    console.log('Entering edit mode with complete form data:', formDataToSave);
  };





  // Show a loading spinner when the page is initially loading (before user data is fetched)
  if (loading && !user) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex flex-col items-center justify-center min-h-[300px]">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 right-0 bottom-0 left-0 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute top-1 right-1 bottom-1 left-1 border-4 border-gray-200 border-b-transparent rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
        </div>
        <p className="mt-4 text-gray-500 font-medium">Loading your profile...</p>
      </div>
    );
  }

  return (
    <>
      {/* Global loading overlay - shown when saving */}
      {isSaving && (
        <>
          {console.log('🎬 Rendering GlobalLoadingOverlay')}
          <GlobalLoadingOverlay 
            message="Saving Profile..." 
            key={`loading-${Date.now()}`} // Force a fresh instance
          />
        </>
      )}
      
      {/* Hero Section - Header Style */}
      <div className="bg-white border-b border-gray-200">
        {/* Reduced mobile padding: py-4 instead of py-8 for mobile, keeps py-8 for desktop */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Profile Image */}
            <div className="relative">
              <div className="relative">
                <ProfileImageUpload isEditMode={isEditMode} />
              </div>
              {user?.phoneVerified && (
                <div className="absolute -bottom-1 -right-1 bg-black p-1.5 shadow-lg">
                  <Shield className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
            
            {/* User Info & Actions */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-3xl font-bold text-black" style={{color: '#281c20', fontFamily: 'system-ui, -apple-system, sans-serif'}}>
                  {formData.name || 'Welcome Back'}
                </h1>
                {user?.phoneVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-black text-xs font-semibold" style={{color: '#281c20'}}>
                    <Shield className="h-3 w-3" />
                    Verified
                  </span>
                )}
              </div>
              <p className="text-gray-600 mb-4" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>Manage your sweet preferences & delivery details</p>
              
              {/* Quick Stats */}
              <div className="flex items-center justify-center md:justify-start gap-4 text-sm">
                <div className="flex items-center gap-1 text-gray-500" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>
                  <MapPinned className="h-4 w-4" />
                  <span>{formData.location ? 'Location Set' : 'Set Location'}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>
                  <Cake className="h-4 w-4" />
                  <span>{formData.dob ? 'Birthday Added' : 'Add Birthday'}</span>
                </div>
              </div>
            </div>
            
            {/* Edit Button - Header Style */}
            {!isEditMode && (
              <button
                onClick={handleEditProfile}
                className="group relative px-8 py-3 bg-black text-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-300" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}
              >
                <span className="relative flex items-center gap-2 font-semibold">
                  <Edit3 className="h-4 w-4" />
                  Edit Profile
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Main content container - Reduced mobile padding: py-4 instead of py-8 for mobile */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 relative">

      <form onSubmit={handleSubmit} className="profile-form-mobile space-y-8 pb-20 md:pb-6">
        {/* Loading Indicator - Header Style */}
        {isSaving && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-black py-4 shadow-lg animate-fadeIn">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-center">
                <div className="relative mr-4">
                  <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-white"></div>
                </div>
                <div>
                  <p className="text-white font-semibold text-lg" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>Updating Your Profile...</p>
                  <p className="text-gray-300 text-sm" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>Please wait</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Success Message - Header Style */}
        {successMessage && (
          <div className="bg-gray-100 border-l-4 border-black p-6 shadow-sm animate-fadeIn">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-white border border-gray-200 flex items-center justify-center">
                  <Check className="h-6 w-6 text-black" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-black" style={{color: '#281c20', fontFamily: 'system-ui, -apple-system, sans-serif'}}>{successMessage}</h3>
                <p className="text-gray-600 text-sm mt-1" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>Your profile has been updated successfully!</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Error Message - Header Style */}
        {localError && (
          <div className="bg-gray-100 border-l-4 border-black p-6 shadow-sm animate-fadeIn">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-white border border-gray-200 flex items-center justify-center">
                  <X className="h-6 w-6 text-black" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-black" style={{color: '#281c20', fontFamily: 'system-ui, -apple-system, sans-serif'}}>Error</h3>
                <p className="text-gray-700 text-sm mt-1" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>{localError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Personal Information Section - Header Style */}
        <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white border border-gray-200 flex items-center justify-center">
                <User className="h-5 w-5 text-black" style={{color: '#281c20'}} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-black" style={{color: '#281c20', fontFamily: 'system-ui, -apple-system, sans-serif'}}>Personal Information</h2>
                <p className="text-sm text-gray-600" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>Your basic details</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2" style={{color: '#281c20', fontFamily: 'system-ui, -apple-system, sans-serif'}}>
                <User className="h-4 w-4 text-gray-500" />
                Full Name <span className="text-black">*</span>
              </label>
              <div className="relative group">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  readOnly={!isEditMode}
                  disabled={isSaving}
                  className={`w-full px-4 py-3 border ${
                    isEditMode 
                      ? 'border-gray-300 focus:border-black bg-white' 
                      : 'border-gray-200 bg-gray-50'
                  } focus:ring-2 focus:ring-black transition-all duration-300 outline-none ${
                    !isEditMode ? 'text-gray-700' : 'text-black'
                  }`}
                  style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}
                />
              </div>
            </div>

            {/* Gender Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2" style={{color: '#281c20', fontFamily: 'system-ui, -apple-system, sans-serif'}}>
                <User className="h-4 w-4 text-gray-500" />
                Gender <span className="text-black">*</span>
              </label>
              <div className="relative">
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  disabled={!isEditMode || isSaving}
                  className={`w-full px-4 py-3 border ${
                    isEditMode 
                      ? 'border-gray-300 focus:border-black bg-white' 
                      : 'border-gray-200 bg-gray-50'
                  } focus:ring-2 focus:ring-black transition-all duration-300 outline-none appearance-none ${
                    !isEditMode ? 'text-gray-700' : 'text-black'
                  }`}
                  style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Verification Section - Header Style */}
        <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white border border-gray-200 flex items-center justify-center">
                <Shield className="h-5 w-5 text-black" style={{color: '#281c20'}} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-black" style={{color: '#281c20', fontFamily: 'system-ui, -apple-system, sans-serif'}}>Verification & Security</h2>
                <p className="text-sm text-gray-600" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>Verify your contact details</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Email verification section */}
            <EmailVerification />
            
            {/* Phone verification section */}
            <PhoneVerification 
              key={`phone-${user?.phoneVerified}-${user?.phoneVerifiedAt}`}
              onVerificationSuccess={() => {
                console.log('Phone verified - entering edit mode');
                setIsEditMode(true);
                localStorage.setItem('profileEditMode', 'true');
                setLocalError('');
                setSuccessMessage('');
              }}
            />
          </div>
        </div>
        
        {/* Special Dates Section - Pink Shade */}
        <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200" style={{backgroundColor: '#FFF1F2'}}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white border border-pink-200 flex items-center justify-center">
                <Cake className="h-5 w-5" style={{color: '#BE185D'}} />
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{color: '#BE185D', fontFamily: 'system-ui, -apple-system, sans-serif'}}>Special Dates</h2>
                <p className="text-sm" style={{color: '#9F1239', fontFamily: 'system-ui, -apple-system, sans-serif'}}>Get special treats on your special days!</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6" style={{backgroundColor: '#FFFBFC'}}>
            {/* Date of Birth Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2" style={{color: '#BE185D', fontFamily: 'system-ui, -apple-system, sans-serif'}}>
                <Calendar className="h-4 w-4" style={{color: '#EC4899'}} />
                Date of Birth <span style={{color: '#BE185D'}}>*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  max={today}
                  readOnly={!isEditMode}
                  disabled={isSaving}
                  className={`w-full px-4 py-3 border ${
                    isEditMode 
                      ? 'border-pink-300 focus:border-pink-600 bg-white' 
                      : 'border-pink-200 bg-pink-50'
                  } focus:ring-2 transition-all duration-300 outline-none ${
                    !isEditMode ? 'text-gray-700' : 'text-black'
                  }`}
                  style={{fontFamily: 'system-ui, -apple-system, sans-serif', '--tw-ring-color': '#EC4899'}}
                />
              </div>
              <p className="text-xs" style={{color: '#9F1239', fontFamily: 'system-ui, -apple-system, sans-serif'}}>
                We'll send you special birthday treats!
              </p>
            </div>

            {/* Date of Anniversary Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2" style={{color: '#BE185D', fontFamily: 'system-ui, -apple-system, sans-serif'}}>
                <Heart className="h-4 w-4" style={{color: '#EC4899'}} />
                Anniversary Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="anniversary"
                  value={formData.anniversary}
                  onChange={handleChange}
                  max={today}
                  readOnly={!isEditMode}
                  disabled={isSaving}
                  className={`w-full px-4 py-3 border ${
                    isEditMode 
                      ? 'border-pink-300 focus:border-pink-600 bg-white' 
                      : 'border-pink-200 bg-pink-50'
                  } focus:ring-2 transition-all duration-300 outline-none ${
                    !isEditMode ? 'text-gray-700' : 'text-black'
                  }`}
                  style={{fontFamily: 'system-ui, -apple-system, sans-serif', '--tw-ring-color': '#EC4899'}}
                />
              </div>
              <p className="text-xs" style={{color: '#9F1239', fontFamily: 'system-ui, -apple-system, sans-serif'}}>
                Celebrate with special anniversary offers!
              </p>
            </div>
          </div>
        </div>

        {/* Delivery Information Section - Chocolate Shade */}
        <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200" style={{backgroundColor: '#F5F3F0'}}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white border flex items-center justify-center" style={{borderColor: '#8B7355'}}>
                <MapPin className="h-5 w-5" style={{color: '#6B4423'}} />
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{color: '#6B4423', fontFamily: 'system-ui, -apple-system, sans-serif'}}>Delivery Information</h2>
                <p className="text-sm" style={{color: '#8B7355', fontFamily: 'system-ui, -apple-system, sans-serif'}}>Where should we deliver your treats?</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-6" style={{backgroundColor: '#FAFAF9'}}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Delivery Location */}
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2" style={{color: '#6B4423', fontFamily: 'system-ui, -apple-system, sans-serif'}}>
                  <MapPinned className="h-4 w-4" style={{color: '#8B7355'}} />
                  Delivery Location <span style={{color: '#6B4423'}}>*</span>
                </label>
                <div className="relative">
                  <select
                    name="location"
                    value={formData.location || ''}
                    onChange={handleChange}
                    disabled={isSaving || locationsLoading || !isEditMode}
                    required
                    className={`w-full px-4 py-3 border ${
                      isEditMode 
                        ? 'bg-white focus:border-black' 
                        : 'bg-stone-50'
                    } focus:ring-2 transition-all duration-300 outline-none appearance-none ${
                      !isEditMode ? 'text-gray-700' : 'text-black'
                    }`}
                    style={{fontFamily: 'system-ui, -apple-system, sans-serif', borderColor: '#8B7355', '--tw-ring-color': '#6B4423'}}
                  >
                    <option value="">Select delivery location</option>
                    {locations && locations.length > 0 ? (
                      locations.map(location => (
                        <option key={location._id} value={location._id}>
                          {location.area}, {location.city} - {location.pincode}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>Loading locations...</option>
                    )}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{color: '#8B7355'}} />
                </div>
              </div>

              {/* Country Field */}
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2" style={{color: '#6B4423', fontFamily: 'system-ui, -apple-system, sans-serif'}}>
                  <Flag className="h-4 w-4" style={{color: '#8B7355'}} />
                  Country <span style={{color: '#6B4423'}}>*</span>
                </label>
                <div className="relative">
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    disabled={loading || !isEditMode}
                    className={`w-full px-4 py-3 border ${
                      isEditMode 
                        ? 'bg-white focus:border-black' 
                        : 'bg-stone-50'
                    } focus:ring-2 transition-all duration-300 outline-none appearance-none ${
                      !isEditMode ? 'text-gray-700' : 'text-black'
                    }`}
                    style={{fontFamily: 'system-ui, -apple-system, sans-serif', borderColor: '#8B7355', '--tw-ring-color': '#6B4423'}}
                  >
                    <option value="India">India</option>
                    <option value="USA">USA</option>
                    <option value="UK">UK</option>
                    <option value="Canada">Canada</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{color: '#8B7355'}} />
                </div>
              </div>
            </div>

            {/* Hostel Selection */}
            {formData.location && (
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2" style={{color: '#6B4423', fontFamily: 'system-ui, -apple-system, sans-serif'}}>
                  <Building className="h-4 w-4" style={{color: '#8B7355'}} />
                  Hostel/Residence
                  <span className="text-xs font-normal ml-2" style={{color: '#8B7355'}}>(Optional)</span>
                </label>
                <div className="relative">
                  {!isEditMode ? (
                    <div className={`w-full px-4 py-3 border bg-stone-50 text-gray-700`} style={{fontFamily: 'system-ui, -apple-system, sans-serif', borderColor: '#8B7355'}}>
                      {(() => {
                        if (!formData.hostel) return 'No hostel selected';
                        if (user?.hostel && typeof user.hostel === 'object' && user.hostel._id === formData.hostel) {
                          return `${user.hostel.name || 'Unknown Hostel'}`;
                        }
                        if (hostels && hostels.length > 0) {
                          const hostelObj = hostels.find(h => h._id === formData.hostel);
                          if (hostelObj) return hostelObj.name;
                        }
                        return 'Loading hostel details...';
                      })()}
                    </div>
                  ) : (
                    <select
                      name="hostel"
                      value={formData.hostel || ''}
                      onChange={handleChange}
                      disabled={isSaving || hostelsLoading}
                      className={`w-full px-4 py-3 border bg-white focus:border-black focus:ring-2 transition-all duration-300 outline-none appearance-none text-black`}
                      style={{fontFamily: 'system-ui, -apple-system, sans-serif', borderColor: '#8B7355', '--tw-ring-color': '#6B4423'}}
                    >
                      <option value="">Select hostel/residence (Optional)</option>
                      {hostels && hostels.length > 0 ? (
                        hostels.map(hostel => (
                          <option key={hostel._id} value={hostel._id}>
                            {hostel.name}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          {hostelsLoading ? 'Loading hostels...' : 'No hostels available'}
                        </option>
                      )}
                    </select>
                  )}
                  {isEditMode && (
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{color: '#8B7355'}} />
                  )}
                </div>
                <p className="text-xs" style={{color: '#8B7355', fontFamily: 'system-ui, -apple-system, sans-serif'}}>
                  Help us deliver faster
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - Header Style */}
        {isEditMode && (
          <div className="profile-save-buttons sticky bottom-16 md:bottom-0 z-[60] -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-6 bg-white border-t border-gray-200">
            <div className="flex items-center justify-center gap-4 max-w-md mx-auto">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex-1 px-6 py-4 border-2 border-gray-300 hover:border-black transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md" style={{color: '#281c20', fontFamily: 'system-ui, -apple-system, sans-serif'}}
              >
                <span className="flex items-center justify-center gap-2">
                  <X className="h-5 w-5" />
                  Cancel
                </span>
              </button>
              <button
                type="submit"
                disabled={isSaving || !formData.name.trim()}
                className="flex-1 relative px-8 py-4 bg-black text-white overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}
              >
                <span className={`relative flex items-center justify-center gap-2 transition-opacity duration-300 ${isSaving ? 'opacity-0' : 'opacity-100'}`}>
                  <Save className="h-5 w-5" />
                  Save Profile
                </span>
                {isSaving && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 border-2 border-white border-t-transparent animate-spin"></div>
                      <span className="text-sm font-semibold">Saving...</span>
                    </div>
                  </div>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
      </div>
    </>
  );
};

export default Profile;

