import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

// Auth components
import Login from '../Login/Login';
import Signup from '../Signup/Signup';
import OTPVerify from '../OTPVerify/OTPVerify';
import Profile from '../Profile/Profile';

const AuthModal = () => {
  const { authType, isAuthPanelOpen, toggleAuthPanel } = useAuth();
  const modalRef = useRef();
  
  // Close modal when clicking outside (except for profile completion screen)
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If it's profile completion, don't allow closing by clicking outside
      if (authType === 'profile') {
        return;
      }
      
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        toggleAuthPanel();
      }
    };
    
    if (isAuthPanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAuthPanelOpen, toggleAuthPanel, authType]);
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isAuthPanelOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isAuthPanelOpen]);

  if (!isAuthPanelOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-500 ease-in-out z-50 ${
          isAuthPanelOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
        }`}
        onClick={toggleAuthPanel}
        style={{ backdropFilter: 'blur(2px)' }}
      ></div>
      
      {/* Slide-in Auth Panel from right */}
      <div 
        ref={modalRef}
        className={`fixed top-0 right-0 h-full bg-white z-[51] w-full sm:max-w-md shadow-xl transform transition-all duration-500 ease-in-out ${
          isAuthPanelOpen ? 'translate-x-0 animate-slideIn' : 'translate-x-full'
        }`}
        style={{ boxShadow: '-5px 0 25px rgba(0,0,0,0.1)' }}
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-black">
            {authType === 'login' && 'Login to La Patisserie'}
            {authType === 'signup' && 'Create an Account'}
            {authType === 'otp' && 'Verify OTP'}
            {authType === 'profile' && 'Complete Your Profile'}
          </h2>
          {/* Hide close button for profile completion to force users to complete their profile */}
          {authType !== 'profile' && (
            <button
              onClick={toggleAuthPanel}
              className="p-2 rounded-full hover:bg-gray-200 transition-all duration-300 ease-in-out hover:rotate-90"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-black" />
            </button>
          )}
        </div>
        
        {/* Auth content with transitions */}
        <div className="p-6 h-[calc(100%-70px)] overflow-y-auto">
          <div className="animate-fadeIn transition-all duration-300 ease-in-out">
            {authType === 'login' && <Login />}
            {authType === 'signup' && <Signup />}
            {authType === 'otp' && <OTPVerify />}
            {authType === 'profile' && <Profile />}
          </div>
        </div>
        
        {/* reCAPTCHA container - required for Firebase auth */}
        <div id="recaptcha-container"></div>
      </div>
    </>
  );
};

export default AuthModal;





