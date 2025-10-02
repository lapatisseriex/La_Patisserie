import React, { useState, useEffect, useRef } from 'react';
import { Mail, Phone, MapPin, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext/AuthContextRedux';
import { useLocation } from '../../../context/LocationContext/LocationContext';
// Email verification flow removed

const EnhancedSignup = () => {
  // Start directly at phone verification (phone-first flow)
  const [currentStep, setCurrentStep] = useState('phone'); // start on phone by default (phone-first flow)
  const [selectedMethod, setSelectedMethod] = useState('phone'); // default to phone
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    locationId: '',
  });
  const [emailOtp, setEmailOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  
  const { sendOTP, changeAuthType, authError, loading: authLoading, verifyOTP, signUpWithGoogle, signUpWithEmail } = useAuth();
  const { locations, loading: locationsLoading } = useLocation();
  
  // References for OTP input fields
  const inputRefs = useRef([]);
  const timerRef = useRef(null);
  
  // Clear local error when authError changes
  useEffect(() => {
    if (authError) {
      setLocalError(authError);
    } else {
      setLocalError('');
    }
  }, [authError]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer functions
  const startTimer = (expiresAt) => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    const expiresAtTimestamp = new Date(expiresAt).getTime();
    
    const calculateTimeLeft = () => {
      const now = Date.now();
      const difference = expiresAtTimestamp - now;
      
      if (difference <= 0) {
        clearInterval(timerRef.current);
        setTimeLeft(0);
        return;
      }
      
      const newSeconds = Math.round(difference / 1000);
      setTimeLeft(prevTime => prevTime !== newSeconds ? newSeconds : prevTime);
    };
    
    calculateTimeLeft();
    timerRef.current = setInterval(calculateTimeLeft, 1000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
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
    setLocalError('');
  };

  // Handle email OTP input
  const handleEmailOtpChange = (index, value) => {
    if (value.length > 1) return;
    
    const newOtp = [...emailOtp];
    newOtp[index] = value;
    setEmailOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    setLocalError('');
  };

  // Handle backspace in OTP inputs
  const handleEmailOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !emailOtp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Method selection handlers
  const handleMethodSelect = (method) => {
    if (method === 'google') {
      setCurrentStep('google-location');
    } else if (method === 'email') {
      setCurrentStep('email');
    }
  };

  // Google Authentication
  const handleGoogleSignup = async () => {
    setLoading(true);
    setLocalError('');
    console.log("💯💯💯💯💯💯💯💯");
    try {
      const success = await signUpWithGoogle(formData.locationId);
      
      if (success) {
        setSuccess('Successfully signed up with Google!');
      }
      
    } catch (error) {
      console.error('Google signup error:', error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        setLocalError('Sign-up cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        setLocalError('Popup blocked. Please allow popups and try again.');
      } else {
        setLocalError('Failed to sign up with Google. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Phone verification
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.phone.length !== 10) {
      setLocalError('Please enter a valid 10-digit mobile number');
      return;
    }
    
    if (!formData.locationId) {
      setLocalError('Please select a delivery location');
      return;
    }
    
    setLocalError('');
    const success = await sendOTP(formData.phone, formData.locationId);
    
    if (success) {
      setCurrentStep('otp');
    } else if (!authError) {
      setLocalError('Failed to send OTP. Please try again.');
    }
  };

  // Email submission (verification removed)
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      setLocalError('Please enter a valid email address');
      return;
    }
    
    if (!formData.locationId) {
      setLocalError('Please select a delivery location');
      return;
    }
    
    // Skip sending verification code; instead, proceed to account creation via email path if implemented later
    setSuccess('Email captured. Verification temporarily disabled.');
  };

  // Verify email OTP
  const handleEmailOtpSubmit = async (e) => {
    e.preventDefault();
    
    const otpCode = emailOtp.join('');
    if (otpCode.length !== 6) {
      setLocalError('Please enter the complete 6-digit verification code');
      return;
    }
    
    setLoading(true);
    setLocalError('');
    
    try {
      const success = await signUpWithEmail(formData.email, formData.locationId, otpCode);
      
      if (success) {
        setSuccess('Email verified and account created successfully!');
      }
      
    } catch (err) {
      console.error('Error verifying email:', err);
      setLocalError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  // Resend email verification (removed)
  const handleResendEmailOtp = async () => {
    // No-op while verification is disabled
  };

  // Render method selection step
  const renderMethodSelection = () => (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-white">
        <div>
          <h2 className="text-2xl font-bold text-black">Create your account</h2>
          <p className="text-sm text-black">Choose how you’d like to continue</p>
        </div>
        <button onClick={() => changeAuthType('login')} className="text-gray-500 hover:text-gray-700">←</button>
      </div>

      <div className="flex-1 flex flex-col justify-center space-y-4">
        <button 
          type="button"
          onClick={() => handleMethodSelect('google')}
          className="w-full bg-white border-2 border-gray-300 text-black py-3.5 rounded-lg text-lg font-medium transition-colors shadow-md flex items-center justify-center space-x-3 hover:bg-gray-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>CONTINUE WITH GOOGLE</span>
        </button>

        <button 
          type="button"
          onClick={() => handleMethodSelect('email')}
          className="w-full bg-black text-white py-3.5 rounded-lg text-lg font-medium transition-colors shadow-md hover:bg-gray-200/90"
        >
          CONTINUE WITH EMAIL
        </button>
      </div>
    </div>
  );

  // Render phone input step
  const renderPhoneStep = () => (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-white">
        <div>
          <h2 className="text-2xl font-bold text-black">Phone Verification</h2>
          <p className="text-sm text-black">Enter your phone number</p>
        </div>
        <button onClick={() => changeAuthType('login')} className="text-gray-500 hover:text-gray-700">←</button>
      </div>
      
      <form className="flex-1 flex flex-col" onSubmit={handlePhoneSubmit}>
        <div className="flex-1">
          <div className="mb-6">
            <div className="relative">
              <div className="flex items-center border-b-2 border-white pb-2 focus-within:border-white">
                <span className="text-black font-medium mr-2">+91</span>
                <input
                  type="tel"
                  name="phone"
                  placeholder="10-digit mobile number"
                  value={formData.phone}
                  onChange={handleChange}
                  maxLength={10}
                  required
                  disabled={authLoading}
                  className="w-full py-2 focus:outline-none text-lg"
                />
              </div>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-lg font-medium text-black mb-4">Select your delivery location</p>
            
            <div className="relative">
              <select
                name="locationId"
                value={formData.locationId}
                onChange={handleChange}
                disabled={authLoading || locationsLoading}
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
            </div>
          </div>
          
          <div id="recaptcha-container"></div>
          
          {localError && (
            <p className="text-red-500 text-sm mt-2">{localError}</p>
          )}
        </div>
        
        <div className="mt-auto space-y-4">
          <button 
            type="submit" 
            disabled={authLoading || formData.phone.length !== 10 || !formData.locationId}
            className={`w-full bg-black text-white py-3.5 rounded-lg text-lg font-medium transition-colors shadow-md ${
              authLoading || formData.phone.length !== 10 || !formData.locationId
                ? 'opacity-60 cursor-not-allowed' 
                : 'hover:bg-gray-200/90'
            }`}
          >
            {authLoading ? 'SENDING...' : 'SEND OTP'}
          </button>
          
          {/* Optional: Link to other methods */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setCurrentStep('method')}
              className="text-black font-medium hover:text-black/80"
            >
              Use Google or Email instead
            </button>
          </div>
        </div>
      </form>
    </div>
  );

  // Render email input step
  const renderEmailStep = () => (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-white">
        <div>
          <h2 className="text-2xl font-bold text-black">Email Verification</h2>
          <p className="text-sm text-black">Enter your email address</p>
        </div>
        <button onClick={() => setCurrentStep('method')} className="text-gray-500 hover:text-gray-700">←</button>
      </div>
      
      <form className="flex-1 flex flex-col" onSubmit={handleEmailSubmit}>
        <div className="flex-1">
          <div className="mb-6">
            <div className="relative">
              <div className="flex items-center border-b-2 border-white pb-2 focus-within:border-white">
                <Mail className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full py-2 focus:outline-none text-lg"
                />
              </div>
            </div>
          </div>

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
            </div>
          </div>
          
          {localError && (
            <p className="text-red-500 text-sm mt-2">{localError}</p>
          )}
          
          {success && (
            <p className="text-green-500 text-sm mt-2">{success}</p>
          )}
        </div>
        
        <div className="mt-auto space-y-4">
          <button 
            type="submit" 
            disabled={loading || !formData.email.trim() || !formData.locationId}
            className={`w-full bg-black text-white py-3.5 rounded-lg text-lg font-medium transition-colors shadow-md ${
              loading || !formData.email.trim() || !formData.locationId
                ? 'opacity-60 cursor-not-allowed' 
                : 'hover:bg-gray-200/90'
            }`}
          >
            {loading ? 'SENDING...' : 'SEND VERIFICATION CODE'}
          </button>

          {/* Divider */}
          <div className="flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-3 text-gray-500 text-sm">OR</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Continue with Google directly from Email step using selected location */}
          <button 
            type="button"
            onClick={handleGoogleSignup}
            disabled={loading || !formData.locationId}
            className={`w-full bg-white border-2 border-gray-300 text-black py-3.5 rounded-lg text-lg font-medium transition-colors shadow-md flex items-center justify-center space-x-3 ${
              loading || !formData.locationId
                ? 'opacity-60 cursor-not-allowed' 
                : 'hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>CONTINUE WITH GOOGLE</span>
          </button>
        </div>
      </form>
    </div>
  );

  // Render email OTP verification step
  const renderEmailOtpStep = () => (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-white">
        <div>
          <h2 className="text-2xl font-bold text-black">Verify Email</h2>
          <p className="text-sm text-black">Enter the code sent to {maskedEmail}</p>
        </div>
        <button onClick={() => setCurrentStep('email')} className="text-gray-500 hover:text-gray-700">←</button>
      </div>
      
      <form className="flex-1 flex flex-col" onSubmit={handleEmailOtpSubmit}>
        <div className="flex-1">
          <div className="mb-6">
            <div className="flex justify-center space-x-3 mb-6">
              {emailOtp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => inputRefs.current[index] = el}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleEmailOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleEmailOtpKeyDown(index, e)}
                  disabled={loading}
                  className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none disabled:opacity-60"
                />
              ))}
            </div>
          </div>

          {timeLeft > 0 && (
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600">
                Code expires in: <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
              </p>
            </div>
          )}

          {timeLeft === 0 && (
            <div className="text-center mb-4">
              <button
                type="button"
                onClick={handleResendEmailOtp}
                disabled={isResending}
                className="text-black font-medium hover:text-black/80 transition-colors disabled:opacity-60 flex items-center justify-center mx-auto space-x-2"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Resending...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Resend Code</span>
                  </>
                )}
              </button>
            </div>
          )}
          
          {localError && (
            <p className="text-red-500 text-sm text-center">{localError}</p>
          )}
          
          {success && (
            <p className="text-green-500 text-sm text-center">{success}</p>
          )}
        </div>
        
        <div className="mt-auto">
          <button 
            type="submit" 
            disabled={loading || emailOtp.join('').length !== 6}
            className={`w-full bg-black text-white py-3.5 rounded-lg text-lg font-medium transition-colors shadow-md ${
              loading || emailOtp.join('').length !== 6
                ? 'opacity-60 cursor-not-allowed' 
                : 'hover:bg-gray-200/90'
            }`}
          >
            {loading ? 'VERIFYING...' : 'VERIFY EMAIL'}
          </button>
        </div>
      </form>
    </div>
  );

  // Render Google location selection step
  const renderGoogleLocationStep = () => (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-white">
        <div>
          <h2 className="text-2xl font-bold text-black">Continue with Google</h2>
          <p className="text-sm text-black">Select your delivery location</p>
        </div>
        <button onClick={() => setCurrentStep('method')} className="text-gray-500 hover:text-gray-700">←</button>
      </div>
      
      <form className="flex-1 flex flex-col" onSubmit={(e) => { e.preventDefault(); handleGoogleSignup(); }}>
        <div className="flex-1">
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
            </div>
          </div>
          
          {localError && (
            <p className="text-red-500 text-sm mt-2">{localError}</p>
          )}
          
          {success && (
            <p className="text-green-500 text-sm mt-2">{success}</p>
          )}
        </div>
        
        <div className="mt-auto">
          <button 
            type="submit" 
            disabled={loading || !formData.locationId}
            className={`w-full bg-black text-white py-3.5 rounded-lg text-lg font-medium transition-colors shadow-md flex items-center justify-center space-x-3 ${
              loading || !formData.locationId
                ? 'opacity-60 cursor-not-allowed' 
                : 'hover:bg-gray-200/90'
            }`}
          >
            {loading ? (
              'SIGNING UP...'
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>CONTINUE WITH GOOGLE</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );

  // Render based on current step
  switch (currentStep) {
    case 'phone':
      return renderPhoneStep();
    case 'method':
      return renderMethodSelection();
    case 'email':
      return renderEmailStep();
    case 'email-otp':
      return renderEmailOtpStep();
    case 'google-location':
      return renderGoogleLocationStep();
    case 'otp':
      // Handle OTP step if needed
      return renderPhoneStep(); // Fallback for now
    default:
      return renderPhoneStep();
  }
};

export default EnhancedSignup;