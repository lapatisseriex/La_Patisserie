import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';

const Login = () => {
  const [phone, setPhone] = useState('');
  const { sendOTP, changeAuthType, authError, loading } = useAuth();
  const [localError, setLocalError] = useState('');

  // Clear local error when authError changes
  useEffect(() => {
    if (authError) {
      setLocalError(authError);
    } else {
      setLocalError('');
    }
  }, [authError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (phone.length !== 10) {
      setLocalError('Please enter a valid 10-digit mobile number');
      return;
    }
    
    // Reset error
    setLocalError('');
    
    // Try to send OTP via Firebase
    const success = await sendOTP(phone);
    
    if (!success && !authError) {
      setLocalError('Failed to send OTP. Please try again.');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with logo/icon */}
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-white">
        <div>
          <h2 className="text-2xl font-bold text-black">Login</h2>
          <p className="text-sm text-black">to access your account & orders</p>
        </div>
        <img src="/images/logo.png" alt="Dessertify Logo" className="h-12 w-12" />
      </div>
      
      <form className="flex-1 flex flex-col" onSubmit={handleSubmit}>
        {/* Form content */}
        <div className="flex-1">
          <div className="mb-8">
            <p className="text-lg font-medium text-black mb-6">Enter your phone number</p>
            
            <div className="relative">
              <div className="flex items-center border-b-2 border-white pb-2 focus-within:border-white">
                <span className="text-black font-medium mr-2">+91</span>
                <input
                  type="tel"
                  id="phone"
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  maxLength={10}
                  required
                  disabled={loading}
                  className="w-full py-2 focus:outline-none text-lg"
                />
              </div>
              
              {localError && (
                <p className="text-red-500 text-sm mt-2">{localError}</p>
              )}
            </div>
          </div>
          
          {/* Hidden recaptcha container */}
          <div id="recaptcha-container"></div>
        </div>
        
        {/* Bottom section with actions */}
        <div className="mt-auto">
          <p className="text-xs text-black mb-6">
            By clicking on Login, I accept the <span className="text-black">Terms & Conditions</span> & <span className="text-black">Privacy Policy</span>
          </p>
          
          <button 
            type="submit" 
            disabled={loading || phone.length !== 10}
            className={`w-full bg-black text-white py-3.5 rounded-lg text-lg font-medium transition-colors shadow-md ${
              loading || phone.length !== 10 
                ? 'opacity-60 cursor-not-allowed' 
                : 'hover:bg-gray-200/90'
            }`}
          >
            {loading ? 'Sending...' : 'LOGIN'}
          </button>
          
          <div className="text-center mt-4">
            <p className="text-sm text-black">
              Don't have an account?{' '}
              <button 
                type="button" 
                onClick={() => changeAuthType('signup')}
                disabled={loading}
                className="text-black font-medium hover:text-black/80 transition-colors"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Login;





