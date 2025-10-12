import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn';
import EmailAuth from '../EmailAuth/EmailAuth';
import ForgotPassword from '../ForgotPassword/ForgotPassword';
import { X } from 'lucide-react';
import '../auth.css';

const NewAuthModal = () => {
  const { isAuthPanelOpen, toggleAuthPanel, authType, changeAuthType, clearError } = useAuth();
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'signup'
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isAuthPanelOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll when modal is closed
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isAuthPanelOpen]);

  if (!isAuthPanelOpen) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      toggleAuthPanel();
      setIsClosing(false);
    }, 300); // Match animation duration
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    changeAuthType(tab);
    clearError(); // Clear any existing errors when switching tabs
  };

  return (
    <div 
      className={`auth-modal-backdrop-right ${isClosing ? 'closing' : ''}`}
      onClick={handleClose}
    >
      <div 
        className={`auth-modal-content-right ${isClosing ? 'closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-all duration-200 p-2 rounded-full hover:bg-gray-100 z-10 hover:scale-110"
        >
          <X size={24} />
        </button>
        
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-5">
          <h2 className="text-xl font-semibold text-gray-900">
            {authType === 'forgot-password' ? 'Reset Password' : (activeTab === 'login' ? 'Sign In' : 'Create Account')}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {authType === 'forgot-password' ? 'Secure password reset for your account' : (activeTab === 'login' ? 'Welcome back to La Pâtisserie' : 'Join La Pâtisserie today')}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {authType === 'forgot-password' ? (
            /* Forgot Password Flow */
            <ForgotPassword />
          ) : (
            <>
              {/* Tab Navigation - Professional */}
              <div className="flex border-b border-gray-200 mb-6">
                <button
                  onClick={() => switchTab('login')}
                  className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-all duration-200 ${
                    activeTab === 'login'
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => switchTab('signup')}
                  className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-all duration-200 ${
                    activeTab === 'signup'
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Auth Content with smooth transition */}
              <div className="tab-content" key={activeTab}>
                {/* Google Sign In */}
                <div className="mb-6">
                  <GoogleSignIn />
                </div>

                {/* Divider */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500 font-medium">Or continue with email</span>
                  </div>
                </div>

                {/* Email Auth */}
                <EmailAuth isSignUp={activeTab === 'signup'} />
                
                {/* Tab Footer */}
                <div className="mt-8 text-center text-sm text-gray-600">
                  {activeTab === 'login' ? (
                    <p>
                      Don't have an account?{' '}
                      <button
                        onClick={() => switchTab('signup')}
                        className="text-pink-600 hover:text-pink-700 font-semibold transition-colors duration-200"
                      >
                        Sign up
                      </button>
                    </p>
                  ) : (
                    <p>
                      Already have an account?{' '}
                      <button
                        onClick={() => switchTab('login')}
                        className="text-pink-600 hover:text-pink-700 font-semibold transition-colors duration-200"
                      >
                        Sign in
                      </button>
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
          
          {/* Professional Footer */}
          <div className="text-center mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Secure authentication powered by Firebase
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewAuthModal;