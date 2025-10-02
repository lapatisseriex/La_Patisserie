import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import ReduxLogin from './Login/ReduxLogin';
import ReduxOTPVerify from './OTPVerify/ReduxOTPVerify';
import ReduxProfile from './Profile/ReduxProfile';

/**
 * Redux-powered AuthModal component
 * This replaces the old context-based modal while maintaining the same interface
 */
const ReduxAuthModal = () => {
  const {
    isAuthPanelOpen,
    authType,
    setIsAuthPanelOpen,
    clearError,
  } = useAuth();

  const handleClose = () => {
    setIsAuthPanelOpen(false);
    clearError();
  };

  if (!isAuthPanelOpen) {
    return null;
  }

  const renderAuthContent = () => {
    switch (authType) {
      case 'login':
      case 'signup':
        return <ReduxLogin />;
      case 'otp':
        return <ReduxOTPVerify />;
      case 'profile':
        return <ReduxProfile />;
      default:
        return <ReduxLogin />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        {renderAuthContent()}
      </div>
    </div>
  );
};

export default ReduxAuthModal;