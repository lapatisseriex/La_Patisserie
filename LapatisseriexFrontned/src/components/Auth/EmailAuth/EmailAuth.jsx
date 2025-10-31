import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import '../auth.css';

const EmailAuth = ({ isSignUp = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: ''
  });
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  
  const { 
    signInWithEmail, 
    sendSignupOTP, 
    verifySignupOTP,
    signupOtp,
    clearError, 
    toggleAuthPanel, 
    changeAuthType, 
    setLoginFormEmail,
    resetSignupOtpState,
    isAuthenticated,
    user
  } = useAuth();

  // Clear local error and reset OTP state when switching between sign in and sign up
  useEffect(() => {
    setLocalError('');
    setOtpSent(false);
    setResendTimer(0);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      otp: ''
    });
    resetSignupOtpState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignUp]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Track email changes for forgot password feature
    if (name === 'email') {
      setLoginFormEmail(value);
    }
    
    setLocalError('');
  };

  // Handle sending OTP for signup
  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      setLocalError('Name is required');
      return;
    }
    
    if (!formData.email) {
      setLocalError('Email is required');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setLocalError('Please enter a valid email address');
      return;
    }
    
    if (!formData.password) {
      setLocalError('Password is required');
      return;
    }
    
    if (formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters long');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setLocalError('');
    clearError();
    
    try {
      console.log('🔄 Sending signup OTP to:', formData.email);
      
      const success = await sendSignupOTP({ email: formData.email });
      
      if (success) {
        console.log('✅ OTP sent successfully');
        setOtpSent(true);
        setResendTimer(120); // 2 minutes countdown
      } else {
        console.log('❌ Failed to send OTP');
        setLocalError(signupOtp.error || 'User email already exists');
      }
    } catch (err) {
      console.error('❌ Error sending OTP:', err);
      setLocalError(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  // Handle verifying OTP and creating account
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (!formData.otp) {
      setLocalError('Verification code is required');
      return;
    }
    
    if (formData.otp.length !== 6) {
      setLocalError('Verification code must be 6 digits');
      return;
    }
    
    setLoading(true);
    setLocalError('');
    clearError();
    
    try {
      console.log('🔄 Verifying OTP and creating account...');
      
      const success = await verifySignupOTP({
        email: formData.email,
        otp: formData.otp,
        password: formData.password,
        name: formData.name
      });
      
      if (success) {
        console.log('✅ Account created successfully');
        setTimeout(() => {
          toggleAuthPanel();
        }, 100);
      } else {
        console.log('❌ Failed to verify OTP');
        setLocalError(signupOtp.error || 'Invalid or expired verification code');
      }
    } catch (err) {
      console.error('❌ Error verifying OTP:', err);
      setLocalError(err.message || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  // Handle sign in (no OTP needed)
  const handleSignIn = async (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      setLocalError('Email is required');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setLocalError('Please enter a valid email address');
      return;
    }
    
    if (!formData.password) {
      setLocalError('Password is required');
      return;
    }
    
    if (formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters long');
      return;
    }
    
    setLoading(true);
    setLocalError('');
    clearError();
    
    try {
      console.log('🔄 Starting sign in with email...');
      
      const success = await signInWithEmail({
        email: formData.email,
        password: formData.password
      });
      
      if (success) {
        console.log('� Sign in successful, closing modal...');
        setTimeout(() => {
          toggleAuthPanel();
        }, 100);
      } else {
        console.log('❌ Sign in failed');
      }
    } catch (err) {
      console.error('❌ Sign in error:', err);
      setLocalError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  // Also close modal if user becomes authenticated
  React.useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🔐 User authenticated via email, closing modal via useEffect');
      toggleAuthPanel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  return (
    <div className="email-auth-container">
      {isSignUp ? (
        // Sign Up Form with OTP
        <>
          {!otpSent ? (
            // Step 1: Enter details and send OTP
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2 rounded-md focus:outline-none bg-gray-50"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full px-3 py-2 rounded-md focus:outline-none bg-gray-50"
                  disabled={loading}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full px-3 py-2 rounded-md focus:outline-none bg-gray-50"
                  disabled={loading}
                  required
                  minLength="6"
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="w-full px-3 py-2 rounded-md focus:outline-none bg-gray-50"
                  disabled={loading}
                  required
                />
              </div>
              
              {(localError || signupOtp.error) && (
                <div className="error-message text-red-600 text-sm">
                  {localError || signupOtp.error}
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                style={{
                  backgroundColor: '#733857'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8d4466'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#733857'}
              >
                {loading ? 'Sending Code...' : 'Send Verification Code'}
              </button>
            </form>
          ) : (
            // Step 2: Verify OTP
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">
                  We've sent a verification code to <strong>{formData.email}</strong>
                </p>
              </div>

              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Code
                </label>
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  value={formData.otp}
                  onChange={handleChange}
                  placeholder="Enter 6-digit code"
                  className="w-full px-3 py-2 rounded-md focus:outline-none bg-gray-50 text-center text-xl tracking-widest"
                  disabled={loading}
                  required
                  maxLength="6"
                  pattern="[0-9]{6}"
                />
              </div>
              
              {(localError || signupOtp.error) && (
                <div className="error-message text-red-600 text-sm">
                  {localError || signupOtp.error}
                </div>
              )}

              {signupOtp.message && !signupOtp.error && (
                <div className="text-green-600 text-sm">
                  {signupOtp.message}
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                style={{
                  backgroundColor: '#733857'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8d4466'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#733857'}
              >
                {loading ? 'Verifying...' : 'Verify & Create Account'}
              </button>

              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-sm text-gray-500">
                    Resend code in {resendTimer}s
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={loading}
                    className="text-sm text-[#733857] hover:underline disabled:opacity-50"
                  >
                    Resend Code
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setFormData({ ...formData, otp: '' });
                }}
                className="w-full text-gray-600 text-sm hover:underline"
              >
                ← Change Email
              </button>
            </form>
          )}
        </>
      ) : (
        // Sign In Form (no OTP needed)
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="w-full px-3 py-2 rounded-md focus:outline-none bg-gray-50"
              disabled={loading}
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="w-full px-3 py-2 rounded-md focus:outline-none bg-gray-50"
              disabled={loading}
              required
              minLength="6"
            />
          </div>
          
          {localError && (
            <div className="error-message text-red-600 text-sm">
              {localError}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            style={{
              backgroundColor: '#733857'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8d4466'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#733857'}
          >
            {loading ? 'Processing...' : 'Sign In'}
          </button>
        </form>
      )}
    </div>
  );
};

export default EmailAuth;