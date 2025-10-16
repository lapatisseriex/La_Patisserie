import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn';
import EmailAuth from '../EmailAuth/EmailAuth';
import ForgotPassword from '../ForgotPassword/ForgotPassword';
import { 
  X, 
  User, 
  UserPlus, 
  Mail, 
  ArrowRight, 
  Shield, 
  Heart, 
  CheckCircle, 
  Star,
  Lock 
} from 'lucide-react';
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

  // Handle auth events when modal is open
  useEffect(() => {
    if (!isAuthPanelOpen) return;

    const handleAuthCancelled = (event) => {
      console.log('Auth cancelled in modal:', event.detail);
      // Clear any errors and reset state
      clearError();
      // Reset to default tab
      setActiveTab('login');
      changeAuthType('login');
    };

    const handleNetworkError = (event) => {
      console.log('Network error in modal:', event.detail);
      // Let the AuthContext handle the error display
      // Modal stays open so user can retry
    };

    window.addEventListener('auth:cancelled', handleAuthCancelled);
    window.addEventListener('network:error', handleNetworkError);

    return () => {
      window.removeEventListener('auth:cancelled', handleAuthCancelled);
      window.removeEventListener('network:error', handleNetworkError);
    };
  }, [isAuthPanelOpen, clearError, changeAuthType]);

  if (!isAuthPanelOpen) return null;

  const handleClose = () => {
    // Clear any errors before closing
    clearError();
    
    setIsClosing(true);
    setTimeout(() => {
      toggleAuthPanel();
      setIsClosing(false);
      
      // Reset to default state
      setActiveTab('login');
      changeAuthType('login');
    }, 300); // Match animation duration
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    changeAuthType(tab);
    clearError(); // Clear any existing errors when switching tabs
  };

  return (
    <>
      {/* Elegant Backdrop - Profile Style */}
      <div 
        className={`fixed inset-0 z-50 bg-black bg-opacity-50 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleClose}
      />
      
      {/* Elegant Sidepanel - Profile Hero Styling */}
      <div className={`fixed top-0 right-0 bottom-0 z-[9999] w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-out ${isClosing ? 'translate-x-full' : 'translate-x-0'} flex flex-col`}>
        
        {/* Sharp Header - Orders Theme */}
        <div className="bg-white px-6 py-4" style={{borderBottom: '2px solid rgba(115, 56, 87, 0.2)'}}>
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center justify-center">
              <img 
                src="/images/logo.png" 
                alt="La Pâtisserie Logo" 
                className="h-12 w-12 object-contain" 
              />
            </div>
            
            {/* Welcome Text */}
            <h1 
              className="text-lg font-bold tracking-wide uppercase flex-1 text-center" 
              style={{color: '#281c20', fontFamily: 'system-ui, -apple-system, sans-serif'}}
            >
              {authType === 'forgot-password' ? 'RESET PASSWORD' : 'WELCOME TO LA PATISSERIE'}
            </h1>
            
            {/* Close Button */}
            <button 
              onClick={handleClose}
              className="p-2 hover:opacity-80 transition-all duration-200"
              style={{color: '#281c20'}}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area - Sharp Square Design with Blue Scroller */}
        <div className="flex-1 overflow-y-auto px-6 py-6 blue-scroller">
          {authType === 'forgot-password' ? (
            /* Sharp Square Forgot Password - Orders Theme */
            <div className="space-y-4">
              <div className="text-center">
                <div 
                  className="w-12 h-12 flex items-center justify-center mx-auto mb-3"
                  style={{
                    backgroundColor: '#733857',
                    border: '2px solid #412434'
                  }}
                >
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <h3 
                  className="text-sm font-bold mb-2 tracking-wide uppercase" 
                  style={{color: '#281c20', fontFamily: 'system-ui, -apple-system, sans-serif'}}
                >
                  FORGOT PASSWORD?
                </h3>
                <p 
                  className="text-gray-600 text-xs leading-relaxed font-medium" 
                  style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}
                >
                  Enter email for reset instructions.
                </p>
              </div>
              <ForgotPassword />
            </div>
          ) : (
            <>
              {/* Continue with Email Header */}
              <div className="mb-6">
                <h2 
                  className="text-sm font-bold tracking-wide uppercase text-center"
                  style={{color: '#733857', fontFamily: 'system-ui, -apple-system, sans-serif'}}
                >
                  CONTINUE WITH EMAIL
                </h2>
              </div>

              {/* Email Auth Form */}
              <div className="mb-6">
                <EmailAuth isSignUp={activeTab === 'signup'} />
              </div>
              
              {/* Bottom Navigation Row */}
              <div className="flex items-center justify-between mb-6">
                {/* Left: New Here / Have Account */}
                <div className="text-left">
                  {activeTab === 'login' ? (
                    <span
                      onClick={() => switchTab('signup')}
                      className="cursor-pointer text-sm tracking-wide uppercase transition-all duration-300 hover:opacity-80"
                      style={{
                        color: '#733857',
                        fontFamily: 'system-ui, -apple-system, sans-serif'
                      }}
                    >
                      NEW HERE? <strong>SIGN UP</strong>
                    </span>
                  ) : (
                    <span
                      onClick={() => switchTab('login')}
                      className="cursor-pointer text-sm tracking-wide uppercase transition-all duration-300 hover:opacity-80"
                      style={{
                        color: '#733857',
                        fontFamily: 'system-ui, -apple-system, sans-serif'
                      }}
                    >
                      HAVE ACCOUNT? <strong>SIGN IN</strong>
                    </span>
                  )}
                </div>
                
                {/* Right: Forgot Password (only show on login) */}
                {activeTab === 'login' && (
                  <div className="text-right">
                    <span
                      onClick={() => changeAuthType('forgot-password')}
                      className="cursor-pointer text-sm transition-all duration-300 hover:opacity-80"
                      style={{
                        color: '#733857',
                        fontFamily: 'system-ui, -apple-system, sans-serif'
                      }}
                    >
                      FORGOT PASSWORD?
                    </span>
                  </div>
                )}
              </div>

              {/* OR Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2" style={{borderColor: 'rgba(115, 56, 87, 0.3)'}} />
                </div>
                <div className="relative flex justify-center">
                  <span 
                    className="px-4 py-1 bg-white font-bold text-xs tracking-wide uppercase"
                    style={{
                      color: '#733857',
                      fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}
                  >
                    OR
                  </span>
                </div>
              </div>

              {/* Continue with Google */}
              <div>
                <GoogleSignIn />
              </div>
            </>
          )}
        </div>


      </div>
    </>
  );
};

export default NewAuthModal;