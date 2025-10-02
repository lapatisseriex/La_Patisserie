import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext/AuthContextRedux';

const ReduxLogin = () => {
  const [phone, setPhone] = useState('');
  const { 
    sendOTP, 
    setAuthType, 
    error, 
    otpSending, 
    clearError,
    setTempPhoneNumber 
  } = useAuth();
  const [localError, setLocalError] = useState('');

  // Clear local error when Redux error changes
  useEffect(() => {
    if (error) {
      setLocalError(error);
    } else {
      setLocalError('');
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (phone.length !== 10) {
      setLocalError('Please enter a valid 10-digit mobile number');
      return;
    }
    
    // Reset error
    setLocalError('');
    clearError();
    
    // Format phone number
    const formattedPhone = `+91${phone}`;
    setTempPhoneNumber(formattedPhone);
    
    try {
      // Send OTP via Redux action
      await sendOTP(formattedPhone, 'recaptcha-container');
      // Success - Redux will handle navigation to OTP screen
    } catch (error) {
      setLocalError(error.message || 'Failed to send OTP');
    }
  };

  const validatePhoneNumber = (value) => {
    // Remove any non-digit characters
    const cleaned = value.replace(/\D/g, '');
    
    // Limit to 10 digits
    if (cleaned.length <= 10) {
      setPhone(cleaned);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h2>Welcome to La Patisserie</h2>
        <p>Enter your mobile number to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="phone-input-container">
          <div className="country-code">
            <span className="flag">🇮🇳</span>
            <span>+91</span>
          </div>
          <input
            type="tel"
            value={phone}
            onChange={(e) => validatePhoneNumber(e.target.value)}
            placeholder="Mobile Number"
            className="phone-input"
            maxLength="10"
            disabled={otpSending}
          />
        </div>

        {localError && (
          <div className="error-message">
            {localError}
          </div>
        )}

        <button 
          type="submit" 
          disabled={phone.length !== 10 || otpSending}
          className="submit-button"
        >
          {otpSending ? 'Sending OTP...' : 'Send OTP'}
        </button>

        <div className="auth-footer">
          <p>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </form>

      {/* Hidden recaptcha container */}
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default ReduxLogin;