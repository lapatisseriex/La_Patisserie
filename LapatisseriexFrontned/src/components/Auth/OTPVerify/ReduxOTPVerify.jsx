import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../hooks/useAuth';

const ReduxOTPVerify = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const { 
    verifyOTP, 
    tempPhoneNumber, 
    error, 
    otpVerifying, 
    clearError,
    setAuthType 
  } = useAuth();
  const [localError, setLocalError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);

  // Clear local error when Redux error changes
  useEffect(() => {
    if (error) {
      setLocalError(error);
    } else {
      setLocalError('');
    }
  }, [error]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newOtp.every(digit => digit !== '') && !otpVerifying) {
      handleSubmit(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (otpValue = null) => {
    const otpCode = otpValue || otp.join('');
    
    if (otpCode.length !== 6) {
      setLocalError('Please enter a valid 6-digit OTP');
      return;
    }

    // Reset error
    setLocalError('');
    clearError();
    
    try {
      // Verify OTP via Redux action
      await verifyOTP(otpCode);
      // Success - Redux will handle navigation
    } catch (error) {
      setLocalError(error.message || 'Invalid OTP. Please try again.');
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    
    setResendCooldown(30); // 30 seconds cooldown
    setAuthType('login'); // Go back to login to resend
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    // Remove +91 and format as XXX-XXX-XXXX
    const cleaned = phone.replace('+91', '');
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h2>Verify OTP</h2>
        <p>
          Enter the 6-digit code sent to{' '}
          <strong>{formatPhoneNumber(tempPhoneNumber)}</strong>
        </p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="auth-form">
        <div className="otp-input-container">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="otp-input"
              maxLength="1"
              disabled={otpVerifying}
            />
          ))}
        </div>

        {localError && (
          <div className="error-message">
            {localError}
          </div>
        )}

        <button 
          type="submit" 
          disabled={otp.some(digit => !digit) || otpVerifying}
          className="submit-button"
        >
          {otpVerifying ? 'Verifying...' : 'Verify OTP'}
        </button>

        <div className="resend-container">
          {resendCooldown > 0 ? (
            <p>Resend OTP in {resendCooldown}s</p>
          ) : (
            <button 
              type="button" 
              onClick={handleResendOTP}
              className="resend-button"
            >
              Resend OTP
            </button>
          )}
        </div>

        <button 
          type="button" 
          onClick={() => setAuthType('login')}
          className="back-button"
        >
          ← Change Number
        </button>
      </form>
    </div>
  );
};

export default ReduxOTPVerify;