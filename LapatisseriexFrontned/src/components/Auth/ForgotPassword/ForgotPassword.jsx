import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { Mail, Lock, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import '../auth.css';

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
    <div className="space-y-4">
      {/* Clean Form */}
      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <div>
          <label 
            htmlFor="email" 
            className="block text-sm font-medium mb-1"
            style={{ color: '#281c20', fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            Email Address
           
          </label>
          <div className="relative">
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email address"
              className="w-full px-3 py-2 focus:outline-none bg-gray-50 border border-gray-200"
              style={{ 
                fontFamily: 'system-ui, -apple-system, sans-serif',
                borderColor: loginFormEmail ? 'rgba(115, 56, 87, 0.3)' : '#e5e7eb'
              }}
              required
              disabled={passwordReset.loading}
            />
            {loginFormEmail && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Check className="w-4 h-4" style={{ color: '#733857' }} />
              </div>
            )}
          </div>
        
        </div>

        {passwordReset.error && (
          <div 
            className="flex items-center space-x-2 text-sm p-3"
            style={{ 
              color: '#dc2626',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca'
            }}
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>{passwordReset.error}</span>
          </div>
        )}

        {passwordReset.message && !passwordReset.error && (
          <div 
            className="flex items-center space-x-2 text-sm p-3"
            style={{ 
              color: '#733857',
              backgroundColor: 'rgba(115, 56, 87, 0.05)',
              border: '1px solid rgba(115, 56, 87, 0.2)'
            }}
          >
            <Check className="h-4 w-4 flex-shrink-0" />
            <span style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>{passwordReset.message}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={passwordReset.loading || !formData.email.trim()}
          className="w-full text-white py-2 px-4 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          style={{
            backgroundColor: '#733857',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '14px',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => !passwordReset.loading && (e.currentTarget.style.backgroundColor = '#8d4466')}
          onMouseLeave={(e) => !passwordReset.loading && (e.currentTarget.style.backgroundColor = '#733857')}
        >
          {passwordReset.loading ? 'SENDING...' : 'SEND VERIFICATION CODE'}
        </button>

        <button
          type="button"
          onClick={handleBackToLogin}
          className="w-full flex items-center justify-center space-x-2 py-2 transition-all duration-200 hover:opacity-80"
          style={{ 
            color: '#733857',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '14px'
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>BACK TO SIGN IN</span>
        </button>
      </form>
    </div>
  );

  const renderOTPStep = () => (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="text-center mb-6">
        <p 
          className="text-sm mb-1"
          style={{ 
            color: '#281c20', 
            fontFamily: 'system-ui, -apple-system, sans-serif' 
          }}
        >
          We've sent a 6-digit verification code to:
        </p>
        <p 
          className="text-sm font-medium"
          style={{ 
            color: '#733857',
            fontFamily: 'system-ui, -apple-system, sans-serif' 
          }}
        >
          {passwordReset.email}
        </p>
      </div>

      <form onSubmit={handleOTPSubmit} className="space-y-4">
        <div>
          <label 
            htmlFor="otp" 
            className="block text-sm font-medium mb-1"
            style={{ color: '#281c20', fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            Verification Code
          </label>
          <input
            type="text"
            id="otp"
            name="otp"
            value={formData.otp}
            onChange={handleChange}
            placeholder="Enter 6-digit code"
            className="w-full px-3 py-2 focus:outline-none bg-gray-50 border border-gray-200 text-center text-lg tracking-widest"
            style={{ 
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
            maxLength={6}
            pattern="\d{6}"
            required
            disabled={passwordReset.loading}
          />
        </div>

        {passwordReset.error && (
          <div 
            className="flex items-center space-x-2 text-sm p-3"
            style={{ 
              color: '#dc2626',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca'
            }}
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>{passwordReset.error}</span>
          </div>
        )}

        {passwordReset.message && !passwordReset.error && (
          <div 
            className="flex items-center space-x-2 text-sm p-3"
            style={{ 
              color: '#733857',
              backgroundColor: 'rgba(115, 56, 87, 0.05)',
              border: '1px solid rgba(115, 56, 87, 0.2)'
            }}
          >
            <Check className="h-4 w-4 flex-shrink-0" />
            <span style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>{passwordReset.message}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={passwordReset.loading || formData.otp.length !== 6}
          className="w-full text-white py-2 px-4 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          style={{
            backgroundColor: '#733857',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '14px',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => !passwordReset.loading && (e.currentTarget.style.backgroundColor = '#8d4466')}
          onMouseLeave={(e) => !passwordReset.loading && (e.currentTarget.style.backgroundColor = '#733857')}
        >
          {passwordReset.loading ? 'VERIFYING...' : 'VERIFY CODE'}
        </button>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => sendPasswordResetOTP(passwordReset.email)}
            disabled={passwordReset.loading}
            className="transition-all duration-200 hover:opacity-80 disabled:opacity-50"
            style={{ 
              color: '#733857',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          >
            RESEND CODE
          </button>
          <button
            type="button"
            onClick={() => {
              resetPasswordState();
            }}
            className="transition-all duration-200 hover:opacity-80"
            style={{ 
              color: '#733857',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          >
            CHANGE EMAIL
          </button>
        </div>
      </form>
    </div>
  );

  const renderPasswordStep = () => (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="text-center mb-6">
        <p 
          className="text-sm"
          style={{ 
            color: '#281c20', 
            fontFamily: 'system-ui, -apple-system, sans-serif' 
          }}
        >
          Choose a strong password for your account
        </p>
      </div>

      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        <div>
          <label 
            htmlFor="newPassword" 
            className="block text-sm font-medium mb-1"
            style={{ color: '#281c20', fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            New Password
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            id="newPassword"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            placeholder="Enter new password"
            className="w-full px-3 py-2 focus:outline-none bg-gray-50 border border-gray-200"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            minLength={6}
            required
            disabled={passwordReset.loading}
          />
        </div>

        <div>
          <label 
            htmlFor="confirmPassword" 
            className="block text-sm font-medium mb-1"
            style={{ color: '#281c20', fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            Confirm New Password
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm new password"
            className="w-full px-3 py-2 focus:outline-none bg-gray-50 border border-gray-200"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
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
            className="h-4 w-4 border-gray-300"
            style={{ accentColor: '#733857' }}
          />
          <label 
            htmlFor="showPassword" 
            className="ml-2 block text-sm"
            style={{ color: '#281c20', fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            Show passwords
          </label>
        </div>

        {formData.newPassword && formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
          <div 
            className="text-sm"
            style={{ 
              color: '#dc2626',
              fontFamily: 'system-ui, -apple-system, sans-serif' 
            }}
          >
            Passwords do not match
          </div>
        )}

        {formData.newPassword && formData.newPassword.length < 6 && (
          <div 
            className="text-sm"
            style={{ 
              color: '#dc2626',
              fontFamily: 'system-ui, -apple-system, sans-serif' 
            }}
          >
            Password must be at least 6 characters long
          </div>
        )}

        {passwordReset.error && (
          <div 
            className="flex items-center space-x-2 text-sm p-3"
            style={{ 
              color: '#dc2626',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca'
            }}
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>{passwordReset.error}</span>
          </div>
        )}

        {passwordReset.message && !passwordReset.error && (
          <div 
            className="flex items-center space-x-2 text-sm p-3"
            style={{ 
              color: '#733857',
              backgroundColor: 'rgba(115, 56, 87, 0.05)',
              border: '1px solid rgba(115, 56, 87, 0.2)'
            }}
          >
            <Check className="h-4 w-4 flex-shrink-0" />
            <span style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>{passwordReset.message}</span>
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
          className="w-full text-white py-2 px-4 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          style={{
            backgroundColor: '#733857',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '14px',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => !passwordReset.loading && (e.currentTarget.style.backgroundColor = '#8d4466')}
          onMouseLeave={(e) => !passwordReset.loading && (e.currentTarget.style.backgroundColor = '#733857')}
        >
          {passwordReset.loading ? 'RESETTING...' : 'RESET PASSWORD'}
        </button>
      </form>
    </div>
  );

  return (
    <div className="forgot-password-container">
      {passwordReset.step === 'email' && renderEmailStep()}
      {passwordReset.step === 'otp' && renderOTPStep()}
      {passwordReset.step === 'password' && renderPasswordStep()}
    </div>
  );
};

export default ForgotPassword;