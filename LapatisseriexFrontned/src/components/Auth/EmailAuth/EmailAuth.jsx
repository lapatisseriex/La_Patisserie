import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import '../auth.css';

const EmailAuth = ({ isSignUp = false }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  
  const { signUpWithEmail, signInWithEmail, error, clearError, toggleAuthPanel, user, isAuthenticated, changeAuthType, setLoginFormEmail } = useAuth();

  // Clear local error when switching between sign in and sign up
  useEffect(() => {
    setLocalError('');
  }, [isSignUp]);

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

  const validateForm = () => {
    if (!formData.email) {
      setLocalError('Email is required');
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setLocalError('Please enter a valid email address');
      return false;
    }
    
    if (!formData.password) {
      setLocalError('Password is required');
      return false;
    }
    
    if (formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters long');
      return false;
    }
    
    if (isSignUp && formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setLocalError('');
    clearError();
    
    try {
      let success = false;
      console.log(`🔄 Starting ${isSignUp ? 'sign up' : 'sign in'} with email...`);
      
      if (isSignUp) {
        success = await signUpWithEmail({
          email: formData.email,
          password: formData.password
        });
      } else {
        success = await signInWithEmail({
          email: formData.email,
          password: formData.password
        });
      }
      
      console.log(`✅ ${isSignUp ? 'Sign up' : 'Sign in'} result:`, success);
      
      if (success) {
        console.log(`🎉 ${isSignUp ? 'Sign up' : 'Sign in'} successful, closing modal...`);
        // Small delay to allow Redux state to update
        setTimeout(() => {
          toggleAuthPanel();
        }, 100);
      } else {
        console.log(`❌ ${isSignUp ? 'Sign up' : 'Sign in'} failed`);
      }
    } catch (err) {
      console.error(`❌ ${isSignUp ? 'Sign up' : 'Sign in'} error:`, err);
      setLocalError(err.message || (isSignUp ? 'Failed to create account' : 'Failed to sign in'));
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
  }, [isAuthenticated, user, toggleAuthPanel]);

  const displayError = localError || error;

  return (
    <div className="email-auth-container">
      <form onSubmit={handleSubmit} className="space-y-4">
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            disabled={loading}
            required
            minLength="6"
          />
        </div>
        
        {isSignUp && (
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              disabled={loading}
              required
            />
          </div>
        )}
        
        {displayError && (
          <div className="error-message text-red-600 text-sm">
            {displayError}
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-pink-600 text-white py-2 px-4 rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
        </button>
        
        {!isSignUp && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                if (!formData.email.trim()) {
                  setLocalError('Please enter your email address first');
                  return;
                }
                changeAuthType('forgot-password');
              }}
              className="text-sm text-pink-600 hover:text-pink-700 transition-colors duration-200"
            >
              Forgot your password?
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default EmailAuth;