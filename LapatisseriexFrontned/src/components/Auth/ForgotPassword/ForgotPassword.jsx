import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { Mail, Lock, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ForgotPassword = () => {
  const { 
    passwordReset, 
    sendPasswordResetOTP, 
    verifyPasswordResetOTP, 
    resetPassword,
    resetPasswordState,
    changeAuthType,
    loginFormEmail 
  } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);

  // Initialize email from login form when component mounts
  useEffect(() => {
    if (loginFormEmail && !formData.email) {
      setFormData(prev => ({
        ...prev,
        email: loginFormEmail
      }));
    }
  }, [loginFormEmail]); // Only depend on loginFormEmail

  // Initialize component
  useEffect(() => {
    return () => {
      // Clean up on unmount
      resetPasswordState();
    };
  }, []); // Empty dependency array to prevent infinite loop

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      return;
    }
    await sendPasswordResetOTP(formData.email.trim());
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    if (!formData.otp.trim()) {
      return;
    }
    await verifyPasswordResetOTP(passwordReset.email, formData.otp.trim());
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      return;
    }
    
    if (formData.newPassword.length < 6) {
      return;
    }
    
    const result = await resetPassword(passwordReset.email, formData.newPassword);
    
    // If successful, reset will automatically switch to login
    if (result.type.endsWith('/fulfilled')) {
      setFormData({ email: '', otp: '', newPassword: '', confirmPassword: '' });
    }
  };

  const handleBackToLogin = () => {
    if (!formData.email.trim()) {
      // If no email is entered, warn user
      setFormData(prev => ({ ...prev, email: '' }));
    }
    resetPasswordState();
    changeAuthType('login');
  };

  const renderEmailStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="h-6 w-6 text-pink-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Forgot Your Password?
        </h3>
        <p className="text-sm text-gray-600">
          {loginFormEmail ? 
            'We\'ve pre-filled your email address. Confirm it below and we\'ll send you a verification code.' :
            'Enter your email address and we\'ll send you a verification code to reset your password.'
          }
        </p>
        {!loginFormEmail && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-700">
              💡 <strong>Tip:</strong> Next time, enter your email in the sign-in form first, then click "Forgot password" for a faster experience.
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
            {loginFormEmail && (
              <span className="ml-2 inline-flex items-center text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                <Check className="w-3 h-3 mr-1" />
                Pre-filled
              </span>
            )}
          </label>
          <div className="relative">
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email address"
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                loginFormEmail ? 'bg-green-50 border-green-300' : ''
              }`}
              required
              disabled={passwordReset.loading}
            />
            {loginFormEmail && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Check className="w-5 h-5 text-green-600" />
              </div>
            )}
          </div>
          {loginFormEmail && (
            <p className="mt-1 text-xs text-green-600">
              Email automatically filled from sign-in form
            </p>
          )}
        </div>

        {passwordReset.error && (
          <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{passwordReset.error}</span>
          </div>
        )}

        {passwordReset.message && !passwordReset.error && (
          <div className="flex items-center space-x-2 text-green-600 text-sm bg-green-50 p-3 rounded-md">
            <Check className="h-4 w-4 flex-shrink-0" />
            <span>{passwordReset.message}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={passwordReset.loading || !formData.email.trim()}
          className="w-full bg-pink-600 text-white py-2 px-4 rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {passwordReset.loading ? 'Sending...' : 'Send Verification Code'}
        </button>

        <button
          type="button"
          onClick={handleBackToLogin}
          className="w-full flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-800 py-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Sign In</span>
        </button>
      </form>
    </motion.div>
  );

  const renderOTPStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="h-6 w-6 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Check Your Email
        </h3>
        <p className="text-sm text-gray-600">
          We've sent a 6-digit verification code to
        </p>
        <p className="text-sm font-medium text-gray-900 mt-1">
          {passwordReset.email}
        </p>
      </div>

      <form onSubmit={handleOTPSubmit} className="space-y-4">
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-center text-lg tracking-widest"
            maxLength={6}
            pattern="\d{6}"
            required
            disabled={passwordReset.loading}
          />
        </div>

        {passwordReset.error && (
          <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{passwordReset.error}</span>
          </div>
        )}

        {passwordReset.message && !passwordReset.error && (
          <div className="flex items-center space-x-2 text-green-600 text-sm bg-green-50 p-3 rounded-md">
            <Check className="h-4 w-4 flex-shrink-0" />
            <span>{passwordReset.message}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={passwordReset.loading || formData.otp.length !== 6}
          className="w-full bg-pink-600 text-white py-2 px-4 rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {passwordReset.loading ? 'Verifying...' : 'Verify Code'}
        </button>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => sendPasswordResetOTP(passwordReset.email)}
            disabled={passwordReset.loading}
            className="text-pink-600 hover:text-pink-700 disabled:opacity-50"
          >
            Resend code
          </button>
          <button
            type="button"
            onClick={() => {
              resetPasswordState();
            }}
            className="text-gray-600 hover:text-gray-800"
          >
            Change email
          </button>
        </div>
      </form>
    </motion.div>
  );

  const renderPasswordStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Lock className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Create New Password
        </h3>
        <p className="text-sm text-gray-600">
          Choose a strong password for your account
        </p>
      </div>

      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            id="newPassword"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            placeholder="Enter new password"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            minLength={6}
            required
            disabled={passwordReset.loading}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm New Password
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm new password"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            minLength={6}
            required
            disabled={passwordReset.loading}
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="showPassword"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
            className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
          />
          <label htmlFor="showPassword" className="ml-2 block text-sm text-gray-700">
            Show passwords
          </label>
        </div>

        {formData.newPassword && formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
          <div className="text-red-600 text-sm">
            Passwords do not match
          </div>
        )}

        {formData.newPassword && formData.newPassword.length < 6 && (
          <div className="text-red-600 text-sm">
            Password must be at least 6 characters long
          </div>
        )}

        {passwordReset.error && (
          <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{passwordReset.error}</span>
          </div>
        )}

        {passwordReset.message && !passwordReset.error && (
          <div className="flex items-center space-x-2 text-green-600 text-sm bg-green-50 p-3 rounded-md">
            <Check className="h-4 w-4 flex-shrink-0" />
            <span>{passwordReset.message}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={
            passwordReset.loading || 
            !formData.newPassword || 
            !formData.confirmPassword || 
            formData.newPassword !== formData.confirmPassword ||
            formData.newPassword.length < 6
          }
          className="w-full bg-pink-600 text-white py-2 px-4 rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {passwordReset.loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </motion.div>
  );

  return (
    <div className="forgot-password-container">
      <AnimatePresence mode="wait">
        {passwordReset.step === 'email' && (
          <div key="email">{renderEmailStep()}</div>
        )}
        {passwordReset.step === 'otp' && (
          <div key="otp">{renderOTPStep()}</div>
        )}
        {passwordReset.step === 'password' && (
          <div key="password">{renderPasswordStep()}</div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ForgotPassword;