import React, { useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { toast } from 'react-toastify';

const PhoneVerificationTest = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  useEffect(() => {
    // Cleanup function to clear reCAPTCHA when component unmounts
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const setupRecaptcha = () => {
    try {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (error) {
          console.error('Error clearing reCAPTCHA:', error);
        }
        window.recaptchaVerifier = null;
      }

      const container = document.getElementById('recaptcha-container');
      if (!container) {
        throw new Error('reCAPTCHA container not found');
      }

      // Create new RecaptchaVerifier with correct parameter order for Firebase v10+
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        container,
        {
          size: 'invisible',
          callback: (response) => {
            console.log('reCAPTCHA solved successfully', response);
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired');
            toast.error('Verification expired. Please try again.');
            if (window.recaptchaVerifier) {
              try {
                window.recaptchaVerifier.clear();
              } catch (error) {
                console.error('Error clearing expired reCAPTCHA:', error);
              }
              window.recaptchaVerifier = null;
            }
          }
        }
      );

      console.log('reCAPTCHA verifier created successfully');
      return window.recaptchaVerifier;
    } catch (error) {
      console.error('Error setting up reCAPTCHA:', error);
      toast.error('Error setting up verification. Please try again.');
      return null;
    }
  };

  const sendVerificationCode = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const recaptchaVerifier = setupRecaptcha();
      
      if (!recaptchaVerifier) {
        throw new Error('reCAPTCHA not initialized');
      }

      // Format phone number
      let formattedPhoneNumber = phoneNumber.trim();
      if (!formattedPhoneNumber.startsWith('+')) {
        formattedPhoneNumber = '+91' + formattedPhoneNumber.replace(/^0/, '');
      }
      
      console.log('Sending verification code to:', formattedPhoneNumber);
      
      const confirmation = await signInWithPhoneNumber(
        auth,
        formattedPhoneNumber,
        recaptchaVerifier
      );
      
      console.log('Verification code sent successfully');
      setConfirmationResult(confirmation);
      setVerificationSent(true);
      toast.success('Verification code sent successfully!');
    } catch (error) {
      console.error('Error sending verification code:', error);
      let errorMessage = 'Failed to send verification code';
      
      // Handle specific Firebase Auth errors
      if (error.code) {
        switch (error.code) {
          case 'auth/invalid-phone-number':
            errorMessage = 'Invalid phone number format. Please include country code (e.g., +1234567890)';
            break;
          case 'auth/invalid-app-credential':
            errorMessage = 'Invalid reCAPTCHA response. Please try again.';
            break;
          case 'auth/quota-exceeded':
            errorMessage = 'SMS quota exceeded. Please try again later.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many requests. Please try again later.';
            break;
          default:
            errorMessage = `Error: ${error.message}`;
        }
      }
      
      toast.error(errorMessage);
      
      // Reset reCAPTCHA
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await confirmationResult.confirm(verificationCode);
      toast.success('Phone number verified successfully!');
      // Here you can handle successful verification
      // For example, update user profile or navigate to another page
    } catch (error) {
      console.error('Error verifying code:', error);
      toast.error(error.message || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Phone Verification Test
          </h2>
        </div>
        
        {!verificationSent ? (
          <form onSubmit={sendVerificationCode} className="mt-8 space-y-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number (with country code)
              </label>
              <div className="flex flex-col space-y-1">
                <input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    // Allow only numbers and + symbol
                    const value = e.target.value.replace(/[^\d+]/g, '');
                    setPhoneNumber(value);
                  }}
                  placeholder="Enter mobile number"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-sm text-gray-500">
                  Format: Enter 10 digit mobile number (e.g., 9876543210)
                </p>
              </div>
            </div>
            
            <div id="recaptcha-container" className="my-4"></div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="mt-8 space-y-6">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <input
                id="code"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PhoneVerificationTest;