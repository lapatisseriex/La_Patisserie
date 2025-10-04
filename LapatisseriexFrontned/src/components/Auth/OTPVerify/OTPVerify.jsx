import React, { useState, useRef, useEffect } from 'react';

import { useAuth } from '../../../context/AuthContext/AuthContextRedux';


const OTPVerify = () => {
  const { verifyOTP, changeAuthType, authError, loading, tempPhoneNumber, sendOTP } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [localError, setLocalError] = useState('');
  const [resendDisabled, setResendDisabled] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRefs = useRef([]);
  
  // Mask phone number for display
  const maskedPhone = tempPhoneNumber ? 
    `+91 ${tempPhoneNumber.slice(0, 2)}****${tempPhoneNumber.slice(-4)}` : 
    '';
    
  // Clear local error when authError changes
  useEffect(() => {
    if (authError) {
      setLocalError(authError);
    } else {
      setLocalError('');
    }
  }, [authError]);
  
  // Setup countdown for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setResendDisabled(false);
    }
  }, [countdown]);
  
  // Handle OTP input change
  const handleChange = (index, value) => {
    if (value.length <= 1 && /^[0-9]*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto-focus to next input
      if (value && index < 5) {
        inputRefs.current[index + 1].focus();
      }
    }
  };
  
  // Handle key press for backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };
  
  // Handle paste functionality
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    if (pastedData.length === 6 && pastedData.every(char => /^[0-9]$/.test(char))) {
      setOtp(pastedData);
      inputRefs.current[5].focus();
    }
  };
  
  // Handle OTP verification
  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    
    if (otpValue.length !== 6) {
      setLocalError('Please enter a valid 6-digit OTP');
      return;
    }
    
    // Reset error
    setLocalError('');
    
    // Verify OTP with Firebase
    const success = await verifyOTP(otpValue);
    
    if (success) {
      setIsSuccess(true);
      // The auth panel will close automatically via the AuthContext
    }
  };
  
  // Handle resend OTP
  const handleResendOtp = async () => {
    if (resendDisabled) return;
    
    // Extract phone number without country code for resend
    const phoneNumber = tempPhoneNumber.replace('+91', '');
    
    // Resend OTP
    const success = await sendOTP(phoneNumber);
    
    if (success) {
      // Reset OTP input fields
      setOtp(['', '', '', '', '', '']);
      // Reset countdown
      setCountdown(30);
      setResendDisabled(true);
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Header with back button and title */}
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-white">
        <div className="flex items-center">
          <button 
            type="button"
            onClick={() => changeAuthType('login')}
            disabled={loading}
            className="mr-3 text-black hover:text-black"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-black">OTP Verification</h2>
          </div>
        </div>
        <div className="w-14 h-14 flex items-center justify-center">
          <img src="/images/logo.png" alt="Cake Logo" className="w-full h-full object-contain" />
        </div>
      </div>
      <p className="text-sm text-black mb-6">Enter verification code sent to {maskedPhone}</p>
      
      <form className="flex-1 flex flex-col" onSubmit={handleSubmit}>
        {/* OTP Input section */}
        <div className="flex-1">
          <div className="mb-8">
            <p className="text-base font-medium text-black mb-6">Enter the 6-digit code</p>
            
            <div className="flex justify-between mb-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : null}
                  disabled={loading}
                  className="w-[14%] h-12 text-center text-xl font-bold border-b-2 border-white focus:border-white focus:outline-none transition-colors"
                  maxLength={1}
                  autoFocus={index === 0}
                  aria-label={`OTP digit ${index + 1}`}
                />
              ))}
            </div>
            
            {localError && (
              <p className="text-red-500 text-sm">{localError}</p>
            )}
            
            <div className="flex justify-center mt-6">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendDisabled || loading}
                className={`text-black text-sm font-medium transition-colors ${
                  resendDisabled || loading ? 'opacity-60 cursor-not-allowed' : 'hover:text-black/80'
                }`}
              >
                {resendDisabled ? `Resend code in ${countdown}s` : 'Resend code'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Bottom section with verify button */}
        <div className="mt-auto">
          <button 
            type="submit" 
            disabled={loading || otp.some(digit => !digit) || isSuccess}
            className={`w-full py-3.5 rounded-lg text-lg font-medium transition-colors shadow-md ${
              isSuccess 
                ? 'bg-green-500 text-white' 
                : loading || otp.some(digit => !digit) 
                ? 'bg-black text-white opacity-60 cursor-not-allowed' 
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {isSuccess ? '✓ VERIFIED!' : loading ? 'VERIFYING...' : 'VERIFY'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OTPVerify;





