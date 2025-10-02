import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext/AuthContextRedux';

const ReduxProfile = () => {
  const { 
    user,
    updateUserProfile, 
    error, 
    profileUpdating, 
    clearError,
    setIsAuthPanelOpen 
  } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dob: '',
    gender: '',
    city: '',
    pincode: '',
  });
  const [localError, setLocalError] = useState('');

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        dob: user.dob || '',
        gender: user.gender || '',
        city: user.city || '',
        pincode: user.pincode || '',
      });
    }
  }, [user]);

  // Clear local error when Redux error changes
  useEffect(() => {
    if (error) {
      setLocalError(error);
    } else {
      setLocalError('');
    }
  }, [error]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.name.trim()) {
      errors.push('Name is required');
    }

    if (!formData.dob) {
      errors.push('Date of birth is required');
    } else {
      const age = new Date().getFullYear() - new Date(formData.dob).getFullYear();
      if (age < 13) {
        errors.push('You must be at least 13 years old');
      }
    }

    if (formData.email && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(formData.email)) {
      errors.push('Please enter a valid email address');
    }

    if (formData.pincode && !/^\\d{6}$/.test(formData.pincode)) {
      errors.push('Pincode must be 6 digits');
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setLocalError(validationErrors[0]);
      return;
    }

    // Reset error
    setLocalError('');
    clearError();
    
    try {
      // Update profile via Redux action
      await updateUserProfile(formData);
      // Success - Redux will handle closing the modal
    } catch (error) {
      setLocalError(error.message || 'Failed to update profile');
    }
  };

  const handleSkip = () => {
    // Close the auth panel and continue with minimal profile
    setIsAuthPanelOpen(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h2>Complete Your Profile</h2>
        <p>Help us personalize your experience</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form profile-form">
        <div className="form-group">
          <label htmlFor="name">Full Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter your full name"
            className="form-input"
            disabled={profileUpdating}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter your email (optional)"
            className="form-input"
            disabled={profileUpdating}
          />
        </div>

        <div className="form-group">
          <label htmlFor="dob">Date of Birth *</label>
          <input
            type="date"
            id="dob"
            name="dob"
            value={formData.dob}
            onChange={handleInputChange}
            className="form-input"
            disabled={profileUpdating}
            max={new Date().toISOString().split('T')[0]} // Can't be future date
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="gender">Gender</label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            className="form-input"
            disabled={profileUpdating}
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="city">City</label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="Enter your city"
              className="form-input"
              disabled={profileUpdating}
            />
          </div>

          <div className="form-group">
            <label htmlFor="pincode">Pincode</label>
            <input
              type="text"
              id="pincode"
              name="pincode"
              value={formData.pincode}
              onChange={handleInputChange}
              placeholder="6-digit pincode"
              className="form-input"
              maxLength="6"
              disabled={profileUpdating}
            />
          </div>
        </div>

        {localError && (
          <div className="error-message">
            {localError}
          </div>
        )}

        <div className="form-actions">
          <button 
            type="submit" 
            disabled={profileUpdating || !formData.name.trim() || !formData.dob}
            className="submit-button"
          >
            {profileUpdating ? 'Saving...' : 'Complete Profile'}
          </button>

          <button 
            type="button" 
            onClick={handleSkip}
            className="skip-button"
            disabled={profileUpdating}
          >
            Skip for Now
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReduxProfile;