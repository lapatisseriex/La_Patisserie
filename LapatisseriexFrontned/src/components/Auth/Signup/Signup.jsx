import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useLocation } from '../../../context/LocationContext/LocationContext';

const Signup = () => {
  const [formData, setFormData] = useState({
    phone: '',
    locationId: '',
  });
  const { sendOTP, changeAuthType, authError, loading } = useAuth();
  const { locations, loading: locationsLoading } = useLocation();
  const [localError, setLocalError] = useState('');
  
  // Clear local error when authError changes
  useEffect(() => {
    if (authError) {
      setLocalError(authError);
    } else {
      setLocalError('');
    }
  }, [authError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // For phone field, only allow digits
    if (name === 'phone') {
      setFormData({
        ...formData,
        [name]: value.replace(/\D/g, '')
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (formData.phone.length !== 10) {
      setLocalError('Please enter a valid 10-digit mobile number');
      return;
    }
    
    if (!formData.locationId) {
      setLocalError('Please select a delivery location');
      return;
    }
    
    // Reset error
    setLocalError('');
    
    // Try to send OTP via Firebase
    const success = await sendOTP(formData.phone, formData.locationId);
    
    if (!success && !authError) {
      setLocalError('Failed to send OTP. Please try again.');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with logo/icon */}
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-white">
        <div>
          <h2 className="text-2xl font-bold text-black">Sign Up</h2>
          <p className="text-sm text-black">to enjoy fresh baked treats</p>
        </div>
        <img src="/images/logo.png" alt="Dessertify Logo" className="h-12 w-12" />
      </div>
      
      <form className="flex-1 flex flex-col" onSubmit={handleSubmit}>
        {/* Form content */}
        <div className="flex-1">
          <div className="mb-6">
            <p className="text-lg font-medium text-black mb-6">Enter your phone number</p>
            
            <div className="relative">
              <div className="flex items-center border-b-2 border-white pb-2 focus-within:border-white">
                <span className="text-black font-medium mr-2">+91</span>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  placeholder="10-digit mobile number"
                  value={formData.phone}
                  onChange={handleChange}
                  maxLength={10}
                  required
                  disabled={loading}
                  className="w-full py-2 focus:outline-none text-lg"
                />
              </div>
            </div>
          </div>

          {/* Location Selection */}
          <div className="mb-8">
            <p className="text-lg font-medium text-black mb-4">Select your delivery location</p>
            
            <div className="relative">
              <select
                name="locationId"
                value={formData.locationId}
                onChange={handleChange}
                disabled={loading || locationsLoading}
                className="w-full p-3 border border-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                required
              >
                <option value="">Select a delivery location</option>
                {!locationsLoading && locations.map((location) => (
                  <option key={location._id} value={location._id}>
                    {location.area}, {location.city}
                  </option>
                ))}
              </select>
              
              {locationsLoading && (
                <p className="text-black text-sm mt-2">Loading locations...</p>
              )}
              
              {localError && (
                <p className="text-red-500 text-sm mt-2">{localError}</p>
              )}
            </div>
          </div>
          
          {/* Hidden recaptcha container */}
          <div id="recaptcha-container"></div>
        </div>
        
        {/* Bottom section with actions */}
        <div className="mt-auto">
          <p className="text-xs text-black mb-6">
            By clicking on Sign Up, I accept the <span className="text-black">Terms & Conditions</span> & <span className="text-black">Privacy Policy</span>
          </p>
          
          <button 
            type="submit" 
            disabled={loading || formData.phone.length !== 10}
            className={`w-full bg-black text-white py-3.5 rounded-lg text-lg font-medium transition-colors shadow-md ${
              loading || formData.phone.length !== 10
                ? 'opacity-60 cursor-not-allowed' 
                : 'hover:bg-gray-200/90'
            }`}
          >
            {loading ? 'SENDING...' : 'SIGN UP'}
          </button>
          
          <div className="text-center mt-4">
            <p className="text-sm text-black">
              Already have an account? {' '}
              <button 
                type="button" 
                onClick={() => changeAuthType('login')}
                disabled={loading}
                className="text-black font-medium hover:text-black/80 transition-colors"
              >
                Login
              </button>
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Signup;





