import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { Mail, CheckCircle, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { emailService } from '../../../services/apiService';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import EmailUpdate from '../EmailUpdate';

/**
 * Email Verification Component
 * Provides UI for users to verify their email with OTP
 */
const EmailVerification = ({ 
  email, 
  setEmail, 
  isVerified, 
  setIsVerified, 
  onVerificationSuccess,
  showChangeEmail = true
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(!email);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isResending, setIsResending] = useState(false);
  
  // References for OTP input fields
  const inputRefs = useRef([]);
  
  // Access auth context for user data
  const { user, updateEmailVerificationState } = useAuth();
  
  // Timer interval ref
  const timerRef = useRef(null);

  // Check if email is already verified in the database when component mounts
  useEffect(() => {
    let isMounted = true;
    
    const checkStatus = async () => {
      // First check if we already know the status from props
      if (isVerified) {
        console.log('Email already verified from props:', email);
        return;
      }
      
      try {
        // Check context first (to avoid API call if possible)
        if (user && user.email === email && user.isEmailVerified) {
          if (isMounted) {
            console.log('Email verified from user context:', email);
            setIsVerified(true);
            if (onVerificationSuccess) {
              onVerificationSuccess(user.email);
            }
          }
          return;
        }
        
        // Also check localStorage (to avoid API call if possible)
        const savedUserData = JSON.parse(localStorage.getItem('savedUserData') || '{}');
        if (savedUserData.email === email && savedUserData.isEmailVerified) {
          if (isMounted) {
            console.log('Email verified from savedUserData:', email);
            setIsVerified(true);
            updateEmailVerificationState(email, true);
            if (onVerificationSuccess) {
              onVerificationSuccess(email);
            }
          }
          return;
        }
        
        // Always check with backend to ensure we have the latest status
        console.log('Checking email verification status with backend for:', email);
        const status = await emailService.checkVerificationStatus();
        console.log('Backend verification status:', status);
        
        if (isMounted) {
          if (status.email && status.isEmailVerified) {
            console.log('Email verified according to backend:', status.email);
            setIsVerified(status.isEmailVerified);
            
            // Always update the auth context and local storage
            updateEmailVerificationState(status.email, status.isEmailVerified);
            
            // Also update savedUserData
            const savedData = JSON.parse(localStorage.getItem('savedUserData') || '{}');
            savedData.email = status.email;
            savedData.isEmailVerified = status.isEmailVerified;
            localStorage.setItem('savedUserData', JSON.stringify(savedData));
            
            if (status.isEmailVerified && onVerificationSuccess) {
              onVerificationSuccess(status.email);
            }
          }
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
      }
    };
    
    if (email) {
      checkStatus();
    } else {
      console.log('No email to check verification status for');
    }
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [user, email, isVerified, onVerificationSuccess, updateEmailVerificationState]);

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

  // Handle sending verification email
  const handleSendVerification = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      const result = await emailService.sendVerificationEmail(email);
      setMaskedEmail(result.emailMasked);
      setIsEditingEmail(false);
      startTimer(result.expiresAt);
      setSuccess('Verification code sent! Please check your email.');
    } catch (err) {
      console.error('Error sending verification email:', err);
      
      // Check if error is related to authentication
      if (err.message && (
          err.message.includes('token') || 
          err.message.includes('auth') || 
          err.message.includes('unauthorized')
        )) {
        setError('Your session has expired. Please refresh the page and try again.');
      } else {
        setError(err.message || 'Failed to send verification email');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle resending verification email
  const handleResendVerification = async () => {
    setError('');
    setSuccess('');
    setIsResending(true);
    
    try {
      const result = await emailService.resendVerificationEmail();
      startTimer(result.expiresAt);
      setSuccess('Verification code resent! Please check your email.');
    } catch (err) {
      console.error('Error resending verification email:', err);
      
      // Check if error is related to authentication
      if (err.message && (
          err.message.includes('token') || 
          err.message.includes('auth') || 
          err.message.includes('unauthorized')
        )) {
        setError('Your session has expired. Please refresh the page and try again.');
      } else {
        setError(err.message || 'Failed to resend verification email');
      }
    } finally {
      setIsResending(false);
    }
  };

  // Handle OTP input change with optimized rendering
  const handleOtpChange = (index, value) => {
    // Allow only numbers and return early if invalid
    if (value && !/^\d+$/.test(value)) return;
    
    // Clear any previous errors
    if (error) setError('');
    
    // Update OTP state using functional update to ensure latest state
    setOtp(prevOtp => {
      const newOtp = [...prevOtp];
      newOtp[index] = value;
      return newOtp;
    });
    
    // Auto-focus next input
    if (value && index < 5 && inputRefs.current[index + 1]) {
      // Use requestAnimationFrame to ensure state update doesn't block focus
      requestAnimationFrame(() => {
        inputRefs.current[index + 1].focus();
      });
    }
  };

  // Handle key press for OTP inputs with debounce
  const handleKeyDown = (index, e) => {
    // Use switch for more efficient handling
    switch(e.key) {
      case 'Backspace':
        if (otp[index] === '' && index > 0 && inputRefs.current[index - 1]) {
          // Move to previous input on backspace when empty
          inputRefs.current[index - 1].focus();
        }
        break;
      case 'ArrowLeft':
        if (index > 0 && inputRefs.current[index - 1]) {
          inputRefs.current[index - 1].focus();
        }
        break;
      case 'ArrowRight':
        if (index < 5 && inputRefs.current[index + 1]) {
          inputRefs.current[index + 1].focus();
        }
        break;
      default:
        // No action needed for other keys
        break;
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

  // Handle OTP verification
  const handleVerify = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit verification code');
      return;
    }
    
    setError('');
    setVerifying(true);
    
    try {
      const result = await emailService.verifyEmail(otpString);
      
      // Clear timer early to reduce background work
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Update email verification state in auth context
      // This will also update the savedUserData in localStorage
      updateEmailVerificationState(result.email, true);
      
      // Update component state
      setIsVerified(true);
      setSuccess('Email verified successfully!');
      
      // Callback when verification is successful
      if (onVerificationSuccess) {
        // Small delay to allow UI to update
        setTimeout(() => {
          onVerificationSuccess(result.email);
        }, 100);
      }
    } catch (err) {
      console.error('Error verifying email:', err);
      
      // Simplify error handling with switch case for better performance
      let errorMessage = 'Invalid verification code';
      
      if (err.message) {
        if (err.message.includes('expired')) {
          errorMessage = 'Verification code has expired. Please request a new one.';
        } else if (err.message.includes('token') || 
                   err.message.includes('auth') || 
                   err.message.includes('unauthorized')) {
          errorMessage = 'Your session has expired. Please refresh the page and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setVerifying(false);
    }
  };

  // Cleanup timer on component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const [showUpdateForm, setShowUpdateForm] = useState(false);
  
  // Handle update email click
  const handleUpdateEmailClick = () => {
    setShowUpdateForm(true);
  };
  
  // Handle cancel update
  const handleCancelUpdate = () => {
    setShowUpdateForm(false);
  };
  
  // Handle update success
  const handleUpdateSuccess = (newEmail) => {
    setEmail(newEmail);
    setShowUpdateForm(false);
  };

  // If already verified, show success state with update option
  if (isVerified) {
    console.log('Showing verified email UI. ShowChangeEmail:', showChangeEmail);
    
    if (showUpdateForm) {
      console.log('Showing email update form');
      // Use the imported EmailUpdate component
      return <EmailUpdate onUpdateSuccess={handleUpdateSuccess} onCancel={handleCancelUpdate} />;
    }
    
    return (
      <div className="bg-gray-50 p-6 rounded-lg border border-green-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-green-500" size={20} />
            <span className="font-medium">Email Verified</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-gray-600 ml-8 font-medium">{email}</p>
          {showChangeEmail && (
            <button 
              onClick={handleUpdateEmailClick}
              className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors flex items-center gap-2"
            >
              <Mail size={16} /> Change Email
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-medium mb-4">Email Verification</h3>
      
      {/* Email Input Section */}
      {isEditingEmail ? (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Mail size={18} className="text-gray-500" />
            </div>
            <input
              type="email"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Enter your email address"
              value={email || ''}
              onChange={handleEmailChange}
              disabled={loading}
            />
          </div>
          
          <div className="mt-4">
            <button
              onClick={handleSendVerification}
              disabled={!email || loading}
              className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md 
                ${!email || loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-black hover:bg-gray-800'} text-white`}
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            {showChangeEmail && (
              <button 
                onClick={() => setIsEditingEmail(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Change
              </button>
            )}
          </div>
          <p className="text-gray-800 mt-1">{maskedEmail || email}</p>
          
          {timeLeft > 0 && (
            <div className="mt-1 text-sm text-gray-500">
              Verification code expires in {formatTime(timeLeft)}
            </div>
          )}

          {/* Added Verify Button */}
          <button
            onClick={handleSendVerification}
            disabled={loading || isResending || timeLeft > 0}
            className={`mt-4 w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md 
              ${loading || isResending || timeLeft > 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-black hover:bg-gray-800'} text-white`}
          >
            {loading ? 'Sending...' : isResending || timeLeft > 0 ? `Resend in ${formatTime(timeLeft)}` : 'Send Verification Code'}
            {!loading && <Mail size={16} />}
          </button>
        </div>
      )}
      
      {/* OTP Input Section - show only after email is submitted */}
      {!isEditingEmail && (
        <>
          <div className="mb-4">
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
            
            <div className="flex justify-between mt-2">
              <button
                onClick={handleResendVerification}
                disabled={isResending || timeLeft > 0}
                className={`text-sm flex items-center gap-1 
                  ${isResending || timeLeft > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
              >
                <RefreshCw size={14} />
                {isResending ? 'Resending...' : timeLeft > 0 ? `Resend in ${formatTime(timeLeft)}` : 'Resend Code'}
              </button>
              
              <button
                onClick={handleVerify}
                disabled={otp.join('').length !== 6 || verifying}
                className={`text-sm flex items-center gap-1 
                  ${otp.join('').length !== 6 || verifying ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
              >
                {verifying ? 'Verifying...' : 'Verify Code'}
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </>
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
export default memo(EmailVerification, (prevProps, nextProps) => {
  // Only re-render when these props change
  return (
    prevProps.email === nextProps.email &&
    prevProps.isVerified === nextProps.isVerified &&
    prevProps.showChangeEmail === nextProps.showChangeEmail
  );
});