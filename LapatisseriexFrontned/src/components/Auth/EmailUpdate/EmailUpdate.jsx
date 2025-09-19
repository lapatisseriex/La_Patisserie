import React, { useState, useCallback } from 'react';
import { Mail, CheckCircle, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { emailService } from '../../../services/apiService';
import { useAuth } from '../../../context/AuthContext/AuthContext';

/**
 * Email Update Component
 * Provides UI for users to update their verified email address
 */
const EmailUpdate = ({ 
  onUpdateSuccess,
  onCancel
}) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  
  // References for OTP input fields
  const inputRefs = React.useRef([]);
  
  // Access auth context for user data
  const { user, updateEmailVerificationState } = useAuth();
  
  // Timer interval ref
  const timerRef = React.useRef(null);

  // Set up timer when OTP is sent
  const startTimer = (expiresAt) => {
    // Clear existing timer if any
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Convert expiresAt to a timestamp to avoid repeated Date object creation
    const expiresAtTimestamp = new Date(expiresAt).getTime();
    
    const calculateTimeLeft = () => {
      const now = Date.now();
      const difference = expiresAtTimestamp - now;
      
      if (difference <= 0) {
        clearInterval(timerRef.current);
        setTimeLeft(0);
        return;
      }
      
      // Only update state if the seconds value has changed (reduce renders)
      const newSeconds = Math.round(difference / 1000);
      setTimeLeft(prevTime => prevTime !== newSeconds ? newSeconds : prevTime);
    };
    
    // Initial calculation
    calculateTimeLeft();
    
    // Update every second
    timerRef.current = setInterval(calculateTimeLeft, 1000);
  };

  // Format timer display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle email input change
  const handleEmailChange = (e) => {
    setError('');
    setEmail(e.target.value);
  };

  // Handle sending verification email for update
  const handleSendVerification = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    
    // Email validation
    if (!email || !email.trim()) {
      setError('Please enter an email address');
      setLoading(false);
      return;
    }
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }
    
    try {
      const result = await emailService.updateEmail(email);
      setMaskedEmail(result.emailMasked);
      setIsOtpSent(true);
      startTimer(result.expiresAt);
      setSuccess('Verification code sent to your new email address!');
    } catch (err) {
      console.error('Error sending verification email for update:', err);
      
      // Check if error is related to authentication
      if (err.message && (
          err.message.includes('token') || 
          err.message.includes('auth') || 
          err.message.includes('unauthorized')
        )) {
        setError('Your session has expired. Please refresh the page and try again.');
      } else if (err.message && err.message.includes('already in use')) {
        setError('This email is already in use by another account');
      } else {
        setError(err.message || 'Failed to send verification email');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    // Allow only numbers
    if (value && !/^\d+$/.test(value)) return;
    
    setError('');
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Handle key press for OTP inputs
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        // Move to previous input on backspace when empty
        const newOtp = [...otp];
        inputRefs.current[index - 1].focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1].focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Handle pasting OTP
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    
    // Check if pasted data is 6 digit number
    if (/^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split('');
      setOtp(digits);
      
      // Focus last field after paste
      inputRefs.current[5].focus();
    }
  };

  // Handle OTP verification for email update
  const handleVerify = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit verification code');
      return;
    }
    
    setError('');
    setVerifying(true);
    
    try {
      const result = await emailService.verifyUpdatedEmail(otpString);
      setSuccess('Email updated and verified successfully!');
      
      // Clear timer
      if (timerRef.current) clearInterval(timerRef.current);
      
      // Update email verification state in auth context and localStorage
      updateEmailVerificationState(result.email, true);
      
      // Also update the savedUserData for persistence across sessions
      const savedUserData = JSON.parse(localStorage.getItem('savedUserData') || '{}');
      savedUserData.email = result.email;
      savedUserData.isEmailVerified = true;
      localStorage.setItem('savedUserData', JSON.stringify(savedUserData));
      
      // Disable inputs and buttons after successful verification
      setOtp(['✓', '✓', '✓', '✓', '✓', '✓']);
      
      // Callback when update verification is successful
      if (onUpdateSuccess) {
        setTimeout(() => {
          onUpdateSuccess(result.email);
        }, 2000);
      }
    } catch (err) {
      console.error('Error verifying email update:', err);
      
      // Check if error is related to authentication
      if (err.message && (
          err.message.includes('token') || 
          err.message.includes('auth') || 
          err.message.includes('unauthorized')
        )) {
        setError('Your session has expired. Please refresh the page and try again.');
      } else if (err.message && err.message.includes('expired')) {
        setError('Verification code has expired. Please request a new one.');
        setTimeLeft(0); // Reset timer to allow requesting a new code
      } else {
        setError(err.message || 'Invalid verification code');
      }
    } finally {
      setVerifying(false);
    }
  };

  // Cleanup timer on component unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-300 shadow-sm">
      <h3 className="text-lg font-medium mb-4">Change Your Email Address</h3>
      <p className="text-sm text-gray-600 mb-4">Update your email address by entering a new email and verifying it with a code.</p>
      
      {/* Email Input Section */}
      {!isOtpSent ? (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Mail size={18} className="text-gray-500" />
            </div>
            <input
              type="email"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your new email address"
              value={email}
              onChange={handleEmailChange}
              disabled={loading}
            />
          </div>
          
          <div className="mt-4 flex space-x-2">
            <button
              onClick={onCancel}
              className="flex-1 py-2 px-4 rounded-md border border-gray-300 hover:bg-gray-100 text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSendVerification}
              disabled={!email || loading}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md 
                ${!email || loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Mail size={16} />
                  <span>Send Code</span>
                </>
              )}
              {!loading && <ArrowRight size={16} />}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">New Email Address</label>
          </div>
          <p className="text-gray-800 mt-1">{maskedEmail || email}</p>
          
          {timeLeft > 0 && (
            <div className="mt-1 text-sm text-gray-500">
              Verification code expires in {formatTime(timeLeft)}
            </div>
          )}

          {/* OTP Input Section */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Verification Code
            </label>
            <div className="grid grid-cols-6 gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-full py-2 text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent text-lg"
                  disabled={verifying}
                />
              ))}
            </div>
            
            <div className="flex justify-between mt-4">
              <button
                onClick={onCancel}
                className="py-2 px-4 rounded-md border border-gray-300 hover:bg-gray-100 text-gray-800 flex items-center gap-2"
              >
                <span>Cancel</span>
              </button>
              <button
                onClick={handleVerify}
                disabled={otp.join('').length !== 6 || verifying}
                className={`flex items-center gap-2 py-2 px-4 rounded-md 
                  ${otp.join('').length !== 6 || verifying ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
              >
                {verifying ? (
                  <>
                    <RefreshCw className="animate-spin h-4 w-4" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Verify & Update</span>
                  </>
                )}
                {!verifying && <CheckCircle size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Error and Success Messages */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="mt-2 flex items-center gap-2 text-green-600 text-sm">
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}
    </div>
  );
};

// Use memo to prevent unnecessary re-renders
export default React.memo(EmailUpdate);