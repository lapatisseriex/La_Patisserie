import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { useLocation } from '../../../context/LocationContext/LocationContext';
import { useHostel } from '../../../context/HostelContext/HostelContext';
import { emailService } from '../../../services/apiService';
import ProfileImageUpload from './ProfileImageUpload';
import GlobalLoadingOverlay from '../../common/GlobalLoadingOverlay';
import EmailVerification from '../EmailVerification';
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
  Mail
} from 'lucide-react';

const Profile = () => {
  const { user, updateProfile, authError, loading, isNewUser, updateUser } = useAuth();
  const { locations, loading: locationsLoading, fetchLocations } = useLocation();
  const { hostels, loading: hostelsLoading, fetchHostelsByLocation, clearHostels } = useHostel();
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
      console.error("Error formatting date:", error);
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
  
  // Email verification state - prioritize saved data for persistence
  const [isEmailVerified, setIsEmailVerified] = useState(savedUserData?.isEmailVerified || user?.isEmailVerified || false);
  
  // Add debugging log for verification status
  console.log('Initial email verification status:', isEmailVerified);
  console.log('Email value in form:', formData.email);
  
  // Effect to check email verification status from server on mount
  useEffect(() => {
    const checkEmailStatus = async () => {
      try {
        const status = await emailService.checkVerificationStatus();
        console.log('Email verification status from server:', status);
        
        if (status.email) {
          // Update form data with server email
          setFormData(prev => ({
            ...prev,
            email: status.email
          }));
          
          // Update verification status
          setIsEmailVerified(status.isEmailVerified);
          
          // Update saved data for persistence
          const savedData = JSON.parse(localStorage.getItem('savedUserData') || '{}');
          savedData.email = status.email;
          savedData.isEmailVerified = status.isEmailVerified;
          localStorage.setItem('savedUserData', JSON.stringify(savedData));
          
          console.log('Updated email and verification status from server');
        }
      } catch (error) {
        console.error('Error checking email verification status:', error);
      }
    };
    
    // Only check if we have a user
    if (user && user.uid) {
      checkEmailStatus();
    }
  }, [user]);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  
  // Fetch locations only once on mount
  const hasRunLocationsFetch = useRef(false);
  
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
          console.log("Recovering form data after refresh:", parsedFormData);
          
          // First get cached user data for fallback
          let cachedUserData = {};
          try {
            const cachedUser = localStorage.getItem('cachedUser');
            if (cachedUser) {
              cachedUserData = JSON.parse(cachedUser);
            }
          } catch (err) {
            console.error("Error parsing cached user:", err);
          }
          
          // Make sure email is always available for verification status check
          if (!parsedFormData.email) {
            if (cachedUserData.email) {
              parsedFormData.email = cachedUserData.email;
            } else if (user?.email) {
              parsedFormData.email = user.email;
            }
            console.log("Email missing in saved form data, using fallback email:", parsedFormData.email);
          }
          
          // Make sure all date fields are correctly formatted
          // This ensures anniversary and other date fields persist properly
          if (parsedFormData.dob && !(parsedFormData.dob instanceof String) && typeof parsedFormData.dob !== 'string') {
            parsedFormData.dob = formatDate(parsedFormData.dob);
          }
          
          if (parsedFormData.anniversary && !(parsedFormData.anniversary instanceof String) && typeof parsedFormData.anniversary !== 'string') {
            parsedFormData.anniversary = formatDate(parsedFormData.anniversary);
          }
          
          // Use our helper function for consistent form data recovery with proper precedence
          // This ensures all fields including anniversary are restored properly
          const mergedUserData = {
            ...user,
            ...cachedUserData,
            // Format specific fields as needed
            location: typeof user?.location === 'object' ? user?.location?._id || '' : user?.location || '',
            hostel: typeof user?.hostel === 'object' ? user?.hostel?._id || '' : user?.hostel || '',
          };
          
          const restoredForm = createInitialFormData(mergedUserData, parsedFormData);
          console.log("Restored form data with anniversary:", restoredForm);
          setFormData(restoredForm);
          
          // Also restore email verification status if available
          if (parsedFormData.hasOwnProperty('isEmailVerified')) {
            setIsEmailVerified(parsedFormData.isEmailVerified);
            console.log("Restored email verification status:", parsedFormData.isEmailVerified);
          } else if (cachedUserData.hasOwnProperty('isEmailVerified')) {
            setIsEmailVerified(cachedUserData.isEmailVerified);
            console.log("Using cached user's email verification status:", cachedUserData.isEmailVerified);
          } else if (user?.email && parsedFormData.email === user.email) {
            // If we have the same email as user, use user's verification status
            setIsEmailVerified(user.isEmailVerified || false);
            console.log("Using user's email verification status:", user.isEmailVerified);
          }
          
          // Re-save the complete form data to localStorage to ensure consistency
          const dataToCache = {
            ...restoredForm,
            isEmailVerified: parsedFormData.isEmailVerified !== undefined 
              ? parsedFormData.isEmailVerified 
              : (user?.isEmailVerified || false)
          };
          localStorage.setItem('profileFormData', JSON.stringify(dataToCache));
        }
      } catch (error) {
        console.error("Error recovering form data:", error);
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
  
  // Update email verification status if user object changes
  useEffect(() => {
    if (user && user.email && !isEditMode) {
      console.log("User email/verification status updated:", user.email, user.isEmailVerified);
      if (formData.email === user.email) {
        // Only update verification status if we're displaying the same email
        setIsEmailVerified(user.isEmailVerified || false);
      }
    }
  }, [user?.email, user?.isEmailVerified]);
  
  // Debug helper to verify form data - especially date fields - are correctly persisting
  useEffect(() => {
    // This will run whenever formData changes
    console.log("CURRENT FORM DATA STATE:", {
      ...formData,
      isEmailVerified,
      isEditMode
    });
    
    console.log("Anniversary date field:", formData.anniversary);
    console.log("Email field:", formData.email);
    
    // Check localStorage for comparison
    try {
      const savedFormData = localStorage.getItem('profileFormData');
      if (savedFormData) {
        const parsed = JSON.parse(savedFormData);
        console.log("LOCALSTORAGE profileFormData:", {
          ...parsed,
          anniversary: parsed.anniversary || "NOT SET",
          email: parsed.email || "NOT SET"
        });
      }
    } catch (err) {
      console.error("Error checking localStorage:", err);
    }
  }, [formData, isEmailVerified, isEditMode]);
  
  // useEffect to sync form data with user data - runs both on component mount and when user data changes
  const userDataInitialized = useRef(false);
  
  useEffect(() => {
    // Fetch fresh user data from the server first to ensure we have the latest
    const fetchFreshUserData = async () => {
      try {
        // Only make this call if we're already authenticated and have a token
        const token = localStorage.getItem('authToken');
        if (token) {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.data.success) {
            // Update cached user data with fresh data
            localStorage.setItem('cachedUser', JSON.stringify(response.data.user));
            console.log('Fetched fresh user data from server:', response.data.user);
            
            // Clear any potentially corrupted form data
            localStorage.removeItem('profileFormData');
          }
        }
      } catch (error) {
        console.error('Error fetching fresh user data:', error);
      }
    };
    
    // Call the function to fetch fresh data
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
        console.error("Error parsing cached user data:", error);
        cachedUserData = {};
      }
      
      // Then, check for saved form data (has highest priority)
      let savedFormData = {};
      try {
        const profileFormData = localStorage.getItem('profileFormData');
        if (profileFormData) {
          savedFormData = JSON.parse(profileFormData) || {};
          console.log("Recovered saved form data:", savedFormData);
        }
      } catch (error) {
        console.error("Error recovering form data from localStorage:", error);
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
      console.log("Setting initial form data:", initialFormData);
      
      // Update form data state
      setFormData(initialFormData);
      
      // Set email verification status with proper precedence
      const verificationStatus = 
        savedFormData.isEmailVerified !== undefined ? savedFormData.isEmailVerified :
        cachedUserData.isEmailVerified !== undefined ? cachedUserData.isEmailVerified :
        (user.isEmailVerified || false);
      
      setIsEmailVerified(verificationStatus);
      console.log('Email verification status set to:', verificationStatus, 'for email:', initialFormData.email);
      
      // Save the complete form data to localStorage for refresh protection
      const dataToCache = {
        ...initialFormData,
        isEmailVerified: verificationStatus
      };
      localStorage.setItem('profileFormData', JSON.stringify(dataToCache));
      
      console.log("Form data initialized completely with all fields preserved");
      
      userDataInitialized.current = true;
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If email is changing, reset verification status
    if (name === 'email' && value !== formData.email) {
      setIsEmailVerified(false);
      setShowEmailVerification(!!value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
    }
    
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
    if (isEditMode && (name === 'anniversary' || name === 'dob' || name === 'email')) {
      const currentData = {
        ...formData,
        [name]: processedValue,
        isEmailVerified: name === 'email' ? false : isEmailVerified
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
    
    // Validate that email is verified if provided
    if (formData.email && !isEmailVerified) {
      setLocalError('Please verify your email address before saving');
      // Show email verification component
      setShowEmailVerification(true);
      return;
    }
    
    setLocalError('');
    setSuccessMessage('');
    
    // Set both loading states to ensure animations show
    setIsSaving(true);
    console.log("🔄 Setting isSaving to TRUE"); // Debug log
    
    // Scroll to the top to make loading indicator visible
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Create a clean copy of form data with date fields properly formatted
    const profileData = { 
      ...formData,
      // Ensure date fields are properly formatted
      dob: typeof formData.dob === 'string' ? formData.dob : formatDate(formData.dob),
      anniversary: typeof formData.anniversary === 'string' ? formData.anniversary : formatDate(formData.anniversary)
    };
    
    // Save complete form data to localStorage for refresh protection
    // This ensures we have a backup of all fields in case we need to restore after refresh
    const formDataToSave = {
      ...profileData,
      isEmailVerified: isEmailVerified
    };
    
    // Log the data being saved, with special attention to anniversary field
    console.log("Saving complete form data with anniversary:", formDataToSave.anniversary);
    
    localStorage.setItem('profileFormData', JSON.stringify(formDataToSave));
    
    console.log("Submitting profile data:", profileData);
    console.log("Gender being submitted:", profileData.gender);
    console.log("Hostel data being submitted:", profileData.hostel, "type:", typeof profileData.hostel);
    
    try {
      // IMPORTANT: Check if this is the admin's profile
      const isAdmin = user?.role === 'admin';
      console.log('Is admin user:', isAdmin);
      
      const success = await updateProfile(profileData);

      if (success) {
        setSuccessMessage('Profile updated successfully!');
        setIsEditMode(false);
        localStorage.removeItem('profileEditMode');

        // Even on successful update, ensure we keep location and hostel permanently in savedUserData
        // This provides persistent data across sessions, similar to how the header works
        const savedUserData = JSON.parse(localStorage.getItem('savedUserData') || '{}');
        savedUserData.location = formData.location;
        savedUserData.hostel = formData.hostel;
        savedUserData.email = formData.email;
        savedUserData.anniversary = formData.anniversary;
        savedUserData.isEmailVerified = isEmailVerified;
        localStorage.setItem('savedUserData', JSON.stringify(savedUserData));
        console.log('Permanently saved location and hostel to savedUserData:', savedUserData.location, savedUserData.hostel);

        // Also update cached user for immediate availability
        const cachedUser = JSON.parse(localStorage.getItem('cachedUser') || '{}');
        cachedUser.email = formData.email || cachedUser.email || '';
        cachedUser.anniversary = formData.anniversary || cachedUser.anniversary || '';
        cachedUser.isEmailVerified = isEmailVerified;
        localStorage.setItem('cachedUser', JSON.stringify(cachedUser));
        
        console.log("Successfully updated profile, preserved email and anniversary in cache");
        
        // For admin users, we want to make sure we get a fresh copy of our own data
        if (isAdmin) {
          try {
            const token = localStorage.getItem('authToken');
            if (token) {
              const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              if (response.data.success) {
                // Update cached user data with fresh data
                localStorage.setItem('cachedUser', JSON.stringify(response.data.user));
                console.log('Admin refreshed own user data from server:', response.data.user);
              }
            }
          } catch (error) {
            console.error('Error refreshing admin user data:', error);
          }
        }
      }
    } catch (error) {
      console.error("Error in profile update:", error);
      setLocalError("Failed to update profile. Please try again.");
    } finally {
      // Use a slight delay to ensure loading state is visible even on fast connections
      setTimeout(() => {
        console.log("🛑 Setting isSaving to FALSE"); // Debug log
        setIsSaving(false);
      }, 1500); // Increased delay for better visibility
    }
  };

  const handleCancel = () => {
    if (user) {
      // IMPORTANT: Instead of resetting to user values completely, we need to preserve
      // certain fields like email and anniversary from the current form data
      
      // Get the current form data values we want to preserve
      const currentEmail = formData.email || user.email || '';
      const currentAnniversary = formData.anniversary || formatDate(user.anniversary) || '';
      const currentEmailVerified = isEmailVerified;
      
      // Log current values to verify we're preserving them
      console.log("Preserving current values on cancel:", {
        email: currentEmail,
        anniversary: currentAnniversary,
        isEmailVerified: currentEmailVerified
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
      
      // Keep the existing verification status
      setIsEmailVerified(currentEmailVerified);
    }
    
    setIsEditMode(false);
    localStorage.removeItem('profileEditMode');
    
    setShowEmailVerification(false);
    
    // Update the cached user data to include preserved values
    if (user) {
      const cachedUser = JSON.parse(localStorage.getItem('cachedUser') || '{}');
      
      // Keep the email verification status
      cachedUser.isEmailVerified = isEmailVerified;
      
      // Keep email and anniversary from the form data
      cachedUser.email = formData.email || user.email || '';
      cachedUser.anniversary = formData.anniversary || user.anniversary || '';
      
      // Keep other fields
      if (user.dob) {
        cachedUser.dob = user.dob;
      }
      
      localStorage.setItem('cachedUser', JSON.stringify(cachedUser));
      console.log("Updated cached user data with preserved email and anniversary:", cachedUser);
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
    
    // Get the current verification status, either from the form or from the user object
    const currentEmailVerificationStatus = formData.email && user?.email && formData.email === user.email
      ? (user?.isEmailVerified || false)
      : isEmailVerified;
    
    // Update verification status state
    setIsEmailVerified(currentEmailVerificationStatus);
    
    // Ensure all date fields are properly formatted strings before saving
    const formDataToSave = {
      ...formData,
      // Explicitly format date fields to ensure consistency
      dob: typeof formData.dob === 'string' ? formData.dob : formatDate(formData.dob),
      anniversary: typeof formData.anniversary === 'string' ? formData.anniversary : formatDate(formData.anniversary),
      isEmailVerified: currentEmailVerificationStatus
    };
    
    // Always save the complete current form data to localStorage for consistency
    // This ensures we have a backup of all fields even after multiple refreshes
    localStorage.setItem('profileFormData', JSON.stringify(formDataToSave));
    
    console.log("Entering edit mode with complete form data:", formDataToSave);
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
    <div className="max-w-4xl mx-auto p-6 relative">
      {/* Global loading overlay - shown when saving */}
      {isSaving && (
        <>
          {console.log("🎬 Rendering GlobalLoadingOverlay")}
          <GlobalLoadingOverlay 
            message="Saving your profile..." 
            key={`loading-${Date.now()}`} // Force a fresh instance
          />
        </>
      )}
      
      <div className="mb-6 flex flex-col md:flex-row items-center gap-6">
        <div className="mb-4 md:mb-0">
          {/* Profile Image Upload Component */}
          <ProfileImageUpload isEditMode={isEditMode} />
        </div>
        <div className="flex flex-1 justify-between items-center w-full">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">My Profile</h2>
            <p className="text-gray-600">Update your personal information</p>
          </div>
          {!isEditMode && (
            <button
              onClick={handleEditProfile}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Loading Indicator - More prominent and fixed positioned */}
        {loading && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-black bg-opacity-80 py-3 shadow-lg animate-fadeIn">
            <div className="container mx-auto">
              <div className="flex items-center justify-center">
                <div className="mr-3 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                </div>
                <div>
                  <p className="text-white font-medium">Saving your profile... Please wait while we update your information</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Secondary Loading Indicator (in-form) */}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 animate-fadeIn relative overflow-hidden mb-4 shadow-md">
            <div className="absolute bottom-0 left-0 h-1 bg-blue-500 animate-growWidth"></div>
            <div className="flex items-center">
              <div className="mr-3 flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <div>
                <p className="text-blue-800 font-medium">Saving your profile...</p>
                <p className="text-blue-600 text-sm">Please wait while we update your information</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 animate-fadeIn relative overflow-hidden">
            <div className="absolute bottom-0 left-0 h-1 bg-green-500 animate-growWidth"></div>
            <div className="flex items-center">
              <div className="bg-green-100 p-1.5 rounded-full mr-3">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-green-800 font-medium">{successMessage}</p>
                <p className="text-green-600 text-sm">Your profile has been updated successfully</p>
              </div>
            </div>
          </div>
        )}
        
        {localError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 animate-fadeIn relative overflow-hidden">
            <div className="absolute bottom-0 left-0 h-1 bg-red-500 animate-growWidth"></div>
            <div className="flex items-center">
              <div className="bg-red-100 p-1.5 rounded-full mr-3 flex items-center justify-center">
                <span className="text-red-600 font-bold text-lg leading-none">!</span>
              </div>
              <p className="text-red-800 font-medium">{localError}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Arun"
                required
                readOnly={!isEditMode}
                disabled={loading}
                className={inputClasses}
              />
            </div>
          </div>

          {/* Mobile Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Mobile <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <div className="flex">
                <div className="relative">
                  <select className="pl-10 pr-8 py-3 border border-gray-300 rounded-none rounded-r-none bg-gray-50 text-gray-600 appearance-none transition-all duration-300">
                    <option value="+91">🇮🇳</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter mobile number"
                  disabled={true}
                  className="flex-1 px-4 py-3 border border-l-0 border-gray-300 rounded-none rounded-r-none bg-gray-50 text-gray-600 transition-all duration-300"
                />
              </div>
            </div>
          </div>
          
          {/* Email Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                readOnly={!isEditMode}
                disabled={loading}
                className={inputClasses}
              />
              {isEmailVerified && (
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                  <Check className="h-3 w-3 mr-1" /> Verified
                </span>
              )}
            </div>
          </div>



          {/* Gender Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Gender <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                disabled={!isEditMode || loading}
                className={`w-full pl-10 pr-10 py-3 border border-gray-300 rounded-none focus:ring-2 focus:ring-black focus:border-transparent appearance-none ${
                  !isEditMode ? 'bg-gray-50 text-gray-700' : ''
                }`}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          {/* Date of Birth Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                max={today}
                readOnly={!isEditMode}
                disabled={loading}
                className={`w-full pl-10 pr-10 py-3 border border-gray-300 rounded-none focus:ring-2 focus:ring-black focus:border-transparent appearance-none ${
                  !isEditMode ? 'bg-gray-50 text-gray-700' : ''
                }`}
              />
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>



          {/* Date of Anniversary Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Date of Anniversary</label>
            <div className="relative">
              <Heart className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                name="anniversary"
                value={formData.anniversary}
                onChange={handleChange}
                max={today}
                readOnly={!isEditMode}
                disabled={loading}
                className={`w-full pl-10 pr-10 py-3 border border-gray-300 rounded-none focus:ring-2 focus:ring-black focus:border-transparent appearance-none ${
                  !isEditMode ? 'bg-gray-50 text-gray-700' : ''
                }`}
              />
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Delivery Location */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Delivery Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  name="location"
                  value={formData.location || ''}
                  onChange={handleChange}
                  disabled={loading || locationsLoading || !isEditMode}
                  required
                  className={`w-full pl-10 pr-10 py-3 border border-gray-300 rounded-none focus:ring-2 focus:ring-black focus:border-transparent appearance-none ${
                    !isEditMode ? 'bg-gray-50 text-gray-700' : ''
                  }`}
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
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Country Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Country <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Flag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  disabled={loading || !isEditMode}
                  className={`w-full pl-10 pr-10 py-3 border border-gray-300 rounded-none focus:ring-2 focus:ring-black focus:border-transparent appearance-none ${
                    !isEditMode ? 'bg-gray-50 text-gray-700' : ''
                  }`}
                >
                  <option value="India">India</option>
                  <option value="USA">USA</option>
                  <option value="UK">UK</option>
                  <option value="Canada">Canada</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Hostel Selection */}
          {formData.location && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Hostel/Residence</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                {!isEditMode ? (
                  // Read-only display showing the selected hostel name
                  // Try to get name from user context (cached data with full objects) first, then context lookup
                  <div className={`${inputClasses} cursor-not-allowed flex items-center justify-between`}>
                    <span>
                      {(() => {
                        if (!formData.hostel) return 'No hostel selected';

                        // First, try to get name from user's hostel object (in cached user data)
                        if (user?.hostel && typeof user.hostel === 'object' && user.hostel._id === formData.hostel) {
                          return user.hostel.name || 'Unknown Hostel';
                        }

                        // Then try context lookup if hostels are loaded
                        if (hostels && hostels.length > 0) {
                          const hostelObj = hostels.find(h => h._id === formData.hostel);
                          if (hostelObj) return hostelObj.name;
                        }

                        // Finally, show loading state if we have an ID but haven't found the name yet
                        return 'Loading hostel details...';
                      })()}
                    </span>
                  </div>
                ) : (
                  // Edit mode with select dropdown
                  <select
                    name="hostel"
                    value={formData.hostel || ''}
                    onChange={handleChange}
                    disabled={loading || hostelsLoading}
                    className={`w-full pl-10 pr-10 py-3 border border-gray-300 rounded-none focus:ring-2 focus:ring-black focus:border-transparent appearance-none`}
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
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons - only show in edit mode */}
        {isEditMode && (
          <div className="flex items-center justify-start space-x-4 pt-6">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="px-8 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium disabled:opacity-70 disabled:cursor-not-allowed"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="px-8 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors font-medium disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden"
            >
              <span className={`flex items-center justify-center gap-2 ${loading ? 'opacity-0' : 'opacity-100'}`}>
                SAVE
              </span>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm font-medium">SAVING</span>
                  </div>
                </div>
              )}
            </button>
          </div>
        )}
      </form>
      
      {/* Email Verification Section - Always shown when email exists */}
      {formData.email && (
        <div className="mt-8">
          <div className="border-t border-gray-200 pt-6 mb-4">
            <h4 className="text-lg font-medium">Email Management</h4>
          </div>
          <EmailVerification 
            email={formData.email}
            setEmail={(email) => setFormData({...formData, email})}
            isVerified={isEmailVerified}
            setIsVerified={setIsEmailVerified}
            onVerificationSuccess={(email) => {
              setFormData(prev => ({...prev, email}));
              setIsEmailVerified(true);
              
              // Update user data in context
              updateUser({
                email,
                isEmailVerified: true
              });
              
              // Also ensure the email is saved locally for persistence
              const savedUserData = JSON.parse(localStorage.getItem('savedUserData') || '{}');
              savedUserData.email = email;
              savedUserData.isEmailVerified = true;
              localStorage.setItem('savedUserData', JSON.stringify(savedUserData));
              
              setSuccessMessage("Email verified successfully!");
            }}
            showChangeEmail={isEditMode} // Only show change option in edit mode
          />
        </div>
      )}
      

    </div>
  );
};

export default Profile;
